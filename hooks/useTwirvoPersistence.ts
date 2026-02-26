'use client';
import { useState, useEffect } from 'react';

/**
 * useTwirvoPersistence
 * Handles all local settings, toggles, and blocklists that should 
 * survive a browser refresh.
 */
export function useTwirvoPersistence(triggerToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) {
  // Feed Matrix & Toggles
  const [positiveKeywords, setPositiveKeywords] = useState('solana, blockchain, crypto, NFTs, SOL, cryptocurrency');
  const [negativeKeywords, setNegativeKeywords] = useState('scam, airdrop, bot, spam');
  const [showSimulated, setShowSimulated] = useState(true); // Feed posts
  const [showSimulatedNotifs, setShowSimulatedNotifs] = useState(true); // Notifications
  const [showSimulatedUsers, setShowSimulatedUsers] = useState(true); // User Directory
  const [showSimulatedBlocklist, setShowSimulatedBlocklist] = useState(true); // Blocklist/Hidden Posts
  
  // Content Safety
  const [profanityFilterEnabled, setProfanityFilterEnabled] = useState(true); // On by default

  // Persistent Feed Filter
  const [filter, setFilter] = useState('oldest'); // Defaults to Oldest for the protocol view

  // Threshold Filters
  const [showFilters, setShowFilters] = useState(false);
  const [thresholds, setThresholds] = useState({ 
    minLikes: 0, maxLikes: 9999, 
    minDislikes: 0, maxDislikes: 9999, 
    minComments: 0, maxComments: 9999 
  });
  
  // Blocklists & Hidden Items
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  
  // Notification States
  const [showNotifsModal, setShowNotifsModal] = useState(false);
  const [readNotifs, setReadNotifs] = useState<string[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. INITIAL LOAD: Pull all settings from LocalStorage
  useEffect(() => {
    const sPos = localStorage.getItem('twirvo_pos_keys'); if (sPos) setPositiveKeywords(sPos);
    const sNeg = localStorage.getItem('twirvo_neg_keys'); if (sNeg) setNegativeKeywords(sNeg);
    const sSim = localStorage.getItem('twirvo_show_simulated'); if (sSim) setShowSimulated(sSim === 'true');
    const sSimNotif = localStorage.getItem('twirvo_show_sim_notifs'); if (sSimNotif) setShowSimulatedNotifs(sSimNotif === 'true');
    const sSimUsers = localStorage.getItem('twirvo_show_sim_users'); if (sSimUsers) setShowSimulatedUsers(sSimUsers === 'true'); 
    const sSimBlocklist = localStorage.getItem('twirvo_show_sim_blocklist'); if (sSimBlocklist) setShowSimulatedBlocklist(sSimBlocklist === 'true');
    const sProfanity = localStorage.getItem('twirvo_profanity_filter'); if (sProfanity) setProfanityFilterEnabled(sProfanity === 'true');
    
    // Load the saved feed filter (Fallback to 'oldest' if never set)
    const sFilter = localStorage.getItem('twirvo_feed_filter'); 
    if (sFilter) setFilter(sFilter);

    const sThresh = localStorage.getItem('twirvo_thresholds'); if (sThresh) setThresholds(JSON.parse(sThresh));
    const sHid = localStorage.getItem('twirvo_hidden_posts'); if (sHid) setHiddenPosts(JSON.parse(sHid));
    const sBlock = localStorage.getItem('twirvo_blocked_users'); if (sBlock) setBlockedUsers(JSON.parse(sBlock));
    const sRead = localStorage.getItem('twirvo_read_notifs'); if (sRead) setReadNotifs(JSON.parse(sRead));
    const sDism = localStorage.getItem('twirvo_dismissed_notifs'); if (sDism) setDismissedNotifs(JSON.parse(sDism));
    
    setIsLoaded(true);
  }, []);

  // 2. AUTO-SAVE: Write settings to LocalStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('twirvo_pos_keys', positiveKeywords);
      localStorage.setItem('twirvo_neg_keys', negativeKeywords);
      localStorage.setItem('twirvo_show_simulated', showSimulated.toString());
      localStorage.setItem('twirvo_show_sim_notifs', showSimulatedNotifs.toString());
      localStorage.setItem('twirvo_show_sim_users', showSimulatedUsers.toString()); 
      localStorage.setItem('twirvo_show_sim_blocklist', showSimulatedBlocklist.toString());
      localStorage.setItem('twirvo_profanity_filter', profanityFilterEnabled.toString());
      
      // Save feed selection
      localStorage.setItem('twirvo_feed_filter', filter);

      localStorage.setItem('twirvo_thresholds', JSON.stringify(thresholds));
      localStorage.setItem('twirvo_hidden_posts', JSON.stringify(hiddenPosts));
      localStorage.setItem('twirvo_blocked_users', JSON.stringify(blockedUsers));
      localStorage.setItem('twirvo_read_notifs', JSON.stringify(readNotifs));
      localStorage.setItem('twirvo_dismissed_notifs', JSON.stringify(dismissedNotifs));
    }
  }, [
    positiveKeywords, negativeKeywords, showSimulated, showSimulatedNotifs, 
    showSimulatedUsers, showSimulatedBlocklist, profanityFilterEnabled, 
    filter, thresholds, hiddenPosts, blockedUsers, readNotifs, dismissedNotifs, isLoaded
  ]);

  // Blocklist Helper Functions
  const hidePost = (sig: string) => { 
    if (!hiddenPosts.includes(sig)) { 
      setHiddenPosts(prev => [...prev, sig]); 
      triggerToast('Post hidden from feed', 'success'); 
    } 
  };

  const unhidePost = (sig: string) => { 
    setHiddenPosts(prev => prev.filter(s => s !== sig)); 
    triggerToast('Post unhidden from feed', 'success'); 
  };

  const blockUser = (wallet: string) => { 
    if (!blockedUsers.includes(wallet)) { 
      setBlockedUsers(prev => [...prev, wallet]); 
      triggerToast('Explorer blocked', 'success'); 
    } 
  };

  const unblockUser = (wallet: string) => { 
    setBlockedUsers(prev => prev.filter(w => w !== wallet)); 
    triggerToast('Explorer unblocked', 'success'); 
  };

  // Notification Helper Functions
  const markNotifRead = (sig: string) => setReadNotifs(prev => [...new Set([...prev, sig])]);
  const markNotifUnread = (sig: string) => setReadNotifs(prev => prev.filter(s => s !== sig));
  const dismissNotif = (sig: string) => setDismissedNotifs(prev => [...new Set([...prev, sig])]);

  return {
    positiveKeywords, setPositiveKeywords, negativeKeywords, setNegativeKeywords,
    showSimulated, setShowSimulated, 
    showSimulatedNotifs, setShowSimulatedNotifs, 
    showSimulatedUsers, setShowSimulatedUsers, 
    showSimulatedBlocklist, setShowSimulatedBlocklist,
    profanityFilterEnabled, setProfanityFilterEnabled,
    filter, setFilter,
    showFilters, setShowFilters, thresholds, setThresholds,
    showHiddenModal, setShowHiddenModal, hiddenPosts, hidePost, unhidePost,
    blockedUsers, blockUser, unblockUser,
    showNotifsModal, setShowNotifsModal, readNotifs, dismissedNotifs, markNotifRead, markNotifUnread, dismissNotif
  };
}