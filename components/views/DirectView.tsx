'use client';
import React, { useState } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import Composer from '../core/Composer';
import CommentNode from '../core/CommentNode';
import { censorText } from '@/utils/profanity';

export default function DirectView() {
  const { 
    theme, activeSig, setView, txLedger, isLoadingFeed, userMap, setActiveUser,
    statsMap, pushAction, setReplyTo, replyTo, triggerToast, setExamineSig, setAuditTab,
    hidePost, unhidePost, hiddenPosts, publicKey, setActiveSig,
    communityMap, setActiveCommunity, profanityFilterEnabled,
    communityHistory, setProfileTab 
  } = useTwirvo();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const formatLink = (url: any) => {
    if (!url || typeof url !== 'string') return '';
    let clean = url.trim();
    if (clean.startsWith('./')) clean = clean.substring(1);
    if (clean.startsWith('/')) return clean;
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  const getCommDetails = (id: string) => {
    if (communityMap && communityMap[id]) return communityMap[id];
    if (communityHistory && communityHistory[id] && communityHistory[id].length > 0) {
      const history = communityHistory[id];
      return history[history.length - 1]; 
    }
    return null;
  };

  if (!activeSig) return null;

  return (
    <div className="p-20 animate-in slide-in-from-bottom-10">
        
       {(() => {
          const tx = txLedger[activeSig];
          if (!tx) {
              return isLoadingFeed ? (
                <div className="p-20 text-center text-blue-500 font-black tracking-widest animate-pulse uppercase">Decrypting Ledger Record...</div>
              ) : (
                <>
                  <button onClick={() => { setActiveCommunity(null); setView('feed'); window.history.pushState({}, '', '/'); }} className="text-gray-500 mb-12 font-bold uppercase text-xs hover:text-blue-500 text-center block w-full">← Back to Global Feed</button>
                  <div className={`p-20 text-center border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-[40px] text-gray-500 font-black uppercase tracking-widest`}>
                    {activeSig.startsWith('sim_') 
                      ? "This post was a simulated post and has now been deleted." 
                      : "Transaction Not Found in Protocol Index."
                    }
                  </div>
                </>
              );
          }

          const user = userMap[tx.sender] || {};
          const stats = statsMap[activeSig] || { likes: [], dislikes: [], comments: [], parent: null };
          const isEntry = tx.type === 'post' || tx.type === 'post_comment' || tx.type === 'create_community' || tx.type === 'join_community';
          const deleteAction = tx.parent ? "remove_comment" : "remove_post";
          const isHidden = hiddenPosts.includes(activeSig);
          const isMe = publicKey?.toString() === tx.sender;

          // Determine the target community ID for the header button
          const communityTargetId = tx.type === 'create_community' ? activeSig : tx.parent_community;

          const standardInteractions = ['post_like', 'post_dislike', 'remove_like', 'remove_dislike'];
          const communityInteractions = ['community_like', 'community_dislike', 'remove_community_like', 'remove_community_dislike'];
          const userInteractions = ['like_user', 'dislike_user', 'remove_user_like', 'remove_user_dislike'];

          return (
            <>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                 <button 
                   onClick={() => { setActiveCommunity(null); setView('feed'); window.history.pushState({}, '', '/'); }} 
                   className="px-6 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-black uppercase text-[10px] tracking-widest rounded-xl transition-colors"
                 >
                   🏠 Go Home
                 </button>
                 <button 
                   onClick={() => { setActiveUser(tx.sender); if (setProfileTab) setProfileTab('posts'); setView('profile'); window.history.pushState({}, '', `/${user.username || tx.sender}`); }} 
                   className={`px-6 py-2 border-2 font-black uppercase text-[10px] tracking-widest rounded-xl transition-colors ${theme === 'dark' ? 'border-gray-800 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-600 hover:text-black'}`}
                 >
                   {isMe ? '👤 Go to Your Profile' : `👤 Go to ${user.username || 'User'}'s Profile`}
                 </button>

                 {/* UPDATED HEADER BUTTON LOGIC: Now handles create_community ID too */}
                 {communityTargetId && getCommDetails(communityTargetId) && (
                    <button 
                      onClick={() => { setActiveCommunity(communityTargetId); setView('feed'); window.history.pushState({}, '', `/community/${communityTargetId}`); }} 
                      className={`px-6 py-2 border-2 font-black uppercase text-[10px] tracking-widest rounded-xl transition-colors ${theme === 'dark' ? 'border-gray-800 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-600 hover:text-black'}`}
                    >
                      🏛️ Go to Community
                    </button>
                 )}
              </div>

              <div className={`p-16 rounded-[60px] border-4 shadow-2xl ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} relative`}>
                 {tx.isSimulated && <span className="absolute top-8 right-8 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">Simulated</span>}
                 
                 <div className="flex items-center gap-6 mb-10">
                    <img 
                      src={formatLink(user.pfp) || DEFAULT_PFP} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-500/20 shadow-xl cursor-pointer" 
                      onClick={() => { setActiveUser(tx.sender); if (setProfileTab) setProfileTab('posts'); setView('profile'); window.history.pushState({}, '', `/${user.username || tx.sender}`); }} 
                      alt="PFP" 
                    />
                    <div>
                      <span 
                        className="font-black text-blue-500 text-3xl cursor-pointer hover:underline normal-case" 
                        onClick={() => { setActiveUser(tx.sender); if (setProfileTab) setProfileTab('posts'); setView('profile'); window.history.pushState({}, '', `/${user.username || tx.sender}`); }}
                      >
                        {censorText(user.username || tx.sender.slice(0,8), profanityFilterEnabled)}
                      </span>
                      <p className="text-xs text-gray-500 font-mono mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="mb-10">
                   {tx.type === 'create_community' && getCommDetails(activeSig) && (
                     <div className="text-center py-10">
                       <span className="text-8xl mb-6 block">🏛️</span>
                       <p className={`text-2xl font-black uppercase tracking-widest mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                         Founded A Community
                       </p>
                       <div className={`inline-block p-8 ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-white/50 border-gray-300'} border-2 rounded-3xl text-left min-w-[300px]`}>
                         <p className="text-[10px] text-gray-500 uppercase font-black mb-4 tracking-widest">Community Profile</p>
                         <div className="flex items-center gap-4 mb-6">
                            <img src={formatLink(getCommDetails(activeSig).pfp) || DEFAULT_PFP} className="w-16 h-16 rounded-xl object-cover shadow-lg border-2 border-blue-500/20" alt="PFP" />
                            <p className="text-3xl font-black text-blue-500 italic break-words whitespace-normal">{censorText(getCommDetails(activeSig).name, profanityFilterEnabled)}</p>
                         </div>
                         <button 
                            onClick={() => { 
                              setActiveCommunity(activeSig); 
                              setView('feed'); 
                              window.history.pushState({}, '', `/community/${activeSig}`); 
                            }} 
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                         >
                           Traverse to Community ↗
                         </button>
                       </div>
                     </div>
                   )}

                   {tx.type === 'edit_community' && tx.parent_community && (
                     <div className="text-center py-10">
                       <span className="text-8xl mb-6 block">🛠️</span>
                       <p className={`text-2xl font-black uppercase tracking-widest mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                         Community State Updated
                       </p>
                       <div className={`inline-block p-6 ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-white/50 border-gray-300'} border-2 rounded-3xl text-left min-w-[300px]`}>
                         <p className="text-[10px] text-gray-500 uppercase font-black mb-4 tracking-widest">Target Community</p>
                         <div className="flex items-center gap-3 mb-6">
                            <img src={formatLink(getCommDetails(tx.parent_community)?.pfp) || DEFAULT_PFP} className="w-10 h-10 rounded object-cover flex-shrink-0" alt="Comm" />
                            <p className="text-lg font-bold italic truncate max-w-[250px]">{censorText(getCommDetails(tx.parent_community)?.name || tx.parent_community, profanityFilterEnabled)}</p>
                         </div>
                         <button 
                            onClick={() => { 
                              setActiveCommunity(tx.parent_community); 
                              setView('feed'); 
                              window.history.pushState({}, '', `/community/${tx.parent_community}`); 
                            }} 
                            className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                         >
                           Traverse to Community ↗
                         </button>
                       </div>
                     </div>
                   )}
                   
                   {tx.type === 'delete_community' && getCommDetails(tx.parent_community) && (
                     <div className="text-center py-10">
                       <span className="text-8xl mb-6 block">🌋</span>
                       <p className={`text-2xl font-black uppercase tracking-widest mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                         Community Deleted
                       </p>
                       <div className={`inline-block p-8 border-4 border-red-500/30 bg-red-500/5 rounded-3xl text-left min-w-[300px] shadow-inner`}>
                         <p className="text-[10px] text-red-500 uppercase font-black mb-4 tracking-widest">Archived State</p>
                         <div className="flex items-center gap-4 mb-4">
                           <img src={formatLink(getCommDetails(tx.parent_community).pfp) || DEFAULT_PFP} className="w-16 h-16 rounded-xl object-cover opacity-50 grayscale" alt="Community PFP" />
                           <div>
                              <p className="text-xl font-black text-gray-500 italic break-words whitespace-normal line-through">{censorText(getCommDetails(tx.parent_community).name, profanityFilterEnabled)}</p>
                              <p className="text-sm font-medium text-gray-500 mt-2 line-through">"{censorText(getCommDetails(tx.parent_community).bio, profanityFilterEnabled)}"</p>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {tx.type === 'join_community' && (
                     <div className="mb-6 p-8 border-4 border-green-500/20 bg-green-500/5 rounded-[40px] text-center shadow-inner relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50 pointer-events-none"></div>
                       <span className="text-6xl relative z-10 block mb-4">🤝</span>
                       <p className="text-2xl font-medium relative z-10 leading-relaxed text-gray-400">
                         Joined the community <span className="font-black text-green-500 italic cursor-pointer hover:underline break-words whitespace-normal" onClick={() => { setActiveCommunity(tx.parent_community || tx.parent); setView('feed'); window.history.pushState({}, '', `/community/${tx.parent_community || tx.parent}`); }}>"{censorText(getCommDetails(tx.parent_community || tx.parent)?.name || 'Unknown', profanityFilterEnabled)}"</span>!
                       </p>
                     </div>
                   )}

                   {tx.type === 'post' && (
                     <>
                       <p className="text-5xl font-black italic tracking-tighter leading-tight mb-8 break-words whitespace-normal">"{censorText(tx.text, profanityFilterEnabled)}"</p>
                       {tx.image && (
                         <img src={formatLink(tx.image)} className="max-h-[600px] w-full rounded-[40px] object-cover border-4 border-gray-800 shadow-2xl mb-8" alt="Media" onError={(e) => (e.currentTarget.style.display = 'none')} />
                       )}
                       {tx.link && (
                         <p className="text-sm font-black text-blue-500 uppercase tracking-widest truncate">
                           URL: <a href={formatLink(tx.link)} target="_blank" className="underline lowercase hover:text-blue-400" rel="noreferrer">{tx.link}</a>
                         </p>
                       )}
                     </>
                   )}

                   {tx.type === 'post_comment' && (
                     <>
                       <div className={`mb-8 p-6 ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-white/50 border-gray-300'} border-l-4 border-l-blue-500 rounded-r-3xl`}>
                         <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Replying to Entry</p>
                         <p className={`text-xl font-bold italic break-words whitespace-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>"{censorText(txLedger[tx.parent]?.text || 'Parent entry content...', profanityFilterEnabled)}"</p>
                         {tx.parent && <button onClick={() => { setActiveSig(tx.parent); window.history.pushState({}, '', `/${tx.parent}`); }} className="mt-4 text-blue-500 text-xs font-black uppercase underline hover:text-blue-400">Traverse Up Tree ↗</button>}
                       </div>
                       <p className="text-4xl font-black tracking-tight leading-tight mb-8 break-words whitespace-normal">{censorText(tx.text, profanityFilterEnabled)}</p>
                       {tx.image && (
                         <img src={formatLink(tx.image)} className="max-h-[400px] rounded-[30px] object-cover border-2 border-gray-800 shadow-xl mb-8" alt="Media" onError={(e) => (e.currentTarget.style.display = 'none')} />
                       )}
                       {tx.link && (
                         <p className="text-sm font-black text-blue-500 uppercase tracking-widest truncate">
                           URL: <a href={formatLink(tx.link)} target="_blank" className="underline lowercase hover:text-blue-400" rel="noreferrer">{tx.link}</a>
                         </p>
                       )}
                     </>
                   )}

                   {isEntry && (
                     <div className="flex flex-wrap gap-12 py-10 border-y border-gray-800/50 text-gray-500 items-center justify-center md:justify-start">
                         <button onClick={() => pushAction('post_like', '', activeSig)} className="hover:text-pink-500 text-3xl font-black flex items-center gap-3 transition-colors">
                           <span>❤️</span> <span className="text-xl">{stats.likes.length}</span>
                         </button>
                         <button onClick={() => pushAction('post_dislike', '', activeSig)} className="hover:text-orange-500 text-3xl font-black flex items-center gap-3 transition-colors">
                           <span>👎</span> <span className="text-xl">{stats.dislikes.length}</span>
                         </button>
                         <button onClick={() => setReplyTo(activeSig)} className="hover:text-blue-500 text-3xl font-black flex items-center gap-3 transition-colors">
                           <span>💬</span> <span className="text-xl">{stats.comments.length}</span>
                         </button>
                         <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${activeSig}`); triggerToast("Link Copied", "success"); }} className="hover:text-green-500 text-3xl transition-transform active:scale-90" title="Share Action">🔗</button>
                         <button onClick={() => {setExamineSig(activeSig); setAuditTab('ancestry');}} className="hover:text-white text-3xl transition-transform active:scale-90" title="Examine Data">🔍</button>
                         <div className="h-8 w-px bg-gray-800 hidden md:block" />
                         <button onClick={() => isHidden ? unhidePost(activeSig) : hidePost(activeSig)} className={`text-xs font-black uppercase tracking-widest transition-colors hover:underline ${isHidden ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'}`}>{isHidden ? 'Unhide From Feed' : 'Hide From Feed'}</button>
                     </div>
                   )}

                   {replyTo === activeSig && <div className="mt-8"><Composer parentSig={activeSig} /></div>}
                 </div>
              </div>

              <div className={`pt-8 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'} flex flex-col gap-3`}>
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Protocol Type: <span className="text-blue-500">{tx.type}</span></p>
                 {!tx.isSimulated && <a href={`https://explorer.solana.com/tx/${activeSig}?cluster=devnet`} target="_blank" className="text-xs font-mono text-gray-400 hover:text-blue-500 underline transition truncate block" rel="noreferrer">TX: {activeSig}</a>}
              </div>
            </>
          );
       })()}
    </div>
  );
}