'use client';
import React, { useState } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';

export default function CreateCommunityModal() {
  const { theme, setShowCreateCommunity, pushAction } = useTwirvo();

  const [name, setName] = useState('');
  const [pfp, setPfp] = useState('');
  const [banner, setBanner] = useState('');
  const [bio, setBio] = useState('');
  const [token, setToken] = useState('');
  const [links, setLinks] = useState<string[]>(['', '', '', '', '', '']);

  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    // Fix 4: Ensure local simulated paths are preserved
    if (clean.startsWith('/')) return clean; 
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  const isNameValid = name.length > 0 && name.length <= 50;
  const isPfpValid = pfp.length === 0 || pfp.length <= 500;
  const isBannerValid = banner.length === 0 || banner.length <= 500;
  const isBioValid = bio.length <= 500;
  const isTokenValid = token.length === 0 || (token.length >= 30 && token.length <= 50);
  const isLinksValid = links.every(l => l.length <= 100);
  const canSubmit = isNameValid && isPfpValid && isBannerValid && isBioValid && isTokenValid && isLinksValid;

  const updateLink = (index: number, val: string) => {
    const newLinks = [...links];
    newLinks[index] = val;
    setLinks(newLinks);
  };

  const handleFoundCommunity = () => {
    if (!canSubmit) return;
    
    pushAction('create_community', `Founded ${name}`, undefined, {
      community_name: name,
      community_pfp: formatLink(pfp),
      community_banner: formatLink(banner),
      community_bio: bio,
      community_token: token,
      community_links: links.filter(l => l.trim() !== '').map(formatLink) 
    });
    
    setShowCreateCommunity(false);
  };

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-12 rounded-[70px] max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative shadow-3xl`}>
        <button onClick={() => setShowCreateCommunity(false)} className="absolute top-12 right-12 text-gray-500 text-4xl hover:text-blue-500 transition-colors z-20">✕</button>
        
        <div className="mb-12">
            <h2 className="text-5xl font-black uppercase italic text-blue-500 mb-2 tracking-widest leading-none">Found a Community</h2>
            {/* FIX 1: Fee Description */}
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                Founding a new on-chain community requires a one-time protocol fee of <span className="text-blue-500">0.1 SOL</span>.
            </p>
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Community Name ({name.length}/50)</label>
            <input 
              className={`w-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${name.length > 50 ? 'border-red-500' : 'border-gray-800'} p-6 rounded-3xl outline-none focus:border-blue-500 text-xl font-bold`} 
              placeholder="e.g. Solana Devs..."
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Community Token Address (Optional)</label>
            <input 
              className={`w-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${token.length > 0 && !isTokenValid ? 'border-red-500' : 'border-gray-800'} p-6 rounded-3xl outline-none focus:border-blue-500 text-xl font-mono`} 
              placeholder="Enter a token address..."
              value={token} 
              onChange={e => setToken(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Community Banner Link (Optional)</label>
            <input 
              className={`w-full mb-4 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${banner.length > 0 && !isBannerValid ? 'border-red-500' : 'border-gray-800'} p-6 rounded-3xl outline-none focus:border-blue-500 text-xl font-bold`} 
              placeholder="Enter an image link..."
              value={banner} 
              onChange={e => setBanner(e.target.value)} 
            />
            {banner && (
              <div className="w-full h-[200px] rounded-[30px] overflow-hidden border-4 border-gray-800 relative bg-black flex items-center justify-center">
                <img 
                   src={formatLink(banner)} 
                   className="w-full h-full object-cover" 
                   alt="Banner Preview" 
                   onError={(e) => { e.currentTarget.style.opacity = '0'; }} 
                   onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Community Logo Link (Optional)</label>
            <div className="flex gap-4 items-center">
              <input 
                className={`flex-1 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${pfp.length > 0 && !isPfpValid ? 'border-red-500' : 'border-gray-800'} p-6 rounded-3xl outline-none focus:border-blue-500 text-xl font-bold`} 
                placeholder="Enter an image link..."
                value={pfp} 
                onChange={e => setPfp(e.target.value)} 
              />
              {pfp && (
                 <img 
                   src={formatLink(pfp)} 
                   className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-xl" 
                   alt="Preview"
                   onError={(e) => (e.currentTarget.src = DEFAULT_PFP)}
                 />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Community Biography (Optional) ({bio.length}/500)</label>
            <textarea 
              className={`w-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${bio.length > 500 ? 'border-red-500' : 'border-gray-800'} p-6 rounded-[30px] outline-none h-32 text-lg font-medium`} 
              placeholder="Enter a biography..."
              value={bio} 
              onChange={e => setBio(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Community Links (Optional) (Max 6)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {links.map((link, i) => (
                <div key={i} className="flex gap-4">
                  <input
                    className={`flex-1 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${link.length > 100 ? 'border-red-500' : 'border-gray-800'} p-4 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold`}
                    placeholder={`Enter a website link...`}
                    value={link}
                    onChange={e => updateLink(i, e.target.value)}
                  />
                  {link && (
                    <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 border-blue-500 flex items-center justify-center bg-white shadow-lg">
                      <img src={`https://www.google.com/s2/favicons?domain=${formatLink(link)}&sz=64`} className="w-6 h-6 object-contain" alt="Favicon Preview" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleFoundCommunity} 
            disabled={!canSubmit}
            className={`w-full py-6 mt-4 border-4 rounded-3xl font-black uppercase text-xl tracking-widest transition-all ${canSubmit ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-xl' : 'opacity-20 cursor-not-allowed border-gray-500 text-gray-500'}`}
          >
            {/* FIX 1: Updated Button Label */}
            Create Community (0.1 SOL)
          </button>
        </div>
      </div>
    </div>
  );
}