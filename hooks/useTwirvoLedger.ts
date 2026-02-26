'use client';
import { useState, useRef, useEffect } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useTwirvoLedger(connection: any, publicKey: PublicKey | null, pendingSigs: string[]) {
  const [posts, setPosts] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [statsMap, setStatsMap] = useState<Record<string, any>>({});
  const [txLedger, setTxLedger] = useState<Record<string, any>>({}); 
  const [identityHistory, setIdentityHistory] = useState<Record<string, any>>({});
  const [followersMap, setFollowersMap] = useState<Record<string, { followers: string[], following: string[] }>>({});
  const [followTimestamps, setFollowTimestamps] = useState<Record<string, Record<string, number>>>({});
  const [globalWalletList, setGlobalWalletList] = useState<string[]>([]);
  const [userStatsMap, setUserStatsMap] = useState<Record<string, { likes: string[], dislikes: string[] }>>({});
  const [communityMap, setCommunityMap] = useState<Record<string, any>>({});
  const [communityStatsMap, setCommunityStatsMap] = useState<Record<string, any>>({});
  const [userPointsMap, setUserPointsMap] = useState<Record<string, { global: number, comms: Record<string, number> }>>({});
  const [communityHistory, setCommunityHistory] = useState<Record<string, any[]>>({});
  
  const [deletedSigs, setDeletedSigs] = useState<string[]>([]); 

  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const isFetchingRef = useRef(false);

  const fetchBalance = async () => {
    if (publicKey && connection) {
      const b = await connection.getBalance(publicKey);
      setBalance(b / LAMPORTS_PER_SOL);
    }
  };

  const fetchTwirvosFromLedger = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setIsLoadingFeed(true);

    try {
      const response = await fetch('/api/log-twirvo', { cache: 'no-store' });
      const { signatures } = await response.json();
      
      const urlSig = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : null;
      const parsedSigs = [...signatures, ...pendingSigs];
      if (urlSig && urlSig.length > 60 && !urlSig.startsWith('sim_')) parsedSigs.push(urlSig);
      const allSigs = Array.from(new Set(parsedSigs));
      
      const cachedData = localStorage.getItem('twirvo_cache_v1');
      const localCache = cachedData ? JSON.parse(cachedData) : {};
      
      const rawPosts: any[] = [];
      const tempUserMap: Record<string, any> = {};
      const tempStats: Record<string, any> = {};
      const tempTxLedger: Record<string, any> = {}; 
      const tempCommunityMap: Record<string, any> = {}; 
      const tempCommunityStats: Record<string, any> = {};
      const tempCommHistory: Record<string, any[]> = {}; 

      const interactionLogs: any[] = []; 
      const commentLogs: any[] = [];
      const followLogs: any[] = [];
      const communityActionLogs: any[] = [];
      const userActionLogs: any[] = []; 
      const removalLogs: Record<string, boolean> = {}; 
      const allWallets = new Set<string>();

      const getCommStats = (id: string) => {
        if (!tempCommunityStats[id]) tempCommunityStats[id] = { likes: [], dislikes: [], members: [], postCount: 0, commentCount: 0 };
        return tempCommunityStats[id];
      };

      let simulatedTxs: any[] = [];
      try {
        const simRes = await fetch('/api/simulated-ledger', { cache: 'no-store' });
        if (simRes.ok) {
          const { signatures } = await simRes.json();
          simulatedTxs = signatures.map((line: string) => JSON.parse(line));
        }
      } catch (e) {}

      simulatedTxs.forEach((sim, index) => {
        const fakeSig = `sim_${sim.timestamp}_${index}`;
        const sender = sim.wallet || "SimulatedUserWallet123456789";
        allWallets.add(sender);
        
        tempTxLedger[fakeSig] = { sender, type: sim.type, text: sim.text, image: sim.image, link: sim.link, parent: sim.parent_post, parent_community: sim.parent_community, timestamp: sim.timestamp, isSimulated: true };
        
        if (sim.type === "username_set") tempUserMap[sender] = { ...tempUserMap[sender], username: sim.text, isSimulated: true };
        else if (sim.type === "profile_picture_set") tempUserMap[sender] = { ...tempUserMap[sender], pfp: sim.text, isSimulated: true };
        else if (sim.type === "create_community") { 
          tempCommunityMap[fakeSig] = { owner: sender, name: sim.community_name, pfp: sim.community_pfp, banner: sim.community_banner, bio: sim.community_bio, links: sim.community_links || [], token: sim.community_token || "", timestamp: sim.timestamp, isSimulated: true };
          const stats = getCommStats(fakeSig);
          if (!stats.members.includes(sender)) stats.members.push(sender);
          rawPosts.push({ signature: fakeSig, owner: sender, type: sim.type, text: `Created a new community called "${sim.community_name}"!`, image: sim.community_pfp, link: '', timestamp: sim.timestamp, parent_community: null, isSimulated: true });
          if (!tempStats[fakeSig]) tempStats[fakeSig] = { likes: [], dislikes: [], comments: [], parent: null };
        } else if (sim.type === "post") {
          rawPosts.push({ signature: fakeSig, owner: sender, type: sim.type, text: sim.text, image: sim.image, link: sim.link, timestamp: sim.timestamp, parent_community: sim.parent_community, isSimulated: true });
          if (!tempStats[fakeSig]) tempStats[fakeSig] = { likes: [], dislikes: [], comments: [], parent: null };
          if (sim.parent_community) getCommStats(sim.parent_community).postCount++;
        } else if (sim.type === "post_comment") {
          const parent = sim.parent_post;
          if (!tempStats[parent]) tempStats[parent] = { likes: [], dislikes: [], comments: [], parent: null };
          commentLogs.push({ signature: fakeSig, owner: sender, text: sim.text, image: sim.image, link: sim.link, timestamp: sim.timestamp, parent, parent_community: sim.parent_community, isSimulated: true });
          if (sim.parent_community) getCommStats(sim.parent_community).commentCount++;
        } else if (sim.type === "join_community") {
          rawPosts.push({ signature: fakeSig, owner: sender, type: sim.type, text: "Joined the community!", image: "", link: "", timestamp: sim.timestamp, parent_community: sim.parent_post || sim.text, isSimulated: true });
          if (!tempStats[fakeSig]) tempStats[fakeSig] = { likes: [], dislikes: [], comments: [], parent: null };
        }
      });

      const missingSigs = allSigs.filter((s: string) => !localCache[s]);
      if (missingSigs.length > 0) {
        setSyncProgress({ current: 0, total: missingSigs.length });
        for (let i = 0; i < missingSigs.length; i++) {
            const sig = missingSigs[i];
            try {
              const tx = await connection.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
              if (tx) { 
                localCache[sig] = tx; 
                if (i % 5 === 0) localStorage.setItem('twirvo_cache_v1', JSON.stringify(localCache)); 
              }
            } catch(err) { await sleep(500); }
            setSyncProgress({ current: i + 1, total: missingSigs.length });
            if (missingSigs.length > 5) await sleep(150);
        }
        localStorage.setItem('twirvo_cache_v1', JSON.stringify(localCache));
      }

      for (const sig of allSigs) {
        const txData = localCache[sig];
        if (txData) {
          let rawData = "";
          const accountKeys = txData.transaction.message.accountKeys || txData.transaction.message.staticAccountKeys;
          const memoIx = txData.transaction.message.instructions.find((ix: any) => {
            const index = ix.programIdIndex;
            return index !== undefined && accountKeys[index]?.toString() === MEMO_PROGRAM_ID.toString();
          });
          
          if (memoIx && 'data' in memoIx) {
            const bs58 = await import('bs58');
            rawData = new TextDecoder().decode(bs58.default.decode(memoIx.data as string));
          }

          if (rawData) {
            try {
              const cleanData = rawData.substring(rawData.indexOf('{'), rawData.lastIndexOf('}') + 1);
              const data = JSON.parse(cleanData);
              const sender = accountKeys[0].toString();
              const blockchainTS = txData.blockTime ? txData.blockTime * 1000 : null;
              const memoTS = data.timestamp;
              if (blockchainTS && Math.abs(blockchainTS - memoTS) > 90000) continue; 

              allWallets.add(sender);
              tempTxLedger[sig] = { sender, type: data.type, text: data.text, image: data.image, link: data.link, parent: data.parent_post, parent_community: data.parent_community, timestamp: data.timestamp };

              if (data.protocol === "twirvo_v1") {
                if (data.type === "remove_post" || data.type === "remove_comment") {
                  removalLogs[data.parent_post || data.text] = true; 
                } else if (data.type === "username_set") tempUserMap[sender] = { ...tempUserMap[sender], username: data.text };
                else if (data.type === "profile_picture_set") tempUserMap[sender] = { ...tempUserMap[sender], pfp: data.text };
                else if (data.type === "profile_bio_set" || data.type === "bio_set") tempUserMap[sender] = { ...tempUserMap[sender], bio: data.text };
                else if (data.type === "link_set") {
                  const links = Array.isArray(data.text) ? data.text : [data.text];
                  tempUserMap[sender] = { ...tempUserMap[sender], links: links, link: links[0] };
                }
                else if (data.type === "create_community") { 
                  tempCommunityMap[sig] = { owner: sender, name: data.community_name, pfp: data.community_pfp, banner: data.community_banner, bio: data.community_bio, links: data.community_links || [], token: data.community_token || "", timestamp: data.timestamp };
                  const stats = getCommStats(sig);
                  if (!stats.members.includes(sender)) stats.members.push(sender);
                  rawPosts.push({ signature: sig, owner: sender, type: data.type, text: `Created a new community called "${data.community_name}"!`, image: data.community_pfp, link: '', timestamp: data.timestamp, parent_community: null });
                  if (!tempStats[sig]) tempStats[sig] = { likes: [], dislikes: [], comments: [], parent: null };
                  tempCommHistory[sig] = [{ type: data.type, name: data.community_name, bio: data.community_bio, pfp: data.community_pfp, banner: data.community_banner, links: data.community_links, token: data.community_token, timestamp: data.timestamp, txSig: sig }];
                } else if (data.type === "edit_community") {
                  const target = data.parent_community;
                  if (tempCommunityMap[target] && tempCommunityMap[target].owner === sender) {
                      tempCommunityMap[target] = { 
                          ...tempCommunityMap[target], 
                          name: data.community_name ?? tempCommunityMap[target].name,
                          pfp: data.community_pfp ?? tempCommunityMap[target].pfp,
                          banner: data.community_banner ?? tempCommunityMap[target].banner,
                          bio: data.community_bio ?? tempCommunityMap[target].bio,
                          links: data.community_links ?? tempCommunityMap[target].links,
                          token: data.community_token ?? tempCommunityMap[target].token,
                      };
                      if (!tempCommHistory[target]) tempCommHistory[target] = [];
                      tempCommHistory[target].push({ type: data.type, name: data.community_name, bio: data.community_bio, pfp: data.community_pfp, banner: data.community_banner, links: data.community_links, token: data.community_token, timestamp: data.timestamp, txSig: sig });
                  }
                } else if (data.type === "delete_community") {
                  const target = data.parent_community;
                  if (tempCommunityMap[target] && tempCommunityMap[target].owner === sender) {
                      removalLogs[target] = true;
                      delete tempCommunityMap[target]; 
                  }
                } else if (data.type === "post") {
                  rawPosts.push({ signature: sig, owner: sender, type: data.type, text: data.text, image: data.image, link: data.link, timestamp: data.timestamp, parent_community: data.parent_community });
                  if (!tempStats[sig]) tempStats[sig] = { likes: [], dislikes: [], comments: [], parent: null };
                  if (data.parent_community) getCommStats(data.parent_community).postCount++;
                } else if (data.type === "post_like" || data.type === "post_dislike" || data.type === "remove_like" || data.type === "remove_dislike" || data.type === "post_comment") {
                  const parent = data.parent_post;
                  if (data.type === "post_comment") {
                    if (!tempStats[parent]) tempStats[parent] = { likes: [], dislikes: [], comments: [], parent: null };
                    commentLogs.push({ signature: sig, owner: sender, text: data.text, image: data.image, link: data.link, timestamp: data.timestamp, parent, parent_community: data.parent_community });
                    if (data.parent_community) getCommStats(data.parent_community).commentCount++;
                  } else interactionLogs.push({ sig, sender, parent, type: data.type, ts: data.timestamp, parent_community: data.parent_community });
                } else if (data.type === "follow_user" || data.type === "unfollow_user") {
                  followLogs.push({ sig, sender, target: data.text, type: data.type, ts: data.timestamp });
                } else if (data.type === "community_like" || data.type === "community_dislike" || data.type === "remove_community_like" || data.type === "remove_community_dislike" || data.type === "join_community" || data.type === "leave_community") {
                  const target = data.parent_post || data.text;
                  communityActionLogs.push({ sig, sender, target, type: data.type, ts: data.timestamp });
                  if (data.type.includes("community_like") || data.type.includes("community_dislike")) {
                    interactionLogs.push({ sig, sender, parent: target, type: data.type, ts: data.timestamp, parent_community: data.text });
                  }
                  if (data.type === "join_community") {
                     rawPosts.push({ signature: sig, owner: sender, type: data.type, text: "Joined the community!", image: "", link: "", timestamp: data.timestamp, parent_community: target });
                     if (!tempStats[sig]) tempStats[sig] = { likes: [], dislikes: [], comments: [], parent: null };
                  }
                } else if (data.type === "like_user" || data.type === "dislike_user" || data.type === "remove_user_like" || data.type === "remove_user_dislike") {
                  userActionLogs.push({ sig, sender, target: data.text || data.parent_post, type: data.type, ts: data.timestamp });
                }
              }
            } catch (e) {}
          }
        }
      }

      const isTargetDeleted = (sig: string) => {
        let curr = sig;
        let depth = 0;
        while (curr && depth < 20) {
          if (removalLogs[curr]) return true;
          if (curr.startsWith('sim_') && !tempTxLedger[curr]) return true;
          const tx = tempTxLedger[curr];
          if (!tx) break;
          if (tx.parent_community && removalLogs[tx.parent_community]) return true;
          curr = tx.parent;
          depth++;
        }
        return false;
      };

      commentLogs.forEach(c => {
        if (!isTargetDeleted(c.signature) && tempStats[c.parent]) {
          tempStats[c.parent].comments.push(c);
          if (!tempStats[c.signature]) tempStats[c.signature] = { likes: [], dislikes: [], comments: [], parent: c.parent };
          else tempStats[c.signature].parent = c.parent;
        }
      });

      interactionLogs.sort((a, b) => a.ts - b.ts);
      const activeVotes: Record<string, any> = {}; 
      interactionLogs.forEach(vote => {
        if (vote.type.startsWith('remove_')) delete activeVotes[`${vote.sender}-${vote.parent}`];
        else activeVotes[`${vote.sender}-${vote.parent}`] = vote;
      });

      Object.values(activeVotes).forEach(vote => {
        if (vote.parent.startsWith('sim_') && !tempTxLedger[vote.parent]) return;
        if (!tempStats[vote.parent]) tempStats[vote.parent] = { likes: [], dislikes: [], comments: [], parent: null };
        if (vote.type === "post_like" || vote.type === "community_like") tempStats[vote.parent].likes.push({ sig: vote.sig, sender: vote.sender });
        else if (vote.type === "post_dislike" || vote.type === "community_dislike") tempStats[vote.parent].dislikes.push({ sig: vote.sig, sender: vote.sender });
      });

      userActionLogs.sort((a, b) => a.ts - b.ts);
      const activeUserVotes: Record<string, any> = {};
      userActionLogs.forEach(log => {
        if (log.type.startsWith('remove_user_')) delete activeUserVotes[`${log.sender}-${log.target}`];
        else activeUserVotes[`${log.sender}-${log.target}`] = log;
      });
      const tempUserStats: Record<string, { likes: string[], dislikes: string[] }> = {};
      allWallets.forEach(w => tempUserStats[w] = { likes: [], dislikes: [] });
      Object.values(activeUserVotes).forEach(v => {
        if (!tempUserStats[v.target]) tempUserStats[v.target] = { likes: [], dislikes: [] };
        if (v.type === "like_user") tempUserStats[v.target].likes.push(v.sender);
        else tempUserStats[v.target].dislikes.push(v.sender);
      });

      communityActionLogs.sort((a, b) => a.ts - b.ts);
      const activeCommVotes: Record<string, any> = {};
      const activeMembers: Record<string, any> = {};
      communityActionLogs.forEach(log => {
        if (log.type.startsWith('remove_community_')) delete activeCommVotes[`${log.sender}-${log.target}`];
        else if (log.type === "community_like" || log.type === "community_dislike") activeCommVotes[`${log.sender}-${log.target}`] = log;
        else if (log.type === "join_community") activeMembers[`${log.sender}-${log.target}`] = log;
        else if (log.type === "leave_community") delete activeMembers[`${log.sender}-${log.target}`];
      });

      Object.values(activeCommVotes).forEach(v => {
        if (v.target.startsWith('sim_') && !tempTxLedger[v.target]) return;
        if (v.type === "community_like") getCommStats(v.target).likes.push(v.sender);
        else if (v.type === "community_dislike") getCommStats(v.target).dislikes.push(v.sender);
      });
      
      Object.values(activeMembers).forEach(v => {
        if (v.target.startsWith('sim_') && !tempTxLedger[v.target]) return;
        getCommStats(v.target).members.push(v.sender);
      });

      followLogs.sort((a, b) => a.ts - b.ts);
      const tempFollowers: Record<string, { followers: Set<string>, following: Set<string> }> = {};
      const tempFollowTimestamps: Record<string, Record<string, number>> = {};
      allWallets.forEach(w => {
        tempFollowers[w] = { followers: new Set(), following: new Set() };
        tempFollowTimestamps[w] = {};
      });
      followLogs.forEach(log => {
        if (!tempFollowers[log.sender]) tempFollowers[log.sender] = { followers: new Set(), following: new Set() };
        if (!tempFollowers[log.target]) tempFollowers[log.target] = { followers: new Set(), following: new Set() };
        if (log.type === "follow_user") {
          tempFollowers[log.sender].following.add(log.target);
          tempFollowers[log.target].followers.add(log.sender);
          tempFollowTimestamps[log.sender][log.target] = log.ts; 
        } else if (log.type === "unfollow_user") {
          tempFollowers[log.sender].following.delete(log.target);
          tempFollowers[log.target].followers.delete(log.sender);
          if (tempFollowTimestamps[log.sender]) delete tempFollowTimestamps[log.sender][log.target];
        }
      });

      const finalFollowersMap: Record<string, { followers: string[], following: string[] }> = {};
      Object.keys(tempFollowers).forEach(w => {
        finalFollowersMap[w] = { followers: Array.from(tempFollowers[w].followers), following: Array.from(tempFollowers[w].following) };
      });

      // PERFECTED POINT ENGINE: PERSISTENT FOREVER
      const tempPoints: Record<string, { global: number, comms: Record<string, number> }> = {};
      const addPts = (wallet: string, comm: string | null | undefined, pts: number) => {
        if (wallet.startsWith('sim_') && !tempUserMap[wallet]) return;
        if (!tempPoints[wallet]) tempPoints[wallet] = { global: 0, comms: {} };
        tempPoints[wallet].global += pts;
        if (comm) {
          if (!tempPoints[wallet].comms[comm]) tempPoints[wallet].comms[comm] = 0;
          tempPoints[wallet].comms[comm] += pts;
        }
      };

      allWallets.forEach(w => addPts(w, null, 0));
      
      rawPosts.forEach(p => {
        if (p.type === "post") addPts(p.owner, p.parent_community, 10);
        else if (p.type === "create_community") addPts(p.owner, null, 50);
        else if (p.type === "join_community") addPts(p.owner, p.parent_community, 10); // FIXED: Synchronized with UI logic
      });
      
      commentLogs.forEach(c => {
         addPts(c.owner, c.parent_community, 5);
      });
      
      Object.values(activeVotes).forEach(v => {
         addPts(v.sender, v.parent_community, 1);
      });
      
      Object.values(activeCommVotes).forEach(v => {
         addPts(v.sender, null, 1); 
      });
      
      Object.values(activeUserVotes).forEach(v => addPts(v.sender, null, 1));
      
      Object.keys(finalFollowersMap).forEach(wallet => {
        const followersCount = finalFollowersMap[wallet].followers.length;
        const followingCount = finalFollowersMap[wallet].following.length;
        addPts(wallet, null, (followersCount * 5) + (followingCount * 5)); // FIXED: Synchronized with 5pts tie logic
      });

      localStorage.setItem('twirvo_cache_v1', JSON.stringify(localCache));
      setTxLedger(tempTxLedger); setUserMap(tempUserMap); setStatsMap(tempStats); setCommunityMap(tempCommunityMap);
      setCommunityStatsMap(tempCommunityStats); setUserPointsMap(tempPoints); setFollowersMap(finalFollowersMap);
      setFollowTimestamps(tempFollowTimestamps); setUserStatsMap(tempUserStats); setCommunityHistory(tempCommHistory);
      setDeletedSigs(Object.keys(removalLogs)); 
      
      setPosts(rawPosts.filter(p => {
        if (isTargetDeleted(p.signature)) return false;
        if (p.parent_community && !tempCommunityMap[p.parent_community]) return false;
        return true;
      }));
      setGlobalWalletList(Array.from(allWallets)); fetchBalance();
    } catch (error) { console.error(error); } 
    finally { isFetchingRef.current = false; setIsLoadingFeed(false); }
  };

  useEffect(() => { if (connection && publicKey) fetchTwirvosFromLedger(); }, [connection, publicKey]);
  useEffect(() => {
    if (!connection || !publicKey) return; 
    const interval = setInterval(() => { fetchTwirvosFromLedger(true); }, 5000);
    return () => clearInterval(interval);
  }, [connection, publicKey]); 

  return {
    posts, userMap, statsMap, txLedger, followersMap, followTimestamps, 
    identityHistory, globalWalletList, isLoadingFeed, balance, syncProgress, fetchTwirvosFromLedger,
    communityMap, communityStatsMap, userPointsMap,
    userStatsMap, communityHistory, deletedSigs 
  };
}