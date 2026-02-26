'use client';
import { useState, useEffect } from 'react';

export function useTwirvoUI() {
  const [view, setView] = useState('feed'); 
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeSig, setActiveSig] = useState<string | null>(null);
  
  const [activeCommunity, setActiveCommunity] = useState<string | null>(null);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showEditCommunity, setShowEditCommunity] = useState(false);
  const [showCommunities, setShowCommunities] = useState(false);
  
  // Feature #7 Community History State
  const [showCommHistory, setShowCommHistory] = useState(false);
  const [commAuditSig, setCommAuditSig] = useState<string | null>(null);

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [examineSig, setExamineSig] = useState<string | null>(null);
  const [auditTab, setAuditTab] = useState('ancestry');
  
  // Note: 'filter' and 'setFilter' have been moved to useTwirvoPersistence
  const [userFilter, setUserFilter] = useState(''); // Comma-separated users/wallets
  const [showSettings, setShowSettings] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [idAuditSig, setIdAuditSig] = useState<string | null>(null);
  const [idAuditTab, setIdAuditTab] = useState('names');
  const [profileTab, setProfileTab] = useState('posts');
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const firstPath = parts[0];
      const secondPath = parts[1];

      if (firstPath.toLowerCase() === 'community' && secondPath) {
        setActiveCommunity(secondPath);
        setView('feed');
      } else if (firstPath.length > 60 || firstPath.startsWith('sim_')) {
        setActiveSig(firstPath);
        setView('direct');
      } else {
        setPendingRoute(firstPath);
      }
    }
  }, []); 

  const [memoText, setMemoText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postLink, setPostLink] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', id: number } | null>(null);
  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, id: Date.now() });
  };

  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const savedTheme = localStorage.getItem('twirvo_theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('twirvo_theme', newTheme);
  };

  return {
    view, setView, activeUser, setActiveUser, activeSig, setActiveSig,
    activeCommunity, setActiveCommunity, showCreateCommunity, setShowCreateCommunity, 
    showEditCommunity, setShowEditCommunity, showCommunities, setShowCommunities,
    showCommHistory, setShowCommHistory, commAuditSig, setCommAuditSig,
    replyTo, setReplyTo, examineSig, setExamineSig, auditTab, setAuditTab,
    userFilter, setUserFilter, showSettings, setShowSettings, showUsers, setShowUsers,
    idAuditSig, setIdAuditSig, idAuditTab, setIdAuditTab, profileTab, setProfileTab,
    pendingRoute, setPendingRoute, memoText, setMemoText, postImage, setPostImage,
    postLink, setPostLink, showImageInput, setShowImageInput, showLinkInput, setShowLinkInput,
    toast, triggerToast, theme, toggleTheme
  };
}