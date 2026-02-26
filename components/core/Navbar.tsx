'use client';
import React from 'react';
import Image from 'next/image';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTwirvo } from '@/contexts/TwirvoContext';

export default function Navbar() {
  const { theme, setView, balance, setShowFilters, connected } = useTwirvo();

  return (
    <nav className={`border-b ${theme === 'dark' ? 'border-gray-800 bg-black/80' : 'border-gray-200 bg-white/80'} p-8 flex justify-between items-center sticky top-0 backdrop-blur z-50 shadow-xl`}>
      {/* Updated Logo Section */}
      <div 
        onClick={() => { setView('feed'); window.history.pushState({}, '', '/'); }} 
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <Image 
          src="/logo.svg" 
          alt="Twirvo Logo" 
          width={180} 
          height={50} 
          priority 
          className="object-contain"
        />
      </div>
      
      <div className="flex items-center gap-8">
        {connected && (
          <button 
            onClick={() => setShowFilters(true)} 
            className={`p-4 border-2 rounded-2xl text-2xl hover:scale-110 active:scale-95 transition-all shadow-lg ${theme === 'dark' ? 'bg-gray-900 border-gray-800 shadow-blue-500/5' : 'bg-white border-gray-200'}`}
            title="Post Filters"
          >
            🎚️
          </button>
        )}

        <div className="flex flex-col items-end gap-2">
          <WalletMultiButton className="!h-14 !px-8 !text-base !font-black !uppercase" />
          {balance !== null && (
            <span className="text-xs font-black uppercase text-gray-500 tracking-widest">
              {balance.toFixed(4)} SOL
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}