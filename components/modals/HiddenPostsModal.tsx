'use client';
import React, { useState } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import { censorText } from '@/utils/profanity'; // NEW: Feature #24

export default function HiddenPostsModal() {
  const { 
    theme, setShowHiddenModal, hiddenPosts, unhidePost, 
    blockedUsers, unblockUser, txLedger, userMap,
    showSimulatedBlocklist, setShowSimulatedBlocklist, // NEW: Feature #13
    profanityFilterEnabled // NEW: Feature #24
  } = useTwirvo();
  
  const [tab, setTab] = useState<'posts' | 'users'>('posts');

  // Bug #12: Reusable link formatter to ensure simulated absolute paths don't break
  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.startsWith('/')) return clean;
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  // FEATURE #13: Apply the toggle filter to the underlying arrays
  const visibleHiddenPosts = hiddenPosts.filter((sig: any) => {
    if (showSimulatedBlocklist) return true;
    const post = txLedger[sig];
    if (post?.isSimulated || sig.startsWith('sim_')) return false;
    return true;
  });

  const visibleBlockedUsers = blockedUsers.filter(wallet => {
    if (showSimulatedBlocklist) return true;
    const user = userMap[wallet];
    if (user?.isSimulated || wallet.startsWith('Simulated')) return false;
    return true;
  });

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-xl z-[110] flex items-center justify-center p-8`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-12 rounded-[60px] max-w-3xl w-full relative shadow-3xl max-h-[80vh] flex flex-col`}>
        <button onClick={() => setShowHiddenModal(false)} className="absolute top-10 right-10 text-3xl hover:text-blue-500 transition-colors z-20">✕</button>

        <div className="flex justify-between items-start mb-6 pr-12 flex-wrap gap-4">
          <h2 className="text-4xl font-black uppercase italic text-blue-500 tracking-widest">Local Blocklist</h2>
          
          {/* FEATURE #13: Universal Sim Toggle Button */}
          <button 
            onClick={() => setShowSimulatedBlocklist(!showSimulatedBlocklist)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex-shrink-0 ${
              showSimulatedBlocklist 
                ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            {showSimulatedBlocklist ? '🤖 Sims Visible' : '🤖 Sims Hidden'}
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setTab('posts')} 
            className={`px-6 py-3 font-black uppercase tracking-widest rounded-2xl transition-all ${tab === 'posts' ? 'bg-blue-500 text-white' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'}`}
          >
            Hidden Posts
          </button>
          <button 
            onClick={() => setTab('users')} 
            className={`px-6 py-3 font-black uppercase tracking-widest rounded-2xl transition-all ${tab === 'users' ? 'bg-red-500 text-white' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'}`}
          >
            Blocked Users
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 space-y-6 pr-4">
          
          {/* TAB 1: HIDDEN POSTS */}
          {tab === 'posts' && (
            visibleHiddenPosts.length === 0 ? (
              <p className="text-center text-gray-500 font-bold uppercase tracking-widest py-12">
                 {hiddenPosts.length > 0 ? 'All hidden posts are currently filtered out (Simulated)' : 'No hidden posts'}
              </p>
            ) : (
              visibleHiddenPosts.map(sig => {
                const post = txLedger[sig];
                if (!post) return null;
                const user = userMap[post.sender] || {};

                return (
                  <div key={sig} className={`p-6 border-2 rounded-3xl flex items-center justify-between gap-6 relative overflow-hidden ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-gray-50'}`}>
                    {post.isSimulated && <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg">Sim</span>}
                    <div className="flex items-center gap-4 truncate flex-1 min-w-0">
                       <img src={formatLink(user.pfp) || DEFAULT_PFP} className="w-12 h-12 rounded-full object-cover shadow-md flex-shrink-0" alt="PFP" />
                       <div className="truncate min-w-0">
                         <p className="font-black text-blue-500 text-[10px] tracking-widest truncate">{censorText(user.username || post.sender.slice(0,8), profanityFilterEnabled)}</p>
                         <p className="text-lg font-medium truncate">{censorText(post.text, profanityFilterEnabled)}</p>
                       </div>
                    </div>
                    <button onClick={() => unhidePost(sig)} className="px-6 py-3 bg-blue-500/10 text-blue-500 font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 hover:text-white transition-colors text-[10px] shrink-0">
                      Unhide
                    </button>
                  </div>
                );
              })
            )
          )}

          {/* TAB 2: BLOCKED USERS */}
          {tab === 'users' && (
            visibleBlockedUsers.length === 0 ? (
              <p className="text-center text-gray-500 font-bold uppercase tracking-widest py-12">
                 {blockedUsers.length > 0 ? 'All blocked users are currently filtered out (Simulated)' : 'No blocked users'}
              </p>
            ) : (
              visibleBlockedUsers.map(wallet => {
                const user = userMap[wallet] || {};
                
                return (
                  <div key={wallet} className={`p-6 border-2 rounded-3xl flex items-center justify-between gap-6 relative overflow-hidden ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-gray-50'}`}>
                    {user.isSimulated && <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg">Sim</span>}
                    <div className="flex items-center gap-6 truncate flex-1 min-w-0">
                       <img src={formatLink(user.pfp) || DEFAULT_PFP} className="w-16 h-16 rounded-full object-cover shadow-md flex-shrink-0" alt="PFP" />
                       <div className="truncate min-w-0">
                         <p className="font-black text-blue-500 text-xl tracking-widest truncate">{censorText(user.username || wallet.slice(0,8), profanityFilterEnabled)}</p>
                         <p className="text-[10px] font-mono text-gray-500 truncate">{wallet}</p>
                       </div>
                    </div>
                    <button onClick={() => unblockUser(wallet)} className="px-6 py-3 bg-red-500/10 text-red-500 font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-colors text-[10px] shrink-0">
                      Unblock
                    </button>
                  </div>
                );
              })
            )
          )}

        </div>
      </div>
    </div>
  );
}