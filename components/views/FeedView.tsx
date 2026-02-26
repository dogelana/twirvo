'use client';
import React, { useState, useEffect } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import Composer from '../core/Composer';
import CommentNode from '../core/CommentNode';
import { censorText } from '@/utils/profanity';

export default function FeedView() {
  const { 
    theme, filter, setFilter, connected, replyTo, sortedPosts, 
    userMap, statsMap, publicKey, pushAction, setActiveUser, 
    setView, setActiveSig, setReplyTo, setExamineSig, setAuditTab,
    triggerToast, hidePost,
    activeCommunity, setActiveCommunity, communityMap, communityStatsMap,
    setShowEditCommunity, profanityFilterEnabled, setShowUsers,
    setIdAuditSig, getVisibleCommentCount, 
    setShowCommHistory, setCommAuditSig 
  } = useTwirvo();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [collapsedPosts, setCollapsedPosts] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('twirvo_collapsed_posts');
    if (saved) {
      try {
        setCollapsedPosts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse collapsed posts", e);
      }
    }
  }, []);

  const toggleComments = (sig: string) => {
    setCollapsedPosts(prev => {
      const newState = prev.includes(sig) 
        ? prev.filter(s => s !== sig) 
        : [...prev, sig];
      localStorage.setItem('twirvo_collapsed_posts', JSON.stringify(newState));
      return newState;
    });
  };

  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.startsWith('./')) clean = clean.substring(1); 
    if (clean.startsWith('/')) return clean;
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  const currentComm = activeCommunity ? communityMap[activeCommunity] : null;
  const commStats = activeCommunity ? (communityStatsMap[activeCommunity] || { likes: [], dislikes: [], members: [], postCount: 0, commentCount: 0 }) : null;
  const hasJoined = commStats?.members.includes(publicKey?.toString() || "");

  return (
    <>
      {activeCommunity && currentComm && commStats && (
        <div className={`border-b-4 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'} relative flex flex-col`}>
          
          <div className="p-6 md:p-10 border-b-4 border-gray-800/50">
            <button 
              onClick={() => { setActiveCommunity(null); window.history.pushState({}, '', '/'); }} 
              className={`w-full inline-flex items-center justify-center gap-4 px-12 py-8 rounded-[30px] font-black uppercase tracking-[0.2em] text-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-gray-800 text-white border-2 border-gray-700 hover:bg-gray-700' : 'bg-gray-200 text-gray-900 border-2 border-gray-300 hover:bg-gray-300'}`}
            >
              ← Return To Main Feed
            </button>
          </div>

          {currentComm.banner && (
            <img 
              src={formatLink(currentComm.banner)} 
              className="w-full h-[300px] object-cover border-b-4 border-gray-800" 
              alt="Community Banner" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
          )}
          
          <div className="p-8 md:p-12 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 w-full">
               <img src={formatLink(currentComm.pfp) || DEFAULT_PFP} className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover border-4 border-blue-500/50 shadow-2xl flex-shrink-0" alt="Community PFP" />
               <div className="flex-1 min-w-0 w-full">
                  <h1 className="text-4xl md:text-5xl font-black text-blue-500 tracking-widest italic leading-none mb-4 break-words whitespace-normal">
                    {censorText(currentComm.name, profanityFilterEnabled)}
                  </h1>
                  <div className="text-sm font-black tracking-widest text-gray-500 flex flex-wrap items-center gap-4">
                    <span className="normal-case">Founded by <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => { setActiveUser(currentComm.owner); setView('profile'); window.history.pushState({}, '', `/${userMap[currentComm.owner]?.username || currentComm.owner}`); }}>{censorText(userMap[currentComm.owner]?.username || currentComm.owner.slice(0,8), profanityFilterEnabled)}</span></span>
                    <button onClick={() => setShowUsers(true)} className="text-white bg-blue-600 px-4 py-2 rounded-xl font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer">
                      {commStats.members.length} Members
                    </button>
                  </div>
               </div>
            </div>

            {currentComm.bio && (
              <div className={`mt-10 p-8 rounded-[40px] border-l-4 border-blue-500 ${theme === 'dark' ? 'bg-black/40' : 'bg-white/60'}`}>
                <p className="text-2xl font-medium italic">"{censorText(currentComm.bio, profanityFilterEnabled)}"</p>
              </div>
            )}

            {currentComm.token && (
              <div className="mt-8 inline-flex items-center gap-3 bg-blue-500/10 text-blue-500 px-4 py-2 rounded-xl font-mono text-xs border border-blue-500/30">
                 <span className="font-black uppercase tracking-widest">Token:</span> {currentComm.token}
              </div>
            )}

            {currentComm.links && currentComm.links.filter((l: string) => l.trim() !== '').length > 0 && (
              <div className="mt-8 flex flex-wrap gap-4">
                {currentComm.links.filter((l: string) => l.trim() !== '').map((link: string, idx: number) => {
                  const cleanLink = formatLink(link);
                  const domain = cleanLink.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                  return (
                    <a 
                      key={idx} 
                      href={cleanLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 shadow-lg ${theme === 'dark' ? 'bg-black/50 border-gray-800 hover:border-blue-500' : 'bg-white/50 border-gray-300 hover:border-blue-500'}`}
                    >
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${cleanLink}&sz=64`} 
                        className="w-6 h-6 object-contain" 
                        alt="icon" 
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="font-black text-xs uppercase tracking-widest text-blue-500">{domain || 'Link'}</span>
                    </a>
                  );
                })}
              </div>
            )}

            {connected && (
              <div className="mt-12 pt-8 border-t-2 border-gray-800/30 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 w-full">
                <div className="flex flex-wrap items-center gap-4">
                  <button onClick={() => pushAction('community_like', '', activeCommunity)} className={`flex items-center gap-2 px-6 py-4 rounded-xl border-2 font-black transition-colors ${theme === 'dark' ? 'border-pink-500/20 text-pink-500 hover:bg-pink-500/10' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}`}>
                    ❤️ {commStats.likes.length}
                  </button>
                  <button onClick={() => pushAction('community_dislike', '', activeCommunity)} className={`flex items-center gap-2 px-6 py-4 rounded-xl border-2 font-black transition-colors ${theme === 'dark' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/10' : 'border-orange-300 text-orange-600 hover:bg-orange-50'}`}>
                    👎 {commStats.dislikes.length}
                  </button>
                  <button 
                    onClick={() => {
                      if (hasJoined && publicKey?.toString() === currentComm.owner) {
                        triggerToast("You cannot leave your own community", "error");
                      } else {
                        pushAction(hasJoined ? 'leave_community' : 'join_community', '', activeCommunity);
                      }
                    }} 
                    className={`px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${hasJoined ? (theme === 'dark' ? 'bg-gray-800 text-gray-400 border-2 border-transparent hover:bg-red-900/30 hover:text-red-500' : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600') : 'bg-blue-600 text-white shadow-xl hover:scale-105 active:scale-95'}`}
                  >
                    {hasJoined ? 'Leave' : 'Join'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => { setIdAuditSig(currentComm.owner); setView('id_audit'); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'border-gray-600/50 text-gray-400 hover:bg-gray-800 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-black'}`}
                  >
                    🔍 Founder Identity
                  </button>
                  <button 
                    onClick={() => { setCommAuditSig(activeCommunity); setShowCommHistory(true); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'border-gray-600/50 text-gray-400 hover:bg-gray-800 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-black'}`}
                  >
                    📜 Comm History
                  </button>

                  {publicKey?.toString() === currentComm.owner && (
                    <div className="flex items-center gap-4 ml-2 pl-6 border-l-2 border-gray-800/50">
                      <button onClick={() => setShowEditCommunity(true)} className="text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-blue-500 transition-colors">
                        Edit Community (0.1 SOL)
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            triggerToast("Action Permanent: Click 'Confirm' to delete the community", "warning");
                            setConfirmDelete('COMMUNITY_ROOT'); 
                          }}
                          className="text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-red-500 transition-colors"
                        >
                          Delete Community (0.1 SOL)
                        </button>
                        {confirmDelete === 'COMMUNITY_ROOT' && (
                          <button 
                            onClick={() => {
                              pushAction('delete_community', '', activeCommunity);
                              setActiveCommunity(null);
                              setView('feed');
                              setConfirmDelete(null);
                              window.history.pushState({}, '', '/');
                            }}
                            className="bg-red-600 text-white text-[9px] px-3 py-1 rounded-lg font-black animate-pulse shadow-lg"
                          >
                            CONFIRM?
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

{/* UPDATED TAB NAVIGATION ORDER */}
<div className={`flex border-b ${theme === 'dark' ? 'border-gray-800 bg-black/95' : 'border-gray-200 bg-white/95'} sticky top-[105px] z-40 shadow-lg overflow-x-auto custom-scrollbar`}>
  {['you', 'following', 'oldest', 'newest', 'relevant', 'liked', 'commented'].map((t) => (
    <button 
      key={t} 
      onClick={() => setFilter(t)} 
      className={`flex-1 min-w-[100px] py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
        filter === t ? 'text-blue-500 border-b-4 border-blue-500' : 'text-gray-600 hover:text-gray-400'
      }`}
    >
      {t === 'you' ? 'You' : 
       t === 'following' ? 'Following' : 
       t === 'oldest' ? 'Oldest' : 
       t === 'newest' ? 'Newest' : 
       t === 'relevant' ? 'Most Relevant' :
       `Most ${t}`}
    </button>
  ))}
</div>
      
      {connected && !replyTo && <Composer />}

      <div className="divide-y divide-gray-900">
        {sortedPosts.length === 0 ? (
          <div className="p-20 text-center text-gray-500 font-black uppercase tracking-widest italic">
            {filter === 'following' ? "You aren't following anyone who has posted yet." : 
             filter === 'you' ? "You haven't etched any posts to the ledger yet." :
             "No records match your current filters."}
          </div>
        ) : (
          sortedPosts.map((post: any) => {
            const user = userMap[post.owner] || {};
            const stats = statsMap[post.signature] || { likes: [], dislikes: [], comments: [], parent: null };
            const deleteAction = stats.parent ? "remove_comment" : "remove_post";
            const isCollapsed = collapsedPosts.includes(post.signature);
            const visibleCommentCount = getVisibleCommentCount ? getVisibleCommentCount(post.signature) : stats.comments.length;

            return (
              <div key={post.signature} className="p-12 hover:bg-blue-500/[0.01] transition-colors relative">
                {post.isSimulated && <span className="absolute top-4 right-4 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded">Simulated</span>}
                <div className="flex items-start space-x-10">
                  <img 
                    src={formatLink(user.pfp) || DEFAULT_PFP} 
                    className="w-24 h-24 rounded-full object-cover cursor-pointer border-2 border-gray-800 shadow-xl" 
                    onClick={() => { setActiveUser(post.owner); setView('profile'); window.history.pushState({}, '', `/${user.username || post.owner}`); }} 
                    alt="PFP" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-blue-500 text-2xl cursor-pointer tracking-tighter normal-case" onClick={() => { setActiveUser(post.owner); setView('profile'); window.history.pushState({}, '', `/${user.username || post.owner}`); }}>
                          {censorText(user.username || post.owner.slice(0,8), profanityFilterEnabled)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono mt-1">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <button onClick={() => hidePost(post.signature)} className="text-[10px] font-black uppercase text-gray-500 hover:text-orange-500 hover:underline tracking-widest">Hide From Feed</button>
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
                              confirmDelete === post.signature 
                                ? 'text-white bg-red-600 px-3 py-1 rounded-lg animate-pulse' 
                                : 'text-red-500 hover:underline'
                            }`}
                          >
                            {confirmDelete === post.signature ? 'Confirm Delete?' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>

                    {post.type === 'join_community' ? (
                        <div className="mt-8 mb-6 p-8 border-4 border-green-500/20 bg-green-500/5 rounded-[40px] text-center shadow-inner relative overflow-hidden">
                          <span className="text-6xl relative z-10 block mb-4">🤝</span>
                          <p className="text-2xl font-medium relative z-10 leading-relaxed text-gray-400">
                            <span className="font-black text-green-500 cursor-pointer hover:underline normal-case" onClick={() => { setActiveUser(post.owner); setView('profile'); window.history.pushState({}, '', `/${userMap[post.owner]?.username || post.owner}`); }}>
                              {censorText(userMap[post.owner]?.username || post.owner.slice(0,8), profanityFilterEnabled)}
                            </span> became a member of the community!
                          </p>
                        </div>
                    ) : post.type === 'create_community' ? (
                        <div className="mt-8 mb-6 p-10 border-4 border-blue-500/20 bg-blue-500/5 rounded-[40px] text-center shadow-inner relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50 pointer-events-none"></div>
                          <img 
                             src={formatLink(communityMap[post.signature]?.pfp) || DEFAULT_PFP} 
                             className="w-32 h-32 mx-auto rounded-3xl mb-6 object-cover border-4 border-blue-500 shadow-2xl relative z-10" 
                             alt="Comm" 
                           />
                          <p className="text-2xl font-medium relative z-10 mb-8 leading-relaxed">
                            The user <span className="font-black text-blue-500 cursor-pointer hover:underline normal-case" onClick={() => { setActiveUser(post.owner); setView('profile'); window.history.pushState({}, '', `/${userMap[post.owner]?.username || post.owner}`); }}>
                              {censorText(userMap[post.owner]?.username || post.owner.slice(0,8), profanityFilterEnabled)}
                            </span> created a new community called <span className="font-black italic text-blue-500 break-words whitespace-normal">
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
                          <p className="text-3xl font-medium my-6 leading-tight cursor-pointer break-words whitespace-normal" onClick={() => { setActiveSig(post.signature); setView('direct'); window.history.pushState({}, '', `/${post.signature}`); }}>
                            {censorText(post.text, profanityFilterEnabled)}
                          </p>
                          {post.image && (
                            <img 
                              src={formatLink(post.image)} 
                              className="mt-6 max-h-[500px] w-full rounded-[40px] object-cover border-4 border-gray-800 shadow-2xl" 
                              alt="Media" 
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                        </>
                    )}
                    
                    <div className="flex space-x-16 mt-10 text-gray-500 items-center">
                      <button onClick={() => pushAction(post.type === 'create_community' ? 'community_like' : 'post_like', '', post.signature)} className="hover:text-pink-500 text-3xl font-black">❤️ {stats.likes.length}</button>
                      <button onClick={() => pushAction(post.type === 'create_community' ? 'community_dislike' : 'post_dislike', '', post.signature)} className="hover:text-orange-500 text-3xl font-black">👎 {stats.dislikes.length}</button>
                      
                      <div className="flex items-center gap-3">
                        <button onClick={() => setReplyTo(post.signature)} className="hover:text-blue-500 text-3xl font-black">💬 {visibleCommentCount}</button>
                        {visibleCommentCount > 0 && (
                          <button 
                            onClick={() => toggleComments(post.signature)}
                            className="bg-blue-600 border border-blue-400 text-white rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                          >
                            <svg 
                              viewBox="0 0 24 24" 
                              fill="currentColor" 
                              className={`w-4 h-4 transition-transform duration-200 ${!isCollapsed ? 'rotate-0' : '-rotate-90'}`}
                            >
                              <path d="M12 21l-12-18h24z" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${post.signature}`); triggerToast("Link Copied", "success"); }} className="hover:text-green-500 text-3xl">🔗</button>
                      <button onClick={() => {setExamineSig(post.signature); setAuditTab('ancestry');}} className="hover:text-white text-3xl">🔍</button>
                    </div>

                    {replyTo === post.signature && <Composer parentSig={post.signature} />}
                    
                    {!isCollapsed && (
                      <div className="mt-8 border-t border-gray-800 pt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        {[...stats.comments]
                          .sort((a,b) => (statsMap[b.signature]?.likes.length || 0) - (statsMap[a.signature]?.likes.length || 0))
                          .map((c: any) => <CommentNode key={c.signature} comment={c} />)
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}