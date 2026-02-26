'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  TransactionInstruction, 
  PublicKey, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';

import { useTwirvoUI } from '@/hooks/useTwirvoUI';
import { useTwirvoPersistence } from '@/hooks/useTwirvoPersistence';
import { useTwirvoLedger } from '@/hooks/useTwirvoLedger';
import { containsProfanity } from '@/utils/profanity'; 

export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
export const DEFAULT_PFP = "/default_profile_picture.jpg";
export const CREATOR_WALLET = new PublicKey("xYrbdj49APDxPiGxNSeG5iupxKk8VmEKCidVy2e1rCS");
export const TWIRVO_PROTOCOL_FEE = 0.0001 * LAMPORTS_PER_SOL; 
export const COMMUNITY_FEE = 0.1 * LAMPORTS_PER_SOL;

// ONBOARDING SPECIAL: These addresses bypass all protocol and community tip fees
export const PROTOCOL_WHITELIST = [
  "xYrbdj49APDxPiGxNSeG5iupxKk8VmEKCidVy2e1rCS", // Primary Admin
  "5yA6cqmdepTZbkNfEocyd71CnfHetd1jvnhZDFuifiYX"  // Testing Wallet
];

interface TwirvoContextType {
  [key: string]: any; 
}

const TwirvoContext = createContext<TwirvoContextType | undefined>(undefined);

export function TwirvoProvider({ children }: { children: React.ReactNode }) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const ui = useTwirvoUI();
  const persistence = useTwirvoPersistence(ui.triggerToast);
  
  const [isPosting, setIsPosting] = useState(false);
  const [txCountdown, setTxCountdown] = useState<number | null>(null);
  const [pendingSigs, setPendingSigs] = useState<string[]>([]); 
  const [pendingActionType, setPendingActionType] = useState<string | null>(null); 
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const ledger = useTwirvoLedger(connection, publicKey, pendingSigs);
  const currentProfile = publicKey ? ledger.userMap[publicKey.toString()] : null;

  const deletedCommunitySigs = useMemo(() => {
    return Object.values(ledger.txLedger)
      .filter(tx => tx.type === 'delete_community')
      .map(tx => tx.parent || tx.parent_community); 
  }, [ledger.txLedger]);

  const isParentDeleted = (sig: string) => {
    let current = sig;
    const visited = new Set();
    while (current && !visited.has(current)) {
      visited.add(current);
      if (ledger.deletedSigs && ledger.deletedSigs.includes(current)) return true;
      if (deletedCommunitySigs.includes(current)) return true;

      if (current && typeof current === 'string' && current.startsWith('sim_') && !ledger.txLedger[current]) return true;

      const tx = ledger.txLedger[current];
      if (!tx) break;
      if (tx.parent_community && (ledger.deletedSigs?.includes(tx.parent_community) || deletedCommunitySigs.includes(tx.parent_community))) return true;
      current = tx.parent;
    }
    return false;
  };

  const filteredStatsMap = useMemo(() => {
    const cleanMap: Record<string, any> = {};
    Object.keys(ledger.statsMap).forEach(sig => {
      const tx = ledger.txLedger[sig];
      if (sig.startsWith('sim_') && !tx) return;
      cleanMap[sig] = ledger.statsMap[sig];
    });
    return cleanMap;
  }, [ledger.statsMap, ledger.txLedger]);

  const getVisibleCommentCount = (sig: string) => {
    let count = 0;
    const visited = new Set<string>();

    const traverse = (currentSig: string) => {
      if (visited.has(currentSig)) return;
      visited.add(currentSig);

      const stats = filteredStatsMap[currentSig];
      if (!stats || !stats.comments) return;

      stats.comments.forEach((c: any) => {
        if (!persistence.hiddenPosts.includes(c.signature) && !isParentDeleted(c.signature)) {
          count++;
          traverse(c.signature);
        }
      });
    };

    traverse(sig);
    return count;
  };

  useEffect(() => {
    if (ui.pendingRoute && !ledger.isLoadingFeed) {
      const route = ui.pendingRoute;
      const myWallet = publicKey?.toString();

      const foundWalletByUsername = Object.keys(ledger.userMap).find(wallet => 
        ledger.userMap[wallet].username?.toLowerCase() === route.toLowerCase()
      );

      if (foundWalletByUsername) {
        ui.setActiveUser(foundWalletByUsername);
        ui.setView('profile');
      } 
      else {
        let isValidWallet = false;
        try {
          new PublicKey(route);
          isValidWallet = true;
        } catch (e) {
          isValidWallet = false;
        }

        if (isValidWallet) {
          if (route === myWallet || ledger.userMap[route]) {
            ui.setActiveUser(route);
            ui.setView('profile');
          } else {
            ui.triggerToast(`Wallet "${route.slice(0, 8)}..." not found in protocol index.`, "error");
            window.history.pushState({}, '', '/');
            ui.setView('feed');
          }
        } else {
          ui.triggerToast(`Could not locate a user or wallet named "${route}".`, "error");
          window.history.pushState({}, '', '/');
          ui.setView('feed');
        }
      }
      ui.setPendingRoute(null);
    }
  }, [ui.pendingRoute, ledger.isLoadingFeed, ledger.userMap, publicKey, ui]);

  useEffect(() => {
    if (ui.activeCommunity && !ledger.isLoadingFeed && Object.keys(ledger.txLedger).length > 0) {
      if (!ledger.communityMap[ui.activeCommunity] || deletedCommunitySigs.includes(ui.activeCommunity)) {
        ui.triggerToast(`Community not found or has been deleted.`, "error");
        ui.setActiveCommunity(null);
        window.history.pushState({}, '', '/');
      }
    }
  }, [ui.activeCommunity, ledger.isLoadingFeed, ledger.communityMap, ledger.txLedger, ui, deletedCommunitySigs]);

  const sortedPosts = useMemo(() => {
    let base = ledger.posts.filter(p => {
      if (persistence.blockedUsers.includes(p.owner)) return false; 
      if (persistence.hiddenPosts.includes(p.signature)) return false; 
      if (!persistence.showSimulated && p.isSimulated) return false;
      if (deletedCommunitySigs.includes(p.signature)) return false; 
      if (isParentDeleted(p.signature)) return false; 
      
      if (ui.activeCommunity) {
        if (p.parent_community !== ui.activeCommunity && p.signature !== ui.activeCommunity) return false;
      } else {
        if (p.parent_community) return false;
      }

      if (ui.userFilter) {
          const allowedUsers = ui.userFilter.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
          if (allowedUsers.length > 0) {
             const pUser = ledger.userMap[p.owner]?.username?.toLowerCase() || "";
             const pWallet = p.owner.toLowerCase();
             const matches = allowedUsers.some(u => pUser.includes(u) || pWallet.includes(u));
             if (!matches) return false;
          }
      }

      const stats = filteredStatsMap[p.signature] || { likes: [], dislikes: [], comments: [] };
      if (stats.likes.length < persistence.thresholds.minLikes || stats.likes.length > persistence.thresholds.maxLikes) return false;
      if (stats.dislikes.length < persistence.thresholds.minDislikes || stats.dislikes.length > persistence.thresholds.maxDislikes) return false;
      
      const visibleComments = getVisibleCommentCount(p.signature);
      if (visibleComments < persistence.thresholds.minComments || visibleComments > persistence.thresholds.maxComments) return false;

      return true;
    });
    
    const getStats = (sig: string) => filteredStatsMap[sig] || { likes: [], dislikes: [], comments: [] };
    const myWallet = publicKey?.toString();

    if (persistence.filter === 'following') {
      const myFollowing = ledger.followersMap[myWallet || ""]?.following || [];
      return base
        .filter(p => myFollowing.includes(p.owner) && p.owner !== myWallet)
        .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    if (persistence.filter === 'you') {
      return base
        .filter(p => p.owner === myWallet)
        .sort((a, b) => b.timestamp - a.timestamp);
    }

    if (persistence.filter === 'oldest') return base.sort((a, b) => a.timestamp - b.timestamp);
    if (persistence.filter === 'newest') return base.sort((a, b) => b.timestamp - a.timestamp);
    if (persistence.filter === 'recent') return base.sort((a, b) => b.timestamp - a.timestamp); 
    if (persistence.filter === 'liked') return base.sort((a, b) => getStats(b.signature).likes.length - getStats(a.signature).likes.length);
    if (persistence.filter === 'commented') return base.sort((a, b) => getVisibleCommentCount(b.signature) - getVisibleCommentCount(a.signature));
    
    if (persistence.filter === 'relevant') {
      const getScore = (text: string) => {
        let score = 0;
        persistence.positiveKeywords.toLowerCase().split(',').forEach(k => { if (text.toLowerCase().includes(k.trim())) score += 10; });
        persistence.negativeKeywords.toLowerCase().split(',').forEach(k => { if (text.toLowerCase().includes(k.trim())) score -= 10; });
        return score;
      }
      return base.sort((a, b) => getScore(b.text) - getScore(a.text));
    }
    return base;
  }, [ledger.posts, persistence.filter, persistence.positiveKeywords, persistence.negativeKeywords, filteredStatsMap, persistence.showSimulated, persistence.thresholds, persistence.hiddenPosts, persistence.blockedUsers, ledger.followersMap, publicKey, ui.activeCommunity, deletedCommunitySigs, ui.userFilter]);

  const myNotifications = useMemo(() => {
    if (!publicKey) return [];
    const myWallet = publicKey.toString();
    const myFollowing = ledger.followersMap[myWallet]?.following || [];
    const myJoinedComms = Object.keys(ledger.communityStatsMap).filter(sig => ledger.communityStatsMap[sig].members.includes(myWallet));
    const myCreatedComms = Object.keys(ledger.communityMap).filter(sig => ledger.communityMap[sig].owner === myWallet);
    const notifs: any[] = [];

    const hasBlockedAncestry = (sig: string) => {
      let current = sig;
      while (current) {
        const tx = ledger.txLedger[current];
        if (!tx) break;
        if (persistence.blockedUsers.includes(tx.sender)) return true;
        current = tx.parent; 
      }
      return false;
    };

    Object.keys(ledger.txLedger).forEach(sig => {
      const tx = ledger.txLedger[sig];
      if (tx.sender === myWallet) return;
      if (persistence.blockedUsers.includes(tx.sender)) return; 
      if (persistence.dismissedNotifs.includes(sig)) return;
      if (tx.parent && hasBlockedAncestry(tx.parent)) return;
      if (isParentDeleted(sig)) return; 

      let isRelevant = false;
      let taggedCommunity = tx.parent_community;
      
      if ((tx.type === 'post_like' || tx.type === 'post_dislike' || tx.type === 'post_comment') && tx.parent) {
        const parentTx = ledger.txLedger[tx.parent];
        if (parentTx?.sender === myWallet) {
           isRelevant = true;
        } else if (parentTx?.parent) {
           const grandParentTx = ledger.txLedger[parentTx.parent];
           if (grandParentTx?.sender === myWallet && tx.type === 'post_comment') isRelevant = true;
        }
      }
      
      if ((tx.type === 'follow_user' || tx.type === 'unfollow_user') && tx.text === myWallet) isRelevant = true;
      if ((tx.type === 'like_user' || tx.type === 'dislike_user') && (tx.text === myWallet || tx.parent_post === myWallet)) isRelevant = true;

      if ((tx.type === 'post' || tx.type === 'post_comment' || tx.type === 'create_community' || tx.type === 'join_community') && myFollowing.includes(tx.sender)) {
        const followedAt = ledger.followTimestamps?.[myWallet]?.[tx.sender] || 0;
        if (tx.timestamp >= followedAt) isRelevant = true; 
      }

      const targetComm = tx.parent_community || tx.parent || tx.text;
      if (myCreatedComms.includes(targetComm)) {
         if (tx.type === 'join_community' || tx.type === 'leave_community' || tx.type === 'community_like' || tx.type === 'community_dislike') {
           isRelevant = true;
           taggedCommunity = targetComm;
         }
      }

      if (tx.type === 'post' && tx.parent_community && myJoinedComms.includes(tx.parent_community)) isRelevant = true;

      if (isRelevant) {
        notifs.push({
          signature: sig, 
          type: tx.type, 
          sender: tx.sender, 
          timestamp: tx.timestamp,
          parent: tx.parent, 
          parent_community: taggedCommunity, 
          text: tx.text, 
          isRead: persistence.readNotifs.includes(sig),
          isSimulated: tx.isSimulated || sig.startsWith('sim_')
        });
      }
    });

    return notifs.sort((a, b) => b.timestamp - a.timestamp); 
  }, [ledger.txLedger, publicKey, ledger.followersMap, ledger.communityStatsMap, ledger.communityMap, persistence.blockedUsers, persistence.dismissedNotifs, persistence.readNotifs, ledger.followTimestamps, deletedCommunitySigs]);

  const unreadNotifCount = myNotifications.filter(n => {
    if (n.isRead) return false;
    if (!persistence.showSimulatedNotifs && n.isSimulated) return false;
    return true;
  }).length;

  const cancelTx = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTxCountdown(null);
    setIsPosting(false);
    setPendingActionType(null); 
    ui.triggerToast("Action Cancelled", "info");
  };

  const pushAction = async (type: string, text: any, parentPost?: string, extraPayload?: any) => {
    if (!connected || !publicKey) { ui.triggerToast('Wallet not connected', 'error'); return; }
    const myWallet = publicKey.toString();

    const targetSig = parentPost || text;
    
    const isCommAction = type === 'community_like' || type === 'community_dislike';
    const isUserAction = type === 'like_user' || type === 'dislike_user';

    const stats = isCommAction 
      ? (ledger.communityStatsMap[targetSig] || { likes: [], dislikes: [] })
      : (isUserAction ? (ledger.userStatsMap[targetSig] || { likes: [], dislikes: [] }) : (ledger.statsMap[targetSig] || { likes: [], dislikes: [] }));

    const likedBy = isCommAction || isUserAction ? stats.likes : stats.likes.map((l: any) => l.sender);
    const dislikedBy = isCommAction || isUserAction ? stats.dislikes : stats.dislikes.map((d: any) => d.sender);

    const alreadyLiked = likedBy.includes(myWallet);
    const alreadyDisliked = dislikedBy.includes(myWallet);

    let finalType = type;

    if (type === 'post_like' && alreadyLiked) finalType = 'remove_like';
    if (type === 'post_dislike' && alreadyDisliked) finalType = 'remove_dislike';
    if (type === 'community_like' && alreadyLiked) finalType = 'remove_community_like';
    if (type === 'community_dislike' && alreadyDisliked) finalType = 'remove_community_dislike';
    if (type === 'like_user' && alreadyLiked) finalType = 'remove_user_like';
    if (type === 'dislike_user' && alreadyDisliked) finalType = 'remove_user_dislike';

    const prettyType = finalType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    if (finalType === 'username_set') {
      if (text.length > 0 && (text.length < 4 || text.length > 24)) { ui.triggerToast("Username must be 4-24 chars", "error"); return; }
      if (currentProfile?.username === text) { ui.triggerToast("Username already written", "error"); return; }
      if (text.length > 0) {
        const isTaken = Object.values(ledger.userMap).some((u: any) => 
          u.username?.toLowerCase() === text.toLowerCase() && !u.isSimulated
        );
        if (isTaken) { ui.triggerToast("Username claimed by a real user", "error"); return; }
      }
    }
    if (finalType === 'profile_bio_set') {
      if (text.length > 0 && (text.length < 10 || text.length > 500)) { ui.triggerToast("Bio must be 10-500 chars", "error"); return; }
      if (currentProfile?.bio === text) { ui.triggerToast("Bio already written", "error"); return; }
    }
    if (finalType === 'profile_picture_set') {
      if (text.length > 0 && (text.length < 5 || text.length > 500)) { ui.triggerToast("PFP URL invalid length", "error"); return; }
      if (currentProfile?.pfp === text) { ui.triggerToast("PFP already written", "error"); return; }
    }
    
    if (finalType === 'link_set') {
      if (Array.isArray(text)) {
        if (text.length > 6) { ui.triggerToast("Maximum 6 links allowed", "error"); return; }
        const overLimit = text.some(l => l.length > 100);
        if (overLimit) { ui.triggerToast("Each link must be under 100 chars", "error"); return; }
        const currentLinks = currentProfile?.links || [];
        if (JSON.stringify(currentLinks) === JSON.stringify(text)) { ui.triggerToast("Links already written", "error"); return; }
      } else {
        if (text.length > 100) { ui.triggerToast("Link is too long", "error"); return; }
        if (currentProfile?.link === text) { ui.triggerToast("Link already written", "error"); return; }
      }
    }

    setIsPosting(true);
    setTxCountdown(90);
    setPendingActionType(prettyType); 

    timerRef.current = setInterval(() => {
      setTxCountdown(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);

    const currentTS = Date.now();
    const payload: any = { protocol: "twirvo_v1", type: finalType, text, timestamp: currentTS };
      
    if (parentPost) payload.parent_post = parentPost;
    if (ui.activeCommunity) payload.parent_community = ui.activeCommunity;
    if (extraPayload) Object.assign(payload, extraPayload);

    if (finalType === "post" || finalType === "post_comment") {
      if (ui.postImage) payload.image = ui.postImage;
      if (ui.postLink) payload.link = ui.postLink;
    }

    if (finalType === "remove_post" || finalType === "remove_comment") {
       payload.parent_post = parentPost || text;
       payload.text = '';
    }

    const sendAdminLog = async (status: 'successful' | 'failed', txSig: string | null, errorMsg?: string) => {
      try {
        await fetch('/api/admin-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: myWallet,
            type: finalType,
            status,
            txSig,
            memoPayload: payload,
            errorMsg
          })
        });
      } catch (err) {
        console.error("Failed to write to admin log", err);
      }
    };

    try {
      const isHeavyAction = (finalType === 'create_community' || finalType === 'edit_community' || finalType === 'delete_community');
      
      // CHECK WHITELIST STATUS
      const isWhitelisted = PROTOCOL_WHITELIST.includes(myWallet);
      const protocolFee = isWhitelisted ? 0 : (isHeavyAction ? COMMUNITY_FEE : TWIRVO_PROTOCOL_FEE);

      const transaction = new Transaction();
      
      // ONLY PAY PROTOCOL FEE IF NOT WHITELISTED
      if (protocolFee > 0) {
        transaction.add(
          SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: CREATOR_WALLET, lamports: protocolFee })
        );
      }

      const targetComm = ui.activeCommunity || payload.parent_community;
      if (targetComm && !isHeavyAction) {
         const commOwner = ledger.communityMap[targetComm]?.owner;
         // WHITELISTED USERS ALSO BYPASS COMMUNITY FOUNDER TIPS
         if (commOwner && commOwner !== myWallet && !isWhitelisted) {
            try {
              transaction.add(
                SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(commOwner), lamports: TWIRVO_PROTOCOL_FEE })
              );
            } catch(e) { console.error("Invalid community founder wallet"); }
         }
      }

      transaction.add(new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(JSON.stringify(payload), "utf-8"),
      }));

      const walletPromise = sendTransaction(transaction, connection);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timestamp Expired")), 88000)
      );

      const signature = await Promise.race([walletPromise, timeoutPromise]) as string;
      
      if (timerRef.current) clearInterval(timerRef.current);
      setTxCountdown(null);
      setPendingActionType(null); 

      await connection.confirmTransaction(signature, 'confirmed');
      setPendingSigs(prev => [...prev, signature]); 
      
      await fetch('/api/log-twirvo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signature }) });
      
      await sendAdminLog('successful', signature);

      ui.setReplyTo(null); ui.setMemoText(''); ui.setPostImage(''); ui.setPostLink('');
      
      ui.triggerToast(`Confirmed: ${prettyType} Successful`, 'success');
      ledger.fetchTwirvosFromLedger(true);
    } catch (e: any) { 
      if (timerRef.current) clearInterval(timerRef.current);
      setTxCountdown(null);
      setPendingActionType(null); 
      console.error(e); 
      
      const errorMessage = e.message || "Unknown error";

      await sendAdminLog('failed', null, errorMessage);

      if (errorMessage === "Timestamp Expired") {
        ui.triggerToast("Transaction Expired: Confirm within 90s", "error");
      } else {
        ui.triggerToast(`Failed: ${prettyType} Rejected`, 'error');
      }
    } finally { 
      setIsPosting(false); 
    }
  };

  return (
    <TwirvoContext.Provider value={{
      connected, publicKey, isPosting, txCountdown, cancelTx, pushAction, currentProfile,
      sortedPosts, myNotifications, unreadNotifCount, isParentDeleted, deletedCommunitySigs, pendingActionType,
      filteredStatsMap, getVisibleCommentCount, 
      ...ui, ...persistence, ...ledger
    }}>
      {children}
    </TwirvoContext.Provider>
  );
}

export const useTwirvo = () => {
  const context = useContext(TwirvoContext);
  if (context === undefined) throw new Error('useTwirvo must be used within a TwirvoProvider');
  return context;
};