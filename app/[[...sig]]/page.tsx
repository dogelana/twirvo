'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

// Context
import { TwirvoProvider, useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';

// Core Components
import Navbar from '@/components/core/Navbar';
import SyncOverlay from '@/components/core/SyncOverlay';
import Toast from '@/components/core/Toast';

// Views
import FeedView from '@/components/views/FeedView';
import ProfileView from '@/components/views/ProfileView';
import DirectView from '@/components/views/DirectView';
import IdentityAuditView from '@/components/views/IdentityAuditView';
import LandingView from '@/components/views/LandingView';

// Modals
import SettingsModal from '@/components/modals/SettingsModal';
import ForensicAuditModal from '@/components/modals/ForensicAuditModal';
import GlobalUsersModal from '@/components/modals/GlobalUsersModal';
import FilterModal from '@/components/modals/FilterModal';
import HiddenPostsModal from '@/components/modals/HiddenPostsModal';
import NotificationsModal from '@/components/modals/NotificationsModal';
import CreateCommunityModal from '@/components/modals/CreateCommunityModal';
import EditCommunityModal from '@/components/modals/EditCommunityModal'; 
import CommunitiesDirectoryModal from '@/components/modals/CommunitiesDirectoryModal';
import CommunityHistoryModal from '@/components/modals/CommunityHistoryModal';

function TwirvoApp() {
  const { 
    theme, view, examineSig, 
    showSettings, setShowSettings, 
    showUsers, setShowUsers,
    showFilters,
    showHiddenModal, setShowHiddenModal,
    showNotifsModal, setShowNotifsModal, unreadNotifCount,
    showCommunities, setShowCommunities,
    showCreateCommunity,
    showEditCommunity, 
    showCommHistory,
    setView, setActiveUser, publicKey, currentProfile,
    connected, setActiveCommunity
  } = useTwirvo();

  // Helper to reset all modal states
  const closeAllModals = () => {
    setShowSettings(false);
    setShowCommunities(false);
    setShowNotifsModal(false);
    setShowUsers(false);
    setShowHiddenModal(false);
  };

  // Helper to ensure only one specific modal is open at a time
  const openSingleModal = (modalSetter: (val: boolean) => void) => {
    closeAllModals();
    modalSetter(true);
  };

  const OrbLabel = ({ text }: { text: string }) => (
    <span className={`absolute left-full ml-10 px-6 py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-[0.2em] pointer-events-none opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap shadow-[0_0_40px_rgba(59,130,246,0.5)] z-[200] ${
      theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
    }`}>
      {text}
    </span>
  );

  const btnBase = `flex items-center justify-center border-2 md:border-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 
                    p-4 md:p-5 lg:p-7 text-2xl md:text-3xl lg:text-5xl flex-shrink-0`;
  const btnTheme = theme === 'dark' ? 'bg-gray-900 border-gray-800 shadow-blue-500/20' : 'bg-white border-gray-200 shadow-blue-500/10';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      <SyncOverlay />
      <Toast />
      <Navbar />

      <main className={`max-w-5xl mx-auto border-x ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} min-h-screen pb-40`}>
        {!connected ? (
          <LandingView />
        ) : (
          <>
            {view === 'feed' && <FeedView />}
            {view === 'profile' && <ProfileView />}
            {view === 'direct' && <DirectView />}
            {view === 'id_audit' && <IdentityAuditView />}
          </>
        )}
      </main>

      {connected && (
        <div className="fixed left-[5px] top-1/2 -translate-y-1/2 flex flex-col gap-6 md:gap-8 z-[150] items-center overflow-visible py-10 px-4">
          
          <div className="relative flex items-center group overflow-visible">
            <button 
              onClick={() => { 
                closeAllModals();
                setActiveCommunity(null); 
                setView('feed'); 
                window.history.pushState({}, '', '/'); 
              }} 
              className={`${btnBase} ${btnTheme}`}
            >
              🏠
            </button>
            <OrbLabel text="Home" />
          </div>

          <div className="relative flex items-center group overflow-visible">
            <button onClick={() => openSingleModal(setShowCommunities)} className={`${btnBase} ${btnTheme}`}>🌍</button>
            <OrbLabel text="Communities" />
          </div>

          <div className="relative flex items-center group overflow-visible">
            <button onClick={() => openSingleModal(setShowNotifsModal)} className={`relative ${btnBase} ${btnTheme}`}>
              🔔
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-gray-900 shadow-lg animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <OrbLabel text="Notifications" />
          </div>

          <div className="relative flex items-center group overflow-visible">
            <button onClick={() => openSingleModal(setShowHiddenModal)} className={`${btnBase} ${btnTheme}`}>🙈</button>
            <OrbLabel text="Blocklist" />
          </div>

          <div className="relative flex items-center group overflow-visible">
            <button onClick={() => openSingleModal(setShowUsers)} className={`${btnBase} ${btnTheme}`}>👤</button>
            <OrbLabel text="Users" />
          </div>
          
          <div className="relative flex items-center group overflow-visible">
            <button 
              onClick={() => { 
                closeAllModals();
                setActiveUser(publicKey?.toString() || null); 
                setView('profile'); 
                window.history.pushState({}, '', `/${currentProfile?.username || publicKey?.toString()}`); 
              }} 
              className={`flex items-center justify-center border-2 md:border-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex-shrink-0
                          w-16 h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 ${btnTheme}`}
            >
              <img src={currentProfile?.pfp || DEFAULT_PFP} className="w-full h-full rounded-full object-cover" alt="My Profile" />
            </button>
            <OrbLabel text="Profile" />
          </div>

          <div className="relative flex items-center group overflow-visible">
            <button onClick={() => openSingleModal(setShowSettings)} className={`${btnBase} ${btnTheme}`}>⚙️</button>
            <OrbLabel text="Settings" />
          </div>
        </div>
      )}

      {/* Modals */}
      {examineSig && <ForensicAuditModal />}
      {showSettings && <SettingsModal />}
      {showUsers && <GlobalUsersModal />}
      {showFilters && <FilterModal />}
      {showHiddenModal && <HiddenPostsModal />}
      {showNotifsModal && <NotificationsModal />}
      {showCreateCommunity && <CreateCommunityModal />}
      {showEditCommunity && <EditCommunityModal />}
      {showCommunities && <CommunitiesDirectoryModal />}
      {showCommHistory && <CommunityHistoryModal />}
    </div>
  );
}

export default function TwirvoPage() {
  // Use the Helius URL from environment variables, fallback to public devnet if missing
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com", 
  []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="bg-black min-h-screen" />;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <TwirvoProvider>
            <TwirvoApp />
          </TwirvoProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}