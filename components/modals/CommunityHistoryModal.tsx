'use client';
import React, { useMemo } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import { censorText } from '@/utils/profanity';

export default function CommunityHistoryModal() {
  const { 
    theme, setShowCommHistory, commAuditSig, communityHistory, 
    profanityFilterEnabled, setView, setActiveSig 
  } = useTwirvo();

  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.startsWith('./')) clean = clean.substring(1); 
    if (clean.startsWith('/')) return clean;
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  const history = useMemo(() => {
    if (!commAuditSig || !communityHistory[commAuditSig]) return [];
    return [...communityHistory[commAuditSig]].sort((a, b) => a.timestamp - b.timestamp);
  }, [commAuditSig, communityHistory]);

  if (!commAuditSig) return null;

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-xl z-[120] flex items-center justify-center p-8 animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-12 rounded-[60px] max-w-[95vw] w-full relative shadow-3xl max-h-[85vh] flex flex-col`}>
        
        <button onClick={() => setShowCommHistory(false)} className="absolute top-10 right-10 text-3xl hover:text-blue-500 transition-colors z-20">✕</button>

        <div className="mb-8 pr-12 flex-shrink-0">
          <h2 className="text-4xl font-black uppercase italic text-blue-500 tracking-widest mb-2">Community Commit Log</h2>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Historical state changes from oldest to newest</p>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar border-2 border-gray-800/50 rounded-2xl bg-black/10">
          {history.length === 0 ? (
            <p className="text-center py-20 font-black uppercase tracking-widest text-gray-500">No history found for this entity.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur shadow-sm whitespace-nowrap">
                <tr className={`border-b-4 ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-300 text-gray-500'} text-[10px] uppercase font-black tracking-widest`}><th className="p-4 px-6 border-r border-gray-800/50">Timestamp</th><th className="p-4 px-6 border-r border-gray-800/50">Action Type</th><th className="p-4 px-6 border-r border-gray-800/50">Details</th><th className="p-4 px-6 border-r border-gray-800/50">Media</th><th className="p-4 px-6 border-r border-gray-800/50">Biography</th><th className="p-4 px-6 border-r border-gray-800/50">Attached Links</th><th className="p-4 px-6">Ledger Verification</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {history.map((h:any) => (
                  <tr key={h.txSig} className={`transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><td className="p-4 px-6 border-r border-gray-800/50 align-top whitespace-nowrap">
                      <p className="text-xs font-bold text-gray-400">{new Date(h.timestamp).toLocaleString()}</p>
                    </td><td className="p-4 px-6 border-r border-gray-800/50 align-top whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest ${h.type === 'create_community' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}>
                        {h.type === 'create_community' ? 'Created' : 'Edited'}
                      </span>
                    </td><td className="p-4 px-6 border-r border-gray-800/50 align-top min-w-[200px]">
                      <div className="text-sm font-black italic text-blue-400 break-words whitespace-normal mb-2">
                        {h.name ? censorText(h.name, profanityFilterEnabled) : <span className="text-gray-600 font-mono not-italic text-xs">-- No Name Change --</span>}
                      </div>
                      {h.token && (
                        <div className="font-mono text-[10px] text-blue-500/60 break-all bg-blue-500/5 p-2 rounded border border-blue-500/10">
                          Addy: {h.token}
                        </div>
                      )}
                    </td><td className="p-4 px-6 border-r border-gray-800/50 align-top">
                      <div className="flex gap-4">
                        {h.banner && (
                          <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase text-gray-600">Banner</span>
                             <a href={formatLink(h.banner)} target="_blank" rel="noreferrer">
                               <img src={formatLink(h.banner)} className="h-10 w-20 object-cover rounded-md border border-gray-600 hover:scale-110 transition-transform" alt="Banner" />
                             </a>
                          </div>
                        )}
                        {h.pfp && (
                          <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase text-gray-600">Logo</span>
                             <a href={formatLink(h.pfp)} target="_blank" rel="noreferrer">
                               <img src={formatLink(h.pfp)} className="h-10 w-10 object-cover rounded-md border border-gray-600 hover:scale-110 transition-transform" alt="PFP" />
                             </a>
                          </div>
                        )}
                      </div>
                    </td><td className="p-4 px-6 border-r border-gray-800/50 align-top min-w-[250px]">
                      <div className={`text-xs font-medium italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words whitespace-normal leading-relaxed`}>
                        {h.bio ? `"${censorText(h.bio, profanityFilterEnabled)}"` : <span className="text-gray-600 font-mono not-italic">-- No Bio Change --</span>}
                      </div>
                    </td><td className="p-4 px-6 border-r border-gray-800/50 align-top min-w-[200px]">
                      {h.links && h.links.filter(Boolean).length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {h.links.filter(Boolean).map((l: string, i: number) => (
                             <a 
                               key={i} 
                               href={formatLink(l)} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="text-xs font-bold text-blue-400 hover:text-blue-300 underline break-all whitespace-normal block"
                             >
                               {l}
                             </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600 font-mono text-xs">--</span>
                      )}
                    </td><td className="p-4 px-6 align-top">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => { 
                            setActiveSig(h.txSig); 
                            setView('direct'); 
                            setShowCommHistory(false); 
                            window.history.pushState({}, '', `/${h.txSig}`); 
                          }}
                          className="text-[9px] px-4 py-2 bg-blue-600 text-white rounded-lg uppercase font-black hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap"
                        >
                          Traverse to Entry ↗
                        </button>

                        {!h.txSig.startsWith('sim_') && (
                          <a 
                            href={`https://explorer.solana.com/tx/${h.txSig}?cluster=devnet`} 
                            target="_blank" 
                            className="text-[9px] px-4 py-2 border-2 border-blue-500/30 text-blue-500 rounded-lg uppercase font-black text-center hover:bg-blue-500 hover:text-white transition-all whitespace-nowrap" 
                            rel="noreferrer"
                          >
                            View Source TX
                          </a>
                        )}
                        <span className="text-[8px] font-mono text-gray-500 mt-1 block truncate w-32">ID: {h.txSig.slice(0,16)}...</span>
                      </div>
                    </td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}