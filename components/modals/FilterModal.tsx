'use client';
import React from 'react';
import { useTwirvo } from '@/contexts/TwirvoContext';

export default function FilterModal() {
  const { 
    theme, thresholds, setThresholds, setShowFilters, userFilter, setUserFilter,
    positiveKeywords, setPositiveKeywords, negativeKeywords, setNegativeKeywords,
    showSimulated, setShowSimulated
  } = useTwirvo();

  const update = (key: string, val: string) => {
    const num = val === '' ? 0 : parseInt(val);
    setThresholds(prev => ({ ...prev, [key]: num }));
  };

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-xl z-[110] flex items-center justify-center p-8 animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-12 rounded-[60px] max-w-4xl w-full relative shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar`}>
        <button onClick={() => setShowFilters(false)} className="absolute top-10 right-10 text-3xl hover:text-blue-500 transition-colors">✕</button>
        
        <h2 className="text-4xl font-black uppercase italic text-blue-500 mb-4 tracking-widest">Feed Filters</h2>
        <p className="text-xs text-gray-500 mb-10 uppercase font-black tracking-widest">Configure your engagement parameters and relevancy logic</p>

        <div className="grid grid-cols-2 gap-12">
          
          {/* Fix 2: Profanity Toggle removed from here (Moved to Settings) */}
          <div className="col-span-2 flex flex-col sm:flex-row gap-6 p-6 rounded-3xl border-2 border-blue-500/20 bg-blue-500/5">
            <div className="flex-1 flex items-center justify-between gap-4 pr-6">
               <div>
                  <h3 className="font-black uppercase tracking-widest text-sm text-blue-500">Simulated Posts</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Show AI generated dummy records</p>
               </div>
               <button 
                  onClick={() => setShowSimulated(!showSimulated)} 
                  className={`w-14 h-8 rounded-full transition-colors relative flex items-center border-2 border-transparent ${showSimulated ? 'bg-blue-600' : 'bg-gray-600'}`}
               >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${showSimulated ? 'translate-x-7' : 'translate-x-1'}`} />
               </button>
            </div>
          </div>

          <div className="space-y-4 col-span-2">
            <label className="text-[10px] font-black uppercase text-green-500 tracking-[0.2em]">👤 Targeted User Search</label>
            <input 
              type="text"
              placeholder="Enter usernames or wallet addresses..." 
              className={`w-full p-4 rounded-2xl border-2 ${theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} font-bold outline-none focus:border-green-500`} 
              value={userFilter} 
              onChange={e => setUserFilter(e.target.value)} 
            />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Separate multiple queries using commas.</p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-pink-500 tracking-[0.2em]">❤️ Likes Range</label>
            <div className="flex gap-4">
              <input type="number" placeholder="Min" className={`w-full p-4 rounded-2xl border-2 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'} font-bold outline-none focus:border-pink-500`} value={thresholds.minLikes} onChange={e => update('minLikes', e.target.value)} />
              <input type="number" placeholder="Max" className={`w-full p-4 rounded-2xl border-2 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'} font-bold outline-none focus:border-pink-500`} value={thresholds.maxLikes} onChange={e => update('maxLikes', e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">👎 Dislikes Range</label>
            <div className="flex gap-4">
              <input type="number" placeholder="Min" className={`w-full p-4 rounded-2xl border-2 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'} font-bold outline-none focus:border-orange-500`} value={thresholds.minDislikes} onChange={e => update('minDislikes', e.target.value)} />
              <input type="number" placeholder="Max" className={`w-full p-4 rounded-2xl border-2 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'} font-bold outline-none focus:border-orange-500`} value={thresholds.maxDislikes} onChange={e => update('maxDislikes', e.target.value)} />
            </div>
          </div>

          <div className="col-span-2 pt-8 border-t-2 border-gray-800">
            <h3 className="text-blue-500 font-black text-2xl uppercase tracking-widest mb-2 italic">
              Relevancy algorithm control
            </h3>
            <p className="text-[10px] text-gray-500 mb-8 uppercase font-black tracking-widest leading-relaxed">
              Positive keywords boost relevant posts, while negative keywords bury them in the <span className="text-blue-500">Most Relevant</span> tab.
            </p>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Positive Keywords</label>
                <textarea 
                  className={`${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 border-gray-800 p-6 rounded-[30px] text-sm font-bold h-32 outline-none focus:border-blue-500 shadow-inner resize-none`} 
                  placeholder="e.g. solana, crypto, profit..." 
                  value={positiveKeywords} 
                  onChange={e => setPositiveKeywords(e.target.value)} 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-pink-900 tracking-widest">Negative Keywords</label>
                <textarea 
                  className={`${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 border-gray-800 p-6 rounded-[30px] text-sm font-bold h-32 outline-none focus:border-pink-900 shadow-inner resize-none`} 
                  placeholder="e.g. scam, bot, spam..." 
                  value={negativeKeywords} 
                  onChange={e => setNegativeKeywords(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => setShowFilters(false)} className="mt-12 w-full bg-blue-600 py-6 rounded-3xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-transform">Apply Feed Filters</button>
        <button onClick={() => { setThresholds({ minLikes: 0, maxLikes: 9999, minDislikes: 0, maxDislikes: 9999, minComments: 0, maxComments: 9999 }); setUserFilter(''); setPositiveKeywords(''); setNegativeKeywords(''); }} className="mt-4 w-full text-[10px] font-black uppercase text-gray-500 hover:text-red-500 transition-colors">Reset All to Default</button>
      </div>
    </div>
  );
}