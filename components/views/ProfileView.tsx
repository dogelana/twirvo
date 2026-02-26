'use client';
import React, { useState, useMemo } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import Composer from '../core/Composer';
import CommentNode from '../core/CommentNode';
import { censorText } from '@/utils/profanity';

export default function ProfileView() {
  const { 
    theme, activeUser, setActiveUser, userMap, 
    posts, statsMap, profileTab, setProfileTab,
    pushAction, replyTo, setReplyTo, setExamineSig, setAuditTab,
    triggerToast, publicKey, setView, setActiveSig, followersMap,
    communityStatsMap, communityMap, setActiveCommunity, setFilter,
    userPointsMap, deletedCommunitySigs, isParentDeleted, 
    setIdAuditSig, userStatsMap, txLedger,
    profanityFilterEnabled, 
    blockUser, unblockUser, blockedUsers, 
    hidePost, unhidePost, hiddenPosts,
    getVisibleCommentCount,
    deletedSigs 
  } = useTwirvo();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.startsWith('./')) clean = clean.substring(1); 
    if (clean.startsWith('/')) return clean; 
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  const prettifyLink = (url: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  };

  // --- PERFECTED POINTS BREAKDOWN ENGINE: PERSISTENT FOREVER ---
  // This engine mirrors the persistence logic: points are never revoked for bagwork
  const scoreBreakdown = useMemo(() => {
    if (!activeUser) return null;
    let b = { posts: 0, comments: 0, commsCreated: 0, commsJoined: 0, postVotes: 0, commVotes: 0, userVotes: 0, connections: 0 };
    
    // Correctly map signatures from ledger entries to verify authorship and ancestry
    const userTxs = Object.entries(txLedger)
      .filter(([sig, tx]: [string, any]) => tx.sender === activeUser)
      .map(([sig, tx]: [string, any]) => ({ signature: sig, ...tx }));
    
    const activePostVotes = new Set<string>();
    const activeCommVotes = new Set<string>();
    const activeUserVotes = new Set<string>();
    const activeJoins = new Set<string>();

    userTxs.forEach((tx: any) => {
       // FOR BREAKDOWN PERMANENCE: Deletion checks removed so contributor gets permanent credit
       if (tx.type === 'post') b.posts += 10;
       if (tx.type === 'post_comment') b.comments += 5;
       if (tx.type === 'create_community') {
         b.commsCreated += 50;
         // FEATURE: Founders automatically join their created community
         activeJoins.add(tx.signature); 
       }
       
       const target = tx.parent || tx.parent_post || tx.text;

       if (tx.type === 'join_community') activeJoins.add(target);
       if (tx.type === 'leave_community') activeJoins.delete(target);

       if (tx.type === 'post_like' || tx.type === 'post_dislike') activePostVotes.add(target);
       if (tx.type === 'remove_like' || tx.type === 'remove_dislike') activePostVotes.delete(target);

       if (tx.type === 'community_like' || tx.type === 'community_dislike') activeCommVotes.add(target);
       if (tx.type === 'remove_community_like' || tx.type === 'remove_community_dislike') activeCommVotes.delete(target);

       if (tx.type === 'like_user' || tx.type === 'dislike_user') {
         // Profile votes points persist ONLY if target user has had some footprint on ledger (not wiped sim)
         const targetHasHistory = Object.values(txLedger).some((t: any) => t.sender === target);
         if (targetHasHistory) activeUserVotes.add(target);
       }
       if (tx.type === 'remove_user_like' || tx.type === 'remove_user_dislike') activeUserVotes.delete(target);
    });

    // Totals are persistent based on unique acted targets
    b.commsJoined = activeJoins.size * 10;
    b.postVotes = activePostVotes.size * 1;
    b.commVotes = activeCommVotes.size * 1;
    b.userVotes = activeUserVotes.size * 1;
    b.connections = ((followersMap[activeUser]?.followers?.length || 0) * 5) + ((followersMap[activeUser]?.following?.length || 0) * 5);

    return b;
  }, [txLedger, activeUser, followersMap]);

  if (!activeUser) return null;

  const user = userMap[activeUser] || {};
  const isMe = publicKey?.toString() === activeUser;
  const points = userPointsMap[activeUser]?.global || 0;
  const displayName = user.username || activeUser.slice(0, 8);
  const profileStats = userStatsMap[activeUser] || { likes: [], dislikes: [] }; 
  const isBlocked = blockedUsers.includes(activeUser);

  // --- UI LISTS: CLEAN VIEW (STILL SCRUBS DELETIONS) ---
  const userPosts = posts.filter((p:any) => 
    p.owner === activeUser && 
    !deletedCommunitySigs.includes(p.signature) && 
    !isParentDeleted(p.signature)
  );

  const userComments: any[] = [];
  Object.keys(statsMap).forEach(sig => {
    if (deletedCommunitySigs.includes(sig) || isParentDeleted(sig)) return;
    const s = statsMap[sig];
    s.comments.forEach((c: any) => { 
      if (c.owner === activeUser && !deletedCommunitySigs.includes(c.signature) && !isParentDeleted(c.signature)) {
        userComments.push(c); 
      }
    });
  });

  const activeLikesMap = new Map();
  const activeDislikesMap = new Map();

  Object.keys(txLedger).forEach(sig => {
     const tx = { signature: sig, ...txLedger[sig] };
     if (tx.sender !== activeUser) return;
     const target = tx.parent || tx.parent_post || tx.text;
     if (!target) return;

     // VOTE OVERTAKING:SWITCHING STATES DEPRECATES OLD VOTES
     if (tx.type === 'post_like' || tx.type === 'community_like' || tx.type === 'like_user') {
       activeLikesMap.set(target, tx);
       activeDislikesMap.delete(target);
     }
     if (tx.type === 'post_dislike' || tx.type === 'community_dislike' || tx.type === 'dislike_user') {
       activeDislikesMap.set(target, tx);
       activeLikesMap.delete(target);
     }
     
     if (tx.type === 'remove_like' || tx.type === 'remove_community_like' || tx.type === 'remove_user_like') activeLikesMap.delete(target);
     if (tx.type === 'remove_dislike' || tx.type === 'remove_community_dislike' || tx.type === 'remove_user_dislike') activeDislikesMap.delete(target);
  });

  const userLikes = Array.from(activeLikesMap.values()).filter((tx:any) => {
     if (!tx) return false;
     if (tx.type.includes('user')) {
        // GHOST USER SCRUB: Hide interactions if target simulated user has been wiped from ledger state
        const target = tx.parent || tx.text;
        return Object.values(txLedger).some((t: any) => t.sender === target);
     }
     return !isParentDeleted(tx.parent || tx.parent_post || tx.text);
  });
  
  const userDislikes = Array.from(activeDislikesMap.values()).filter((tx:any) => {
     if (!tx) return false;
     if (tx.type.includes('user')) {
        const target = tx.parent || tx.text;
        return Object.values(txLedger).some((t: any) => t.sender === target);
     }
     return !isParentDeleted(tx.parent || tx.parent_post || tx.text);
  });

  const joinedComms: string[] = [];
  Object.keys(communityStatsMap).forEach(id => {
    if (deletedCommunitySigs.includes(id)) return;
    const s = communityStatsMap[id];
    if (s.members.includes(activeUser)) joinedComms.push(id);
  });

  const followers = followersMap[activeUser]?.followers || [];
  const following = followersMap[activeUser]?.following || [];

  const TABS = ['posts', 'comments', 'likes', 'dislikes', 'communities', 'followers', 'following'];
  
  const STATS = [
    { label: 'Posts', value: userPosts.length },
    { label: 'Comments', value: userComments.length },
    { label: 'Likes', value: userLikes.length },
    { label: 'Dislikes', value: userDislikes.length },
    { label: 'Communities', value: joinedComms.length },
    { label: 'Followers', value: followers.length },
    { label: 'Following', value: following.length },
  ];

  const amIFollowing = followersMap[publicKey?.toString() || ""]?.following.includes(activeUser);

  // Helper for empty states
  const EmptyNotice = ({ msg }: { msg: string }) => (
    <div className="p-24 text-center text-gray-500 font-black uppercase tracking-[0.2em] italic opacity-40">
      {msg}
    </div>
  );

  const renderPostBlock = (post: any) => {
    const stats = statsMap[post.signature] || { likes: [], dislikes: [], comments: [] };
    const pfp = formatLink(userMap[post.owner]?.pfp) || DEFAULT_PFP;
    const postUsername = userMap[post.owner]?.username || post.owner.slice(0, 8);
    const deleteAction = post.type === 'post_comment' ? "remove_comment" : "remove_post";
    
    const isHidden = hiddenPosts.includes(post.signature);
    const parentCommName = post.parent_community ? communityMap[post.parent_community]?.name : null; 
    const visibleCommentCount = getVisibleCommentCount ? getVisibleCommentCount(post.signature) : stats.comments.length;

    return (
      <div key={post.signature} className={`p-12 hover:bg-blue-500/[0.01] transition-colors relative border-b border-gray-800 ${isHidden ? 'opacity-50' : ''}`}>
        <div className="flex items-start space-x-10">
          <img src={pfp} className="w-24 h-24 rounded-full object-cover cursor-pointer border-2 border-gray-800 shadow-xl" onClick={() => { setActiveUser(post.owner); setProfileTab('posts'); }} alt="PFP" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <span className="font-black text-blue-500 text-2xl cursor-pointer tracking-tighter normal-case" onClick={() => { setActiveUser(post.owner); setProfileTab('posts'); }}>
                  {censorText(postUsername, profanityFilterEnabled)}
                </span>
                <span className="text-[10px] text-gray-500 font-mono mt-1">{new Date(post.timestamp).toLocaleString()}</span>
                {parentCommName && (
                  <button onClick={() => { setActiveCommunity(post.parent_community); setFilter('newest'); setView('feed'); window.history.pushState({}, '', `/community/${post.parent_community}`); }} className="ml-4 px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer">
                    🏛️ Posted in: {censorText(parentCommName, profanityFilterEnabled)}
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-6">
                <button onClick={() => isHidden ? unhidePost(post.signature) : hidePost(post.signature)} className="text-[10px] font-black uppercase text-gray-500 hover:text-orange-500 hover:underline tracking-widest">
                  {isHidden ? 'Unhide From Feed' : 'Hide From Feed'}
                </button>
                {publicKey?.toString() === post.owner && !post.isSimulated && post.type !== 'create_community' && post.type !== 'join_community' && (
                  <button 
                    onClick={() => {
                      if (confirmDelete === post.signature) {
                        pushAction(deleteAction, post.signature);
                        setConfirmDelete(null);
                      } else {
                        setConfirmDelete(post.signature);
                        triggerToast("Tap again to confirm deletion", "info");
                        setTimeout(() => setConfirmDelete(null), 4000);
                      }
                    }} 
                    className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                      confirmDelete === post.signature ? 'text-white bg-red-600 px-3 py-1 rounded-lg animate-pulse' : 'text-red-500 hover:underline'
                    }`}
                  >
                    {confirmDelete === post.signature ? 'Confirm Delete?' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
            {post.type === 'join_community' ? (
               <div className="mb-6 p-8 border-4 border-green-500/20 bg-green-500/5 rounded-[40px] text-center shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50 pointer-events-none"></div>
                 <span className="text-6xl relative z-10 block mb-4">🤝</span>
                 <p className="text-2xl font-medium relative z-10 leading-relaxed text-gray-400">
                   Joined the community <span className="font-black text-green-500 italic cursor-pointer hover:underline break-words whitespace-normal" onClick={() => { setActiveCommunity(post.parent_community); setFilter('newest'); setView('feed'); window.history.pushState({}, '', `/community/${post.parent_community}`); }}>
                     "{censorText(communityMap[post.parent_community]?.name || 'Unknown', profanityFilterEnabled)}"
                   </span>!
                 </p>
               </div>
            ) : post.type === 'create_community' ? (
               <div className="mb-6 p-10 border-4 border-blue-500/20 bg-blue-500/5 rounded-[40px] text-center shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50 pointer-events-none"></div>
                 <img src={formatLink(communityMap[post.signature]?.pfp) || DEFAULT_PFP} className="w-32 h-32 mx-auto rounded-3xl mb-6 object-cover border-4 border-blue-500 shadow-2xl relative z-10" alt="Comm" />
                 <p className="text-2xl font-medium relative z-10 mb-8 leading-relaxed">
                   The user <span className="font-black text-blue-500 cursor-pointer hover:underline normal-case" onClick={() => { setActiveUser(post.owner); setProfileTab('posts'); }}>{censorText(userMap[post.owner]?.username || post.owner.slice(0, 8), profanityFilterEnabled)}</span> created a new community called <span className="font-black italic text-blue-500 break-words whitespace-normal">
                     "{censorText(communityMap[post.signature]?.name || "a new community", profanityFilterEnabled)}"
                   </span>!
                 </p>
                 <button 
                   onClick={() => { setActiveCommunity(post.signature); setFilter('newest'); setView('feed'); window.history.pushState({}, '', `/community/${post.signature}`); }} 
                   className="relative z-10 px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                 >
                   Enter Community ↗
                 </button>
               </div>
            ) : (
               <>
                 <p className="text-3xl font-medium mb-6 leading-tight cursor-pointer break-words whitespace-normal" onClick={() => { setActiveSig(post.signature); setView('direct'); window.history.pushState({}, '', `/${post.signature}`); }}>
                   {censorText(post.text, profanityFilterEnabled)}
                 </p>
                 {post.image && <img src={formatLink(post.image)} className="mt-6 max-h-[500px] w-full rounded-[40px] object-cover border-4 border-gray-800 shadow-2xl" alt="Media" />}
                 {post.link && <p className="mt-6 text-xs font-black text-blue-500 uppercase tracking-widest truncate">URL: <a href={formatLink(post.link)} target="_blank" className="underline lowercase hover:text-blue-400" rel="noreferrer">{post.link}</a></p>}
               </>
            )}
            
            <div className="flex space-x-16 mt-10 text-gray-500 items-center">
              <button onClick={() => pushAction(post.type === 'create_community' ? 'community_like' : 'post_like', '', post.signature)} className="hover:text-pink-500 text-3xl font-black">❤️ {stats.likes.length}</button>
              <button onClick={() => pushAction(post.type === 'create_community' ? 'community_dislike' : 'post_dislike', '', post.signature)} className="hover:text-orange-500 text-3xl font-black">👎 {stats.dislikes.length}</button>
              <button onClick={() => setReplyTo(post.signature)} className="hover:text-blue-500 text-3xl font-black">💬 {visibleCommentCount}</button>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${post.signature}`); triggerToast("Link Copied", "success"); }} className="hover:text-green-500 text-3xl transition-transform active:scale-90" title="Share Action">🔗</button>
              <button onClick={() => {setExamineSig(post.signature); setAuditTab('ancestry');}} className="hover:text-white text-3xl transition-transform active:scale-90" title="Examine Data">🔍</button>
            </div>
            {replyTo === post.signature && <Composer parentSig={post.signature} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className={`p-16 border-b-4 ${theme === 'dark' ? 'border-gray-800 bg-black/50' : 'border-gray-200 bg-white/50'} backdrop-blur-3xl sticky top-[105px] z-30`}>
        <div className="flex items-center gap-12 flex-wrap">
          <img src={formatLink(user.pfp) || DEFAULT_PFP} className="w-48 h-48 rounded-full object-cover border-8 border-blue-500 shadow-2xl flex-shrink-0" alt="Profile" />
          <div className="flex-1 min-w-[300px]">
            <div className="flex justify-between items-start flex-wrap gap-6">
               <div>
                  <h1 className="text-6xl font-black text-blue-500 tracking-tighter italic mb-4 flex items-center gap-4 break-words whitespace-normal">
                    {censorText(displayName, profanityFilterEnabled)}
                    
                    <div className="relative group cursor-help">
                      <span className="text-2xl not-italic bg-blue-600 text-white px-5 py-2 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">🏆 {points}</span>
                      
                      {scoreBreakdown && (
                        <div className={`absolute hidden group-hover:block top-full left-0 mt-4 w-80 border-2 p-6 rounded-3xl shadow-2xl z-50 text-sm font-sans not-italic tracking-normal leading-normal ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                          <p className="font-black text-blue-500 uppercase tracking-widest mb-4 border-b border-gray-800/50 pb-3 text-[10px]">Points Breakdown</p>
                          <div className="space-y-4 font-bold text-sm">
                            <div className="flex justify-between items-center gap-4"><span className="text-gray-500 whitespace-nowrap">📝 Posts (10 each)</span> <span className="text-blue-500">+{scoreBreakdown.posts}</span></div>
                            <div className="flex justify-between items-center gap-4"><span className="text-gray-500 whitespace-nowrap">💬 Comments (5 each)</span> <span className="text-blue-500">+{scoreBreakdown.comments}</span></div>
                            <div className="flex justify-between items-center gap-4"><span className="text-gray-500 whitespace-nowrap">🏛️ Comms Founded (50 each)</span> <span className="text-blue-500">+{scoreBreakdown.commsCreated}</span></div>
                            <div className="flex justify-between items-center gap-4"><span className="text-gray-500 whitespace-nowrap">🚪 Comms Joined (10 each)</span> <span className="text-blue-500">+{scoreBreakdown.commsJoined}</span></div>
                            <div className="flex justify-between items-center gap-4"><span className="text-gray-500 whitespace-nowrap">❤️ Post Votes (1 each)</span> <span className="text-blue-500">+{scoreBreakdown.postVotes}</span></div>
                            <div className="flex justify-between items-center gap-4"><span className="text-gray-500 whitespace-nowrap">🚩 Comm Votes (1 each)</span> <span className="text-blue-500">+{scoreBreakdown.commVotes}</span></div>
                            <div className="flex justify-between items-center gap-4"><span className="text-gray-500 whitespace-nowrap">⭐️ Profile Votes (1 each)</span> <span className="text-blue-500">+{scoreBreakdown.userVotes}</span></div>
                            <div className="flex justify-between items-center gap-4 border-gray-800/50"><span className="text-gray-500 whitespace-nowrap">🤝 Network Ties (5 each)</span> <span className="text-blue-500">+{scoreBreakdown.connections}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </h1>
                  <p className={`text-xs font-black font-mono inline-block px-4 py-2 rounded-lg border break-all ${theme === 'dark' ? 'text-gray-500 bg-gray-900/50 border-gray-800' : 'text-gray-700 bg-gray-100 border-gray-300'}`}>{activeUser}</p>
               </div>
               
               <button 
                  onClick={() => { setIdAuditSig(activeUser); setView('id_audit'); }}
                  className="px-6 py-3 border-2 border-blue-500/30 text-blue-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg flex-shrink-0"
               >
                 Identity History 🔍
               </button>
            </div>

            {user.bio && <p className={`mt-6 text-xl font-medium leading-relaxed max-w-3xl break-words whitespace-normal ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>"{censorText(user.bio, profanityFilterEnabled)}"</p>}
            
            {user.links && user.links.length > 0 && (
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-6">
                {user.links.filter(Boolean).map((link: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${formatLink(link)}&sz=64`} 
                      className="w-5 h-5 object-contain" 
                      alt="" 
                    />
                    <a 
                      href={formatLink(link)} 
                      target="_blank" 
                      className="text-sm font-black text-blue-500 uppercase tracking-widest hover:underline truncate max-w-[200px]" 
                      rel="noreferrer"
                    >
                      {prettifyLink(link)}
                    </a>
                  </div>
                ))}
              </div>
            )}
            
            {!isMe && publicKey && (
              <div className="flex items-center gap-4 mt-8 flex-wrap">
                <button 
                  onClick={() => pushAction(amIFollowing ? 'unfollow_user' : 'follow_user', activeUser)}
                  className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${amIFollowing ? 'bg-gray-800 text-gray-400 hover:bg-red-900/50 hover:text-red-500' : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-90'}`}
                >
                  {amIFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button 
                  onClick={() => pushAction('like_user', activeUser)}
                  className={`px-6 py-4 rounded-xl border-2 font-black transition-colors ${theme === 'dark' ? 'border-pink-500/20 text-pink-500 hover:bg-pink-500/10' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}`}
                >
                  ❤️ {profileStats.likes.length}
                </button>
                <button 
                  onClick={() => pushAction('dislike_user', activeUser)}
                  className={`px-6 py-4 rounded-xl border-2 font-black transition-colors ${theme === 'dark' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/10' : 'border-orange-300 text-orange-600 hover:bg-orange-50'}`}
                >
                  👎 {profileStats.dislikes.length}
                </button>
                <button 
                  onClick={() => isBlocked ? unblockUser(activeUser) : blockUser(activeUser)}
                  className={`px-6 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-colors ml-auto ${isBlocked ? 'border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20' : (theme === 'dark' ? 'border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-500/50' : 'border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300')}`}
                >
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-7 gap-4 mt-16 pt-8 border-t border-gray-800/50">
          {STATS.map((s:any) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-black text-blue-500">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex flex-wrap border-b-2 ${theme === 'dark' ? 'border-gray-800 bg-black/95' : 'border-gray-200 bg-white/95'} sticky top-[480px] z-20`}>
        {TABS.map((t:any) => (
          <button 
            key={t} 
            onClick={() => setProfileTab(t)} 
            className={`flex-1 py-4 md:py-6 px-2 min-w-[100px] text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === t ? 'text-blue-500 border-b-4 border-blue-500' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-screen">
        {profileTab === 'posts' && (
          userPosts.length > 0 
            ? userPosts.sort((a,b) => b.timestamp - a.timestamp).map(renderPostBlock)
            : <EmptyNotice msg="No active posts found etched to the ledger by this user." />
        )}
        
        {profileTab === 'comments' && (
          userComments.length > 0 
            ? userComments.sort((a,b) => b.timestamp - a.timestamp).map((c:any) => <CommentNode key={c.signature} comment={c} />)
            : <EmptyNotice msg="No active comments found for this user in historical records." />
        )}
        
        {profileTab === 'likes' && (
          <div className="divide-y divide-gray-800/50">
            {userLikes.length === 0 ? <EmptyNotice msg="This user hasn't liked any active records yet." /> : userLikes.sort((a,b) => b.timestamp - a.timestamp).map((tx:any) => {
              const targetSig = tx.parent || tx.parent_post || tx.text;
              
              if (tx.type === 'community_like') {
                 const comm = communityMap[targetSig];
                 if (!comm) return null;
                 return (
                    <div key={tx.signature} className={`p-8 transition-colors flex justify-between items-center ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                       <div>
                         <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                           <span className="text-pink-500 text-lg">❤️</span> Liked a community
                         </p>
                         <p className="text-xl font-black italic text-blue-500 truncate max-w-4xl">"{censorText(comm.name, profanityFilterEnabled)}"</p>
                       </div>
                       <button onClick={() => { setActiveCommunity(targetSig); setView('feed'); window.history.pushState({}, '', `/community/${targetSig}`); }} className="text-[10px] px-6 py-2 bg-blue-600 text-white rounded-full uppercase font-black hover:scale-105 transition-all">Traverse ↗</button>
                    </div>
                 );
              }
              else if (tx.type === 'like_user') {
                 const u = userMap[targetSig] || {};
                 return (
                    <div key={tx.signature} className={`p-8 transition-colors flex justify-between items-center ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                       <div>
                         <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                           <span className="text-pink-500 text-lg">❤️</span> Liked a user profile
                         </p>
                         <div className="flex items-center gap-4">
                           <img src={formatLink(u.pfp) || DEFAULT_PFP} className="w-8 h-8 rounded-full object-cover" alt="pfp" />
                           <p className="text-xl font-black italic text-blue-500 normal-case">{censorText(u.username || targetSig, profanityFilterEnabled)}</p>
                         </div>
                       </div>
                       <button onClick={() => { setActiveUser(targetSig); setView('profile'); window.history.pushState({}, '', `/${u.username || targetSig}`); }} className="text-[10px] px-6 py-2 bg-blue-600 text-white rounded-full uppercase font-black hover:scale-105 transition-all">Traverse ↗</button>
                    </div>
                 );
              }
              else {
                 const t = posts.find((p:any) => p.signature === targetSig) || txLedger[targetSig];
                 if (!t) return null;
                 const opName = userMap[t.owner || t.sender]?.username || (t.owner || t.sender)?.slice(0, 8);
                 return (
                   <div key={tx.signature} className={`p-8 transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`} onClick={() => { setActiveSig(targetSig); setView('direct'); window.history.pushState({}, '', `/${targetSig}`); }}>
                     <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                       <span className="text-pink-500 text-lg">❤️</span> Liked a {t.type === 'post_comment' ? 'comment' : 'post'} by <span className="text-blue-500 hover:underline normal-case">{censorText(opName, profanityFilterEnabled)}</span>
                     </p>
                     <p className={`text-lg italic truncate max-w-4xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>"{censorText(t.text, profanityFilterEnabled)}"</p>
                   </div>
                 );
              }
            })}
          </div>
        )}
        
        {profileTab === 'dislikes' && (
          <div className="divide-y divide-gray-800/50">
            {userDislikes.length === 0 ? <EmptyNotice msg="No active dislikes found for this user." /> : userDislikes.sort((a,b) => b.timestamp - a.timestamp).map((tx:any) => {
              const targetSig = tx.parent || tx.parent_post || tx.text;
              
              if (tx.type === 'community_dislike') {
                 const comm = communityMap[targetSig];
                 if (!comm) return null;
                 return (
                    <div key={tx.signature} className={`p-8 transition-colors flex justify-between items-center ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                       <div>
                         <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                           <span className="text-orange-500 text-lg">👎</span> Disliked a community
                         </p>
                         <p className="text-xl font-black italic text-blue-500 truncate max-w-4xl">"{censorText(comm.name, profanityFilterEnabled)}"</p>
                       </div>
                       <button onClick={() => { setActiveCommunity(targetSig); setView('feed'); window.history.pushState({}, '', `/community/${targetSig}`); }} className="text-[10px] px-6 py-2 bg-blue-600 text-white rounded-full uppercase font-black hover:scale-105 transition-all">Traverse ↗</button>
                    </div>
                 );
              }
              else if (tx.type === 'dislike_user') {
                 const u = userMap[targetSig] || {};
                 return (
                    <div key={tx.signature} className={`p-8 transition-colors flex justify-between items-center ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                       <div>
                         <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                           <span className="text-orange-500 text-lg">👎</span> Disliked a user profile
                         </p>
                         <div className="flex items-center gap-4">
                           <img src={formatLink(u.pfp) || DEFAULT_PFP} className="w-8 h-8 rounded-full object-cover" alt="pfp" />
                           <p className="text-xl font-black italic text-blue-500 normal-case">{censorText(u.username || targetSig, profanityFilterEnabled)}</p>
                         </div>
                       </div>
                       <button onClick={() => { setActiveUser(targetSig); setView('profile'); window.history.pushState({}, '', `/${u.username || targetSig}`); }} className="text-[10px] px-6 py-2 bg-blue-600 text-white rounded-full uppercase font-black hover:scale-105 transition-all">Traverse ↗</button>
                    </div>
                 );
              }
              else {
                 const t = posts.find((p:any) => p.signature === targetSig) || txLedger[targetSig];
                 if (!t) return null;
                 const opName = userMap[t.owner || t.sender]?.username || (t.owner || t.sender)?.slice(0, 8);
                 return (
                   <div key={tx.signature} className={`p-8 transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`} onClick={() => { setActiveSig(targetSig); setView('direct'); window.history.pushState({}, '', `/${targetSig}`); }}>
                     <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                       <span className="text-orange-500 text-lg">👎</span> Disliked a {t.type === 'post_comment' ? 'comment' : 'post'} by <span className="text-blue-500 hover:underline normal-case">{censorText(opName, profanityFilterEnabled)}</span>
                     </p>
                     <p className={`text-lg italic truncate max-w-4xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>"{censorText(t.text, profanityFilterEnabled)}"</p>
                   </div>
                 );
              }
            })}
          </div>
        )}

        {profileTab === 'communities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-12">
            {joinedComms.length === 0 
              ? <div className="col-span-2"><EmptyNotice msg="No memberships found for this user in any communities." /></div>
              : joinedComms.map((id:any) => {
                const comm = communityMap[id];
                if (!comm) return null;
                const isOwner = comm.owner === activeUser; 
                return (
                    <div key={id} className={`p-8 rounded-3xl border-4 ${theme === 'dark' ? 'border-gray-800 hover:border-gray-700 bg-black/40' : 'border-gray-200 hover:border-gray-300 bg-white'} transition-colors group flex flex-col justify-between`}>
                      <div className="flex items-center gap-6 mb-4">
                         <img src={formatLink(comm.pfp) || DEFAULT_PFP} className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-blue-500/20" alt="PFP" />
                         <div className="flex-1 min-w-0">
                           <h3 className="text-2xl font-black text-blue-500 italic truncate break-words whitespace-normal">{censorText(comm.name, profanityFilterEnabled)}</h3>
                           <p className="text-xs font-bold text-gray-500 mt-1">👤 {communityStatsMap[id]?.members.length || 0} Members</p>
                         </div>
                      </div>
                      {isOwner && (
                         <div className="mb-6 inline-block px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-500/20">
                           {isMe ? 'CREATED BY YOU' : 'CREATED BY THIS USER'}
                         </div>
                      )}
                      <button onClick={() => { setActiveCommunity(id); setFilter('newest'); setView('feed'); window.history.pushState({}, '', `/community/${id}`); }} className="w-full mt-auto py-4 border-2 border-blue-500/30 text-blue-500 rounded-xl font-black uppercase text-xs tracking-widest group-hover:bg-blue-500 group-hover:text-white transition-all">Enter Community ↗</button>
                    </div>
                );
            })}
          </div>
        )}

        {profileTab === 'followers' && (
          <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {followers.length === 0 
              ? <div className="lg:col-span-2"><EmptyNotice msg="No other users are currently following this profile." /></div>
              : followers.map((w:any) => {
                const u = userMap[w] || {};
                const followerName = u.username || w.slice(0, 8);
                return (
                  <div key={w} className={`p-6 rounded-3xl border-2 flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 hover:border-gray-700 bg-black/40' : 'border-gray-200 hover:border-gray-300 bg-white'} transition-colors group cursor-pointer`} onClick={() => { setActiveUser(w); setProfileTab('posts'); }}>
                    <div className="flex items-center gap-6 min-w-0"><img src={formatLink(u.pfp) || DEFAULT_PFP} className="w-16 h-16 rounded-full object-cover flex-shrink-0" alt="PFP" /><div className="min-w-0"><h3 className="text-xl font-black text-blue-500 italic truncate max-w-[200px]">{censorText(followerName, profanityFilterEnabled)}</h3><p className="text-[10px] font-mono text-gray-500 mt-1">{w.slice(0, 12)}...</p></div></div>
                    <span className="text-gray-500 group-hover:text-blue-500 font-black text-xl px-4 transition-colors">↗</span>
                  </div>
                );
            })}
          </div>
        )}

        {profileTab === 'following' && (
          <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {following.length === 0 
              ? <div className="lg:col-span-2"><EmptyNotice msg="This user is not currently following anyone yet." /></div>
              : following.map((w:any) => {
                const u = userMap[w] || {};
                const followerName = u.username || w.slice(0, 8);
                return (
                  <div key={w} className={`p-6 rounded-3xl border-2 flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 hover:border-gray-700 bg-black/40' : 'border-gray-200 hover:border-gray-300 bg-white'} transition-colors group cursor-pointer`} onClick={() => { setActiveUser(w); setProfileTab('posts'); }}>
                    <div className="flex items-center gap-6 min-w-0"><img src={formatLink(u.pfp) || DEFAULT_PFP} className="w-16 h-16 rounded-full object-cover flex-shrink-0" alt="PFP" /><div className="min-w-0"><h3 className="text-xl font-black text-blue-500 italic truncate max-w-[200px]">{censorText(followerName, profanityFilterEnabled)}</h3><p className="text-[10px] font-mono text-gray-500 mt-1">{w.slice(0, 12)}...</p></div></div>
                    <span className="text-gray-500 group-hover:text-blue-500 font-black text-xl px-4 transition-colors">↗</span>
                  </div>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}