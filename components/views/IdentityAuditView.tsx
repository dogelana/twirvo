'use client';
import React, { useMemo } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import { censorText } from '@/utils/profanity'; 

export default function IdentityAuditView() {
  const { 
    theme, setView, idAuditSig, userMap, idAuditTab, setIdAuditTab, 
    txLedger, setActiveSig, profanityFilterEnabled, setActiveUser // IMPORTED setActiveUser
  } = useTwirvo();

  // Force initial tab if undefined to prevent blank content
  const activeTab = idAuditTab || 'names';

  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.startsWith('/')) return clean; 
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}` ;
    return clean;
  };

  const historyData = useMemo(() => {
    if (!idAuditSig) return { names: [], pfps: [], bios: [], links: [] };
    
    // Match sender address explicitly as string for robustness
    const userActions = Object.entries(txLedger)
      .filter(([sig, tx]: [string, any]) => tx.sender?.toString() === idAuditSig.toString())
      .map(([sig, tx]: [string, any]) => ({ sig, ...tx }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      names: userActions.filter((tx:any) => tx.type === 'username_set'),
      pfps: userActions.filter((tx:any) => tx.type === 'profile_picture_set'),
      bios: userActions.filter((tx:any) => tx.type === 'profile_bio_set' || tx.type === 'bio_set'),
      links: userActions.filter((tx:any) => tx.type === 'link_set'),
    };
  }, [idAuditSig, txLedger]);

  if (!idAuditSig) return null;

  const targetUsername = censorText(userMap[idAuditSig]?.username || idAuditSig.slice(0,8), profanityFilterEnabled);

  return (
    <div className="p-20 animate-in fade-in">
       {/* PERFECTED NAVIGATION: Sets user, sets view, updates URL */}
       <button 
         onClick={() => {
           setActiveUser(idAuditSig);
           setView('profile');
           window.history.pushState({}, '', `/${userMap[idAuditSig]?.username || idAuditSig}`);
         }} 
         className="text-gray-500 mb-8 font-bold uppercase text-xs hover:text-blue-500 transition-colors"
       >
         ← Go to <span className="normal-case">{targetUsername}</span>'s Profile
       </button>
       
       <h2 className="text-5xl font-black uppercase italic text-blue-500 mb-10 tracking-widest text-center md:text-left break-words whitespace-normal">
         Identity Record: <span className="normal-case">{targetUsername}</span>
       </h2>
       
       <div className="flex border-b border-gray-800 mb-10 overflow-x-auto custom-scrollbar">
          {['names', 'pfps', 'bios', 'links'].map(t => (
            <button 
              key={t} 
              onClick={() => setIdAuditTab(t)} 
              className={`flex-1 py-5 px-4 text-xs font-black uppercase tracking-widest whitespace-nowrap ${activeTab === t ? 'text-blue-500 border-b-4 border-blue-500' : 'text-gray-600 hover:text-gray-400 transition-colors'}`}
            >
              {t}
            </button>
          ))}
       </div>

       <div className="space-y-6">
          {(historyData[activeTab as keyof typeof historyData] || []).length === 0 ? (
            <p className="text-center py-20 text-gray-500 font-black uppercase tracking-widest">No archived {activeTab} found for this entity.</p>
          ) : (
            (historyData[activeTab as keyof typeof historyData] || []).map((h: any, i: number) => (
              <div key={h.sig} className={`p-8 rounded-3xl border-2 ${theme === 'dark' ? 'border-gray-800 bg-black/40' : 'border-gray-200 bg-white'} flex justify-between items-center shadow-inner hover:scale-[1.01] transition-transform`}>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-xs text-blue-500 font-black mb-4 uppercase tracking-widest">Update #{i+1} - {new Date(h.timestamp).toLocaleString()}</p>
                  
                  {activeTab === 'pfps' && (
                    <img src={formatLink(h.text) || DEFAULT_PFP} className="w-24 h-24 rounded-full shadow-2xl border-4 border-blue-500/20 object-cover" alt="Archived PFP" />
                  )}

                  {activeTab === 'links' && (
                    <div className="flex flex-col gap-3">
                      {(Array.isArray(h.text) ? h.text : [h.text]).filter(Boolean).map((link: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 min-w-0">
                             <img 
                                src={`https://www.google.com/s2/favicons?domain=${formatLink(link)}&sz=64`} 
                                className="w-10 h-10 rounded-xl bg-white p-1 border-2 border-blue-500/10 flex-shrink-0" 
                                alt=""
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                             />
                             <p className="text-xl font-bold truncate text-blue-400">"{link}"</p>
                          </div>
                      ))}
                    </div>
                  )}

                  {(activeTab === 'names' || activeTab === 'bios') && (
                    <p className="text-xl font-bold italic truncate md:whitespace-normal break-words whitespace-normal normal-case">"{censorText(h.text, profanityFilterEnabled)}"</p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button 
                    onClick={() => { setActiveSig(h.sig); setView('direct'); window.history.pushState({}, '', `/${h.sig}`); }}
                    className="text-[10px] px-6 py-2 bg-blue-600 text-white rounded-full uppercase font-black hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    Traverse to Entry ↗
                  </button>

                  {!h.sig.startsWith('sim_') && (
                    <a 
                      href={`https://explorer.solana.com/tx/${h.sig}?cluster=devnet`} 
                      target="_blank" 
                      className="text-[10px] px-6 py-2 border-2 border-blue-500/30 text-blue-500 rounded-full uppercase font-black text-center hover:bg-blue-500 hover:text-white transition-all" 
                      rel="noreferrer"
                    >
                      View Source TX
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
       </div>
    </div>
  );
}