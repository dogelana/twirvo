'use client';
import React from 'react';
import { useTwirvo } from '@/contexts/TwirvoContext';

export default function SyncOverlay() {
  const { 
    syncProgress, 
    theme, 
    isPosting, 
    txCountdown, 
    isLoadingFeed,
    cancelTx,
    connected,
    pendingActionType // NEW: Feature #4
  } = useTwirvo();

  // 1. Logic Check: Only sync if the wallet is connected. 
  // If not connected, we shouldn't be showing a blocker.
  const isSyncing = connected && syncProgress.total > 0 && syncProgress.current < syncProgress.total;
  
  // 2. Hide if not connected OR if the loading/syncing is finished
  const showSync = connected && (isLoadingFeed || isSyncing);

  // If we aren't trying to sync and we aren't currently posting, GET OUT of the way.
  if (!showSync && !isPosting) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center backdrop-blur-md transition-colors ${
      theme === 'dark' ? 'bg-black/90' : 'bg-white/90'
    }`}>
      
      {isPosting ? (
        /* --- TRANSACTION COUNTDOWN STATE --- */
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="relative flex items-center justify-center mb-8">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className={theme === 'dark' ? 'text-gray-800' : 'text-gray-200'}
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={552.9}
                strokeDashoffset={552.9 - (552.9 * (txCountdown || 0)) / 90}
                className="text-blue-500 transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-6xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {txCountdown}
            </span>
          </div>

          {/* FEATURE #4: Removed "Etch" terminology and added Action Type transparency */}
          <h2 className="text-4xl font-black text-blue-500 uppercase italic tracking-widest animate-pulse">
            Awaiting Confirmation
          </h2>
          
          {pendingActionType && (
            <div className="mt-6 px-6 py-2 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl shadow-inner">
               <p className="text-sm font-black text-blue-500 uppercase tracking-widest">
                 Pending Action: {pendingActionType}
               </p>
            </div>
          )}

          <p className={`mt-6 font-mono text-lg tracking-widest uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Confirm in Wallet
          </p>
          
          <p className="text-red-500 mt-6 text-xs uppercase font-black tracking-[0.3em]">
            Transaction Expires in {txCountdown}s
          </p>

          <button 
            onClick={cancelTx}
            className={`mt-12 px-8 py-4 border-2 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-110 active:scale-95 transition-all ${
              theme === 'dark' 
                ? 'border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-500' 
                : 'border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500'
            }`}
          >
            Cancel Action
          </button>
        </div>
      ) : (
        /* --- STANDARD LEDGER SYNC STATE --- */
        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 border-8 rounded-full animate-spin mb-8 ${
            theme === 'dark' ? 'border-gray-800 border-t-blue-500' : 'border-gray-200 border-t-blue-500'
          }`}></div>
          <h2 className="text-4xl font-black text-blue-500 uppercase italic tracking-widest animate-pulse">
            Syncing Ledger
          </h2>
          <p className={`mt-6 font-mono text-lg tracking-widest ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {syncProgress.total > 0 
              ? `${syncProgress.current} / ${syncProgress.total} Blocks` 
              : 'Establishing Connection...'}
          </p>
          <p className="text-red-500 mt-6 text-xs uppercase font-black tracking-[0.3em]">
            Rate Limiting Active • 2 Requests / Sec
          </p>
        </div>
      )}
    </div>
  );
}