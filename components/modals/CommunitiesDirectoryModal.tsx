'use client';
import React, { useState } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';

export default function CommunitiesDirectoryModal() {
  const { theme, setShowCommunities, setShowCreateCommunity, communityMap, communityStatsMap, setActiveCommunity, setView, userMap, publicKey, setFilter } = useTwirvo();
  const [search, setSearch] = useState('');
  // CHANGED: Initial state is now 'newest'
  const [directoryTab, setDirectoryTab] = useState('newest'); 

  const communities = Object.entries(communityMap || {}).map(([id, data]) => ({ id, ...data as any }));
  
  let filtered = communities.filter((c: any) => {
    const creatorUser = userMap[c.owner]?.username?.toLowerCase() || "";
    const creatorWallet = c.owner.toLowerCase();
    const query = search.toLowerCase();
    
    return c.name?.toLowerCase().includes(query) || 
           c.bio?.toLowerCase().includes(query) || 
           creatorUser.includes(query) || 
           creatorWallet.includes(query);
  });

  const getStats = (id: string) => communityStatsMap[id] || { members:[], likes:[], dislikes:[], postCount:0, commentCount:0 };

  if (directoryTab === 'joined') {
      filtered = filtered.filter((c:any) => getStats(c.id).members.includes(publicKey?.toString() || ""));
      filtered.sort((a, b) => {
          const aMine = a.owner === publicKey?.toString() ? 1 : 0;
          const bMine = b.owner === publicKey?.toString() ? 1 : 0;
          if (aMine !== bMine) return bMine - aMine;
          return b.timestamp - a.timestamp;
      });
  } else {
      filtered.sort((a, b) => {
        const statsA = getStats(a.id);
        const statsB = getStats(b.id);
        // CHANGED: Logic now checks for 'newest'
        if (directoryTab === 'newest') return b.timestamp - a.timestamp;
        if (directoryTab === 'members') return statsB.members.length - statsA.members.length;
        if (directoryTab === 'liked') return statsB.likes.length - statsA.likes.length;
        if (directoryTab === 'active') return (statsB.postCount + statsB.commentCount) - (statsA.postCount + statsA.commentCount);
        return 0;
      });
  }

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-16 rounded-[70px] max-w-4xl w-full h-[85vh] relative shadow-3xl flex flex-col`}>
        <button onClick={() => setShowCommunities(false)} className="absolute top-12 right-12 text-gray-500 text-4xl hover:text-blue-500 transition-colors z-10">✕</button>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-10 pr-12">
          <h2 className="text-5xl font-black uppercase italic text-blue-500 tracking-widest">Community Directory</h2>
          <button 
            onClick={() => {
              setShowCommunities(false);
              setShowCreateCommunity(true);
            }} 
            className={`px-8 py-4 border-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800 text-blue-400 hover:bg-blue-800 hover:text-white' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white'}`}
          >
            + Create Community
          </button>
        </div>
        
        <input 
          className={`w-full ${theme === 'dark' ? 'bg-black text-white focus:border-blue-500' : 'bg-gray-50 text-gray-900 focus:border-blue-500'} border-4 border-gray-800 p-6 rounded-3xl outline-none text-2xl font-black mb-6 shadow-inner`} 
          placeholder="Search Directory..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className={`flex gap-4 mb-8 overflow-x-auto custom-scrollbar border-b-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} pb-2`}>
          {/* CHANGED: Array now includes 'newest' instead of 'recent' */}
          {['joined', 'newest', 'members', 'liked', 'active'].map(t => (
             <button 
               key={t} 
               onClick={() => setDirectoryTab(t)} 
               className={`pb-4 px-4 font-black uppercase text-xs tracking-widest whitespace-nowrap transition-colors ${directoryTab === t ? 'text-blue-500 border-b-4 border-blue-500' : 'text-gray-500 hover:text-gray-400'}`}
             >
                {/* CHANGED: Label logic for 'newest' */}
                {t === 'joined' ? 'Joined' : t === 'newest' ? 'Newest' : `Most ${t}`}
             </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
          {filtered.length === 0 ? (
            <div className="col-span-full p-20 text-center text-gray-500 font-black uppercase tracking-widest italic">
              No matching communities found in the index.
            </div>
          ) : (
            filtered.map((comm:any) => {
              const stats = getStats(comm.id);
              const isMine = comm.owner === publicKey?.toString();
              const creatorDisplayName = userMap[comm.owner]?.username || comm.owner.slice(0, 8);

              return (
                <div key={comm.id} className={`p-8 rounded-3xl border-4 flex flex-col justify-between ${theme === 'dark' ? 'bg-black/40 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'} transition-colors group relative overflow-hidden`}>
                  {comm.isSimulated && <span className="absolute top-4 right-4 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded z-20">Simulated</span>}
                  {isMine && <span className="absolute top-4 right-4 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded z-20">Created By You</span>}
                  
                  {comm.banner && <img src={comm.banner} className="absolute inset-0 w-full h-full object-cover opacity-10 z-0 pointer-events-none" alt="" />}
                  
                  <div className="z-10 relative">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={comm.pfp || DEFAULT_PFP} className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500/20" alt="PFP" />
                      <div>
                        <h3 className="text-2xl font-black text-blue-500 italic truncate">{comm.name}</h3>
                        <p className="text-[10px] font-black text-gray-500 tracking-widest truncate mb-1 normal-case">
                          By: {creatorDisplayName}
                        </p>
                        <div className="flex gap-3 text-[10px] font-black text-gray-400">
                           <span>👤 {stats.members.length}</span>
                           <span>❤️ {stats.likes.length}</span>
                           <span>📝 {stats.postCount + stats.commentCount}</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm font-medium mb-8 line-clamp-3 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{comm.bio ? `"${comm.bio}"` : ''}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setActiveCommunity(comm.id);
                      setFilter('newest'); // Sync global filter
                      setView('feed');
                      setShowCommunities(false);
                      window.history.pushState({}, '', `/community/${comm.id}`);
                    }} 
                    className="z-10 relative w-full py-4 border-2 border-blue-500/30 text-blue-500 rounded-xl font-black uppercase text-xs tracking-widest group-hover:bg-blue-500 group-hover:text-white transition-all active:scale-95"
                  >
                    Enter Community ↗
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