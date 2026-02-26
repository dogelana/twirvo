'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';

export default function SettingsModal() {
  const { 
    theme, toggleTheme, setShowSettings, currentProfile, publicKey,
    pushAction, userMap, triggerToast,
    profanityFilterEnabled, setProfanityFilterEnabled // Fix 2: Added profanity filter state
  } = useTwirvo();

  // UX States
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // Local state buffers
  const [localUsername, setLocalUsername] = useState(currentProfile?.username || '');
  const [localPfp, setLocalPfp] = useState(currentProfile?.pfp || '');
  const [localBio, setLocalBio] = useState(currentProfile?.bio || '');
  const [localLinks, setLocalLinks] = useState<string[]>(['', '', '', '', '', '']);

  // Edit trackers
  const hasEditedUsername = useRef(false);
  const hasEditedPfp = useRef(false);
  const hasEditedBio = useRef(false);
  const hasEditedLinks = useRef(false);

  useEffect(() => {
    if (currentProfile) {
      if (!hasEditedUsername.current) setLocalUsername(currentProfile.username || '');
      if (!hasEditedPfp.current) setLocalPfp(currentProfile.pfp || '');
      if (!hasEditedBio.current) setLocalBio(currentProfile.bio || '');
      if (!hasEditedLinks.current) {
        const initLinks = [...(currentProfile.links || [])];
        while (initLinks.length < 6) initLinks.push('');
        setLocalLinks(initLinks.slice(0, 6));
      }
    }
  }, [currentProfile]);

  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    // Fix 4: Maintain support for absolute simulated paths
    if (clean.startsWith('/')) return clean; 
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  const updateLink = (index: number, val: string) => {
    hasEditedLinks.current = true;
    const newLinks = [...localLinks];
    newLinks[index] = val;
    setLocalLinks(newLinks);
  };

  const isUsernameValid = localUsername.length === 0 || (localUsername.length >= 4 && localUsername.length <= 24);
  const isPfpValid = localPfp.length === 0 || (localPfp.length >= 5 && localPfp.length <= 500);
  const isBioValid = localBio.length === 0 || (localBio.length >= 10 && localBio.length <= 500);
  const areLinksValid = localLinks.every(l => l.length <= 100);

  const isUsernameNew = localUsername !== (currentProfile?.username || '');
  const isPfpNew = localPfp !== (currentProfile?.pfp || '');
  const isBioNew = localBio !== (currentProfile?.bio || '');
  
  const cleanLocalLinks = localLinks.filter(l => l.trim() !== '').map(formatLink);
  const cleanCurrentLinks = (currentProfile?.links || []).map(formatLink);
  const areLinksNew = JSON.stringify(cleanLocalLinks) !== JSON.stringify(cleanCurrentLinks);

  const handleUsernameSet = () => {
    if (!isUsernameValid || !isUsernameNew) return;
    if (localUsername.length > 0) {
        const isTaken = Object.values(userMap).some((u: any) => 
            u.username?.toLowerCase() === localUsername.toLowerCase() && !u.isSimulated
        );
        if (isTaken) {
            triggerToast("Username already claimed", "error");
            return;
        }
    }
    pushAction('username_set', localUsername);
  };

  const handleWipeCache = () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      triggerToast("Tap again to confirm wipe (Throttled refresh will trigger)", "warning");
      setTimeout(() => setConfirmWipe(false), 4000);
      return;
    }

    setIsWiping(true);
    triggerToast("Clearing memory... applying 500ms safety delay", "info");

    setTimeout(() => {
      localStorage.removeItem('twirvo_cache_v1');
      window.location.reload();
    }, 500); 
  };

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-12 rounded-[70px] max-w-5xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative shadow-3xl flex flex-col`}>
        <button onClick={() => setShowSettings(false)} className="absolute top-12 right-12 text-gray-500 text-4xl hover:text-blue-500 transition-colors">✕</button>
        
        <h2 className="text-5xl font-black uppercase italic text-blue-500 mb-12 tracking-widest">Settings</h2>
        
        <div className="space-y-12 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Operator Status */}
              <div className={`p-8 rounded-3xl border-2 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-xs font-black text-gray-500 uppercase mb-4 tracking-widest">Active Operator</p>
                <div className="flex items-center gap-4">
                  <img src={formatLink(currentProfile?.pfp) || DEFAULT_PFP} className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-xl object-cover" alt="Active PFP" />
                  <p className="text-xl font-black italic">{currentProfile?.username || publicKey?.toString().slice(0,8) || 'Unregistered'}</p>
                </div>
              </div>

              {/* Fix 9: Modernized Theme Toggle */}
              <div className="flex flex-col gap-4">
                <button 
                  onClick={toggleTheme} 
                  className={`flex items-center justify-between px-10 py-8 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full h-full border-2 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-blue-600 border-blue-500 text-white'
                  }`}
                >
                  <span className="text-xl">{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                  <span className="text-[10px] opacity-50">{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
                </button>
              </div>
            </div>

            {/* Fix 2: Profanity Filter integrated into settings */}
            <div className={`p-8 rounded-3xl border-4 ${profanityFilterEnabled ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-800 bg-black/20'}`}>
                <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                        <p className="text-sm font-black uppercase text-blue-500 tracking-widest mb-1">Optical Profanity Filter</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">When enabled, restricted language will be visually masked with asterisks (***) throughout the feed.</p>
                    </div>
                    <button 
                      onClick={() => setProfanityFilterEnabled(!profanityFilterEnabled)}
                      className={`px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                        profanityFilterEnabled 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {profanityFilterEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Username ({localUsername.length}/24)</label>
                <input 
                  className={`w-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${localUsername.length > 0 && !isUsernameValid ? 'border-red-500' : 'border-gray-800'} p-6 rounded-3xl outline-none focus:border-blue-500 text-xl font-bold`} 
                  value={localUsername} 
                  placeholder="Enter a username..."
                  onChange={e => { hasEditedUsername.current = true; setLocalUsername(e.target.value); }} 
                />
                <button 
                  onClick={handleUsernameSet} 
                  disabled={!isUsernameValid || !isUsernameNew}
                  className={`mt-6 w-full py-4 border-2 rounded-2xl font-black uppercase tracking-widest transition-all ${isUsernameValid && isUsernameNew ? 'bg-blue-500/10 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white' : 'opacity-20 cursor-not-allowed border-gray-500 text-gray-500'}`}
                >
                  {localUsername.length === 0 && isUsernameNew ? 'Clear Username' : isUsernameNew ? 'Set Username' : 'Already Set'}
                </button>
              </div>

              <div>
                <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Biography ({localBio.length}/500)</label>
                <textarea 
                  className={`w-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${localBio.length > 0 && !isBioValid ? 'border-red-500' : 'border-gray-800'} p-6 rounded-3xl outline-none h-32 text-lg font-medium`} 
                  value={localBio} 
                  placeholder="Enter a biography..."
                  onChange={e => { hasEditedBio.current = true; setLocalBio(e.target.value); }} 
                />
                <button 
                  onClick={() => pushAction('profile_bio_set', localBio)}
                  disabled={!isBioValid || !isBioNew}
                  className={`mt-6 w-full py-4 border-2 rounded-2xl font-black uppercase tracking-widest transition-all ${isBioValid && isBioNew ? 'bg-blue-500/10 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white' : 'opacity-20 cursor-not-allowed border-gray-500 text-gray-500'}`}
                >
                  {localBio.length === 0 && isBioNew ? 'Clear Biography' : isBioNew ? 'Set Biography' : 'Already Set'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Profile Links (Max 6)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localLinks.map((link, i) => (
                  <div key={i} className="flex gap-4">
                    <input
                      className={`flex-1 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${link.length > 100 ? 'border-red-500' : 'border-gray-800'} p-4 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold`}
                      placeholder={`Website Link #${i + 1}`}
                      value={link}
                      onChange={e => updateLink(i, e.target.value)}
                    />
                    {link && (
                      <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 border-blue-500/20 flex items-center justify-center bg-white shadow-sm">
                        <img src={`https://www.google.com/s2/favicons?domain=${formatLink(link)}&sz=64`} className="w-6 h-6 object-contain" alt="Favicon" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => pushAction('link_set', cleanLocalLinks)} 
                disabled={!areLinksValid || !areLinksNew}
                className={`mt-6 w-full py-4 border-2 rounded-2xl font-black uppercase tracking-widest transition-all ${areLinksValid && areLinksNew ? 'bg-blue-500/10 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white' : 'opacity-20 cursor-not-allowed border-gray-500 text-gray-500'}`}
              >
                {cleanLocalLinks.length === 0 && areLinksNew ? 'Clear Links' : areLinksNew ? 'Set All Links' : 'Links Already Set'}
              </button>
            </div>

          <div>
            <label className="text-xs uppercase font-black text-gray-500 tracking-widest block mb-4">Profile Picture URL</label>
            <div className="flex gap-4">
              <input 
                className={`flex-1 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} border-2 ${localPfp.length > 0 && !isPfpValid ? 'border-red-500' : 'border-gray-800'} p-6 rounded-3xl outline-none focus:border-blue-500 text-xl font-bold`} 
                value={localPfp} 
                placeholder="Enter an image link..."
                onChange={e => { hasEditedPfp.current = true; setLocalPfp(e.target.value); }} 
              />
              {localPfp && (
                <div className="relative group">
                  <img 
                    src={formatLink(localPfp)} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-xl" 
                    alt="PFP Preview"
                    onError={(e) => (e.currentTarget.src = DEFAULT_PFP)}
                  />
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-[8px] font-black px-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">PREVIEW</div>
                </div>
              )}
            </div>
            <button 
              onClick={() => pushAction('profile_picture_set', localPfp.length === 0 ? '' : formatLink(localPfp))} 
              disabled={!isPfpValid || !isPfpNew}
              className={`mt-6 w-full py-4 border-2 rounded-2xl font-black uppercase tracking-widest transition-all ${isPfpValid && isPfpNew ? 'bg-blue-500/10 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white' : 'opacity-20 cursor-not-allowed border-gray-500 text-gray-500'}`}
            >
              {localPfp.length === 0 && isPfpNew ? 'Clear PFP' : isPfpNew ? 'Set Profile Picture' : 'Already Set'}
            </button>
          </div>

          <div className="pt-10 border-t border-gray-800 text-center">
            <button 
              onClick={handleWipeCache} 
              disabled={isWiping}
              className={`py-6 px-12 rounded-3xl font-black uppercase tracking-widest transition-all border-2 shadow-inner ${
                isWiping 
                  ? 'bg-blue-600 border-blue-500 text-white animate-pulse cursor-wait'
                  : confirmWipe 
                    ? 'bg-red-600 border-red-500 text-white animate-bounce' 
                    : 'bg-red-900/10 border-red-900/30 text-red-500 hover:bg-red-900/20'
              }`}
            >
              {isWiping ? 'Processing RPC Delay...' : confirmWipe ? 'CONFIRM FULL WIPE?' : 'Wipe All Cached Transactions'}
            </button>
            <p className="text-[10px] uppercase font-black text-gray-600 mt-4 tracking-widest">Standard RPC Sync Rules: 2 Requests / Sec (500ms Delay)</p>
          </div>
        </div>
      </div>
    </div>
  );
}