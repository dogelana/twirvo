'use client';
import React from 'react';
import { useTwirvo } from '@/contexts/TwirvoContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function LandingView() {
  const { theme } = useTwirvo();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-20 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className={`p-16 rounded-[60px] border-4 shadow-2xl ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} max-w-2xl`}>
        <h1 className="text-6xl font-black uppercase italic text-blue-500 mb-8 tracking-tighter">
          Welcome to Twirvo
        </h1>
        <p className={`text-xl font-bold mb-12 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          The decentralized ledger of social actions. Connect your wallet to explore the feed, 
          follow users, and post your own records onto the blockchain.
        </p>
        
        <div className="flex justify-center scale-150 transform">
          <WalletMultiButton />
        </div>
        
        <p className="mt-16 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
          Powered by Solana Devnet • No RPC calls until connected
        </p>
      </div>
    </div>
  );
}