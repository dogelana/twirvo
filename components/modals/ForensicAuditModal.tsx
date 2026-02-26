'use client';
import React from 'react';
import { useTwirvo } from '@/contexts/TwirvoContext';

export default function ForensicAuditModal() {
  const { theme, examineSig, setExamineSig, auditTab, setAuditTab, statsMap, posts, setActiveSig, setView } = useTwirvo();

  if (!examineSig) return null;

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/98' : 'bg-white/98'} flex items-center justify-center p-8 z-[70] backdrop-blur-3xl animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-16 rounded-[80px] w-full max-w-4xl shadow-2xl`}>
        <h3 className="text-blue-500 font-black uppercase italic text-2xl mb-12 text-center tracking-widest">Examiner</h3>
        
        <div className={`flex border-b-2 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'} mb-12`}>
          {['likes', 'dislikes', 'comments', 'ancestry'].map(t => (
            <button key={t} onClick={() => setAuditTab(t)} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-colors ${auditTab === t ? 'text-blue-500 border-b-4 border-blue-500' : 'text-gray-500 hover:text-gray-400'}`}>{t}</button>
          ))}
        </div>

        <div className="space-y-8 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
           {auditTab === 'ancestry' && (
             <div className="space-y-8">
                {(() => {
                  let gen = examineSig;
                  while(statsMap[gen]?.parent) { gen = statsMap[gen].parent; }
                  const genPost = posts.find((p: any) => p.signature === gen);
                  
                  const pSig = statsMap[examineSig]?.parent;
                  const pData = [...posts, ...Object.values(statsMap).flatMap((s: any) => s.comments)].find((x: any) => x.signature === pSig);

                  return (
                    <>
                      {/* Genesis Root Node */}
                      {genPost && gen !== examineSig && (
                        <div className={`p-8 border-4 rounded-[40px] animate-in zoom-in-95 ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-white' : 'bg-blue-50 border-blue-200 text-gray-900'}`}>
                           <p className="text-[10px] text-blue-500 font-black uppercase mb-4 tracking-widest">Genesis Entry</p>
                           <p className="text-2xl font-black mb-6 tracking-tighter">"{genPost.text}"</p>
                           {!gen.startsWith('sim_') && (
                             <div className="flex gap-6">
                               <button onClick={() => { setActiveSig(gen); setView('direct'); setExamineSig(null); window.history.pushState({}, '', `/${gen}`); }} className="text-blue-500 text-xs underline font-bold uppercase hover:text-blue-400 transition-colors">Traverse to Entry ↗</button>
                               <a href={`https://explorer.solana.com/tx/${gen}?cluster=devnet`} target="_blank" className="text-gray-500 text-xs underline font-bold uppercase hover:text-gray-400 transition-colors" rel="noreferrer">View Source Tx ↗</a>
                             </div>
                           )}
                        </div>
                      )}

                      {/* Direct Parent Node */}
                      {pData && pSig !== gen && (
                        <div className={`p-8 border-4 rounded-[40px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-200 border-gray-300 text-gray-900'}`}>
                           <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Parent Entry</p>
                           <p className="text-xl font-bold mb-6">"{pData.text}"</p>
                           {!pSig.startsWith('sim_') && (
                             <div className="flex gap-6">
                               <button onClick={() => { setActiveSig(pSig); setView('direct'); setExamineSig(null); window.history.pushState({}, '', `/${pSig}`); }} className="text-blue-500 text-xs underline font-bold uppercase hover:text-blue-400 transition-colors">Traverse to Entry ↗</button>
                               <a href={`https://explorer.solana.com/tx/${pSig}?cluster=devnet`} target="_blank" className="text-gray-500 text-xs underline font-bold uppercase hover:text-gray-400 transition-colors" rel="noreferrer">View Source Tx ↗</a>
                             </div>
                           )}
                        </div>
                      )}

                      {/* Active Target */}
                      <div className={`p-8 border-4 rounded-[40px] ${theme === 'dark' ? 'bg-blue-600/5 border-blue-600/10 text-white' : 'bg-blue-50 border-blue-200 text-gray-900'}`}>
                         <p className="text-[10px] text-blue-500 font-black uppercase mb-4 tracking-widest">Active Entry</p>
                         <p className="text-xl italic mb-6">"{[...posts, ...Object.values(statsMap).flatMap(s => s.comments)].find(x => x.signature === examineSig)?.text}"</p>
                         {!examineSig.startsWith('sim_') && (
                           <div className="flex gap-6">
                             <button onClick={() => { setActiveSig(examineSig); setView('direct'); setExamineSig(null); window.history.pushState({}, '', `/${examineSig}`); }} className="text-blue-500 text-xs underline font-bold uppercase hover:text-blue-400 transition-colors">Traverse to Entry ↗</button>
                             <a href={`https://explorer.solana.com/tx/${examineSig}?cluster=devnet`} target="_blank" className="text-gray-500 text-xs underline font-bold uppercase hover:text-gray-400 transition-colors" rel="noreferrer">View Source Tx ↗</a>
                           </div>
                         )}
                      </div>
                    </>
                  );
                })()}
             </div>
           )}

           {auditTab === 'likes' && (statsMap[examineSig]?.likes || []).map((l: any) => (
             <div key={l.sig} className={`p-6 border-2 rounded-3xl flex justify-between items-center ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                <span className="text-[10px] font-mono text-gray-500">TX: {l.sig.slice(0,24)}...</span>
                {!l.sig.startsWith('sim_') && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveSig(l.sig); setView('direct'); setExamineSig(null); window.history.pushState({}, '', `/${l.sig}`); }} className="text-blue-500 text-[10px] font-black uppercase underline hover:text-blue-400 transition-colors">Traverse ↗</button>
                    <a href={`https://explorer.solana.com/tx/${l.sig}?cluster=devnet`} target="_blank" className="text-gray-500 text-[10px] font-black uppercase underline hover:text-gray-400 transition-colors" rel="noreferrer">Source ↗</a>
                  </div>
                )}
             </div>
           ))}

           {auditTab === 'dislikes' && (statsMap[examineSig]?.dislikes || []).map((d: any) => (
             <div key={d.sig} className={`p-6 border-2 rounded-3xl flex justify-between items-center ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                <span className="text-[10px] font-mono text-gray-500">TX: {d.sig.slice(0,24)}...</span>
                {!d.sig.startsWith('sim_') && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveSig(d.sig); setView('direct'); setExamineSig(null); window.history.pushState({}, '', `/${d.sig}`); }} className="text-blue-500 text-[10px] font-black uppercase underline hover:text-blue-400 transition-colors">Traverse ↗</button>
                    <a href={`https://explorer.solana.com/tx/${d.sig}?cluster=devnet`} target="_blank" className="text-gray-500 text-[10px] font-black uppercase underline hover:text-gray-400 transition-colors" rel="noreferrer">Source ↗</a>
                  </div>
                )}
             </div>
           ))}

           {auditTab === 'comments' && (statsMap[examineSig]?.comments || []).map((c: any) => (
             <div key={c.signature} className={`p-6 border-2 rounded-3xl flex justify-between items-center ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                <span className="text-[10px] font-mono text-gray-500">TX: {c.signature.slice(0,24)}...</span>
                {!c.signature.startsWith('sim_') && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveSig(c.signature); setView('direct'); setExamineSig(null); window.history.pushState({}, '', `/${c.signature}`); }} className="text-blue-500 text-[10px] font-black uppercase underline hover:text-blue-400 transition-colors">Traverse ↗</button>
                    <a href={`https://explorer.solana.com/tx/${c.signature}?cluster=devnet`} target="_blank" className="text-gray-500 text-[10px] font-black uppercase underline hover:text-gray-400 transition-colors" rel="noreferrer">Source ↗</a>
                  </div>
                )}
             </div>
           ))}
        </div>

        <button onClick={() => setExamineSig(null)} className={`w-full mt-12 py-6 rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl transition hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>Close</button>
      </div>
    </div>
  );
}