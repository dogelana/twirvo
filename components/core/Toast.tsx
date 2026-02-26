'use client';
import React, { useEffect, useState } from 'react';
import { useTwirvo } from '@/contexts/TwirvoContext';

export default function Toast() {
  const { toast, theme } = useTwirvo();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000); // Auto-hide after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // If there's no toast, or it has faded out, render nothing
  if (!toast || !visible) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className={`fixed top-12 left-1/2 transform -translate-x-1/2 z-[300] px-8 py-4 rounded-full border-2 shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 fade-in duration-300 ${
      isSuccess 
        ? `bg-green-500/10 border-green-500 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}` 
        : `bg-red-500/10 border-red-500 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`
    } backdrop-blur-xl`}>
      <span className="text-2xl">{isSuccess ? '✅' : '❌'}</span>
      <p className="font-black uppercase tracking-widest text-sm">{toast.message}</p>
    </div>
  );
}