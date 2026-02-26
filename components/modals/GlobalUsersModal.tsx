'use client';
import React, { useState, useMemo } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import { censorText } from '@/utils/profanity';

export default function GlobalUsersModal() {
  const { 
    theme, setShowUsers, globalWalletList, userMap, followersMap, publicKey, 
    setView, setActiveUser, activeCommunity, communityStatsMap, userPointsMap,
    showSimulatedUsers, setShowSimulatedUsers, profanityFilterEnabled,
    userStatsMap // Added for Fix 7 reputation sorting
  } = useTwirvo();
  
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); 

  const myWallet = publicKey?.toString();
  const myFollowing = myWallet ? (followersMap[myWallet]?.following || []) : [];
  const myFollowers = myWallet ? (followersMap[myWallet]?.followers || []) : [];
  
  const isCommContext = !!activeCommunity;
  const commMembers = isCommContext ? (communityStatsMap[activeCommunity]?.members || []) : [];

  const filteredUsers = useMemo(() => {
    return globalWalletList.filter(w => {
      if (!showSimulatedUsers && userMap[w]?.isSimulated) return false;

      if (isCommContext && !commMembers.includes(w)) return false;
      if (tab === 'following' && !myFollowing.includes(w)) return false;
      if (tab === 'followers' && !myFollowers.includes(w)) return false;
      
      if (search) {
          const query = search.toLowerCase();
          const username = userMap[w]?.username?.toLowerCase() || "";
          const wallet = w.toLowerCase();
          if (!username.includes(query) && !wallet.includes(query)) return false;
      }
      return true;
    });
  }, [globalWalletList, isCommContext, commMembers, tab, myFollowing, myFollowers, search, userMap, showSimulatedUsers]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (tab === 'most_followed') return (followersMap[b]?.followers?.length || 0) - (followersMap[a]?.followers?.length || 0);
      
      // Fix 7: Sort by Profile Likes (Reputation)
      if (tab === 'most_liked') return (userStatsMap[b]?.likes?.length || 0) - (userStatsMap[a]?.likes?.length || 0);

      if (tab === 'most_active') {
        const ptsA = isCommContext ? (userPointsMap[a]?.comms[activeCommunity] || 0) : (userPointsMap[a]?.global || 0);
        const ptsB = isCommContext ? (userPointsMap[b]?.comms[activeCommunity] || 0) : (userPointsMap[b]?.global || 0);
        return ptsB - ptsA;
      }
      return 0; 
    });
  }, [filteredUsers, tab, followersMap, userStatsMap, userPointsMap, isCommContext, activeCommunity]);

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-16 rounded-[70px] max-w-4xl w-full h-[85vh] relative shadow-3xl flex flex-col`}>
        <button onClick={() => setShowUsers(false)} className="absolute top-12 right-12 text-gray-500 text-4xl hover:text-blue-500 transition-colors z-10">✕</button>
        
        <div className="flex justify-between items-start mb-10 flex-wrap gap-4 pr-12">
          <h2 className="text-5xl font-black uppercase italic text-blue-500 tracking-widest">
              {isCommContext ? 'Community Members' : 'Global Users Directory'}
          </h2>
          <button 
            onClick={() => setShowSimulatedUsers(!showSimulatedUsers)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex-shrink-0 ${
              showSimulatedUsers 
                ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            {showSimulatedUsers ? '🤖 Sims Visible' : '🤖 Sims Hidden'}
          </button>
        </div>
        
        <input 
          className={`w-full ${theme === 'dark' ? 'bg-black text-white focus:border-blue-500' : 'bg-gray-50 text-gray-900 focus:border-blue-500'} border-4 border-gray-800 p-6 rounded-3xl outline-none text-2xl font-black mb-8 shadow-inner`} 
          placeholder="Search Username or Wallet..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className={`flex gap-4 mb-8 overflow-x-auto custom-scrollbar border-b-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} pb-2`}>
          {/* Fix 7: Added 'most_liked' tab */}
          {['all', 'following', 'followers', 'most_followed', 'most_liked', 'most_active'].map(t => (
            <button 
              key={t}
              onClick={() => setTab(t)} 
              className={`pb-4 px-4 font-black uppercase text-xs tracking-widest whitespace-nowrap transition-colors ${tab === t ? 'text-blue-500 border-b-4 border-blue-500' : 'text-gray-500 hover:text-gray-400'}`}
            >
              {t === 'most_active' ? 'Most Active (Points)' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 content-start">
          {sortedUsers.length === 0 ? (
             <div className="p-20 text-center text-gray-500 font-black uppercase tracking-widest italic">
                No users match your criteria.
             </div>
          ) : (
            sortedUsers.map((w: string) => {
              const u = userMap[w] || {};
              const followersCount = followersMap[w]?.followers?.length || 0;
              const likesCount = userStatsMap[w]?.likes?.length || 0; // Fix 7: Likes Count
              const points = isCommContext ? (userPointsMap[w]?.comms[activeCommunity] || 0) : (userPointsMap[w]?.global || 0);
              
              const userDisplayName = u.username || w.slice(0, 8);

              return (
                <div key={w} className={`p-6 rounded-3xl border-2 flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 bg-black/40 hover:border-gray-700' : 'border-gray-200 bg-white hover:border-gray-300'} transition-colors group relative`}>
                  {u.isSimulated && <span className="absolute top-2 right-4 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded z-10">Simulated</span>}
                  <div className="flex items-center gap-6 min-w-0 pr-4">
                    <img src={u.pfp || DEFAULT_PFP} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/20 flex-shrink-0" alt="PFP" />
                    <div className="min-w-0">
                      <h3 className="text-2xl font-black text-blue-500 italic cursor-pointer hover:underline truncate" onClick={() => { setActiveUser(w); setView('profile'); setShowUsers(false); window.history.pushState({}, '', `/${u.username || w}`); }}>
                        {censorText(userDisplayName, profanityFilterEnabled)}
                      </h3>
                      <p className="text-xs font-mono text-gray-500">{w.slice(0, 16)}...</p>
                      {/* Fix 7: Show Followers, Likes, and Points breakdown */}
                      <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2 flex-wrap">
                        <span>👤 {followersCount} Followers</span>
                        <span>❤️ {likesCount} Likes</span>
                        <span className="text-blue-500/80">🏆 {points} Points</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setActiveUser(w); setView('profile'); setShowUsers(false); window.history.pushState({}, '', `/${u.username || w}`); }} 
                    className="px-6 py-3 border-2 border-blue-500/30 text-blue-500 rounded-xl font-black uppercase text-xs tracking-widest group-hover:bg-blue-500 group-hover:text-white transition-all active:scale-95 flex-shrink-0"
                  >
                    View ↗
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}