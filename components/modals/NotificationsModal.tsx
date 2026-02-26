'use client';
import React, { useEffect, useRef } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import { censorText } from '@/utils/profanity';

function NotificationItem({ notif, theme }: { notif: any, theme: string }) {
  const { 
    userMap, markNotifRead, markNotifUnread, dismissNotif, 
    setView, setActiveSig, setActiveUser, txLedger, setShowNotifsModal,
    communityMap, setActiveCommunity, setFilter, profanityFilterEnabled, publicKey 
  } = useTwirvo();
  
  const itemRef = useRef<HTMLDivElement>(null);
  const manuallyUnread = useRef(false); 
  const user = userMap[notif.sender] || {};

  useEffect(() => {
    if (notif.isRead) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !manuallyUnread.current) {
        setTimeout(() => {
          if (!manuallyUnread.current) {
            markNotifRead(notif.signature);
          }
        }, 500);
      }
    }, { threshold: 0.5 });

    if (itemRef.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, [notif.isRead, notif.signature, markNotifRead]);

  let actionText = '';
  let icon = '';
  
  if (notif.type === 'post_like') { actionText = 'liked your post'; icon = '❤️'; }
  else if (notif.type === 'post_dislike') { actionText = 'disliked your post'; icon = '👎'; }
  else if (notif.type === 'post_comment') { actionText = 'commented on your post'; icon = '💬'; }
  
  if (notif.type === 'post_comment' && txLedger[notif.parent]?.sender !== userMap) {
    actionText = 'commented on a comment on your post';
  }

  else if (notif.type === 'follow_user') { actionText = 'followed you'; icon = '🤝'; }
  else if (notif.type === 'unfollow_user') { actionText = 'unfollowed you'; icon = '💔'; }
  
  else if (notif.type === 'post') { actionText = 'posted a post'; icon = '📝'; }
  else if (notif.type === 'create_community') { actionText = 'created a community'; icon = '🏛️'; }
  else if (notif.type === 'join_community') { actionText = 'joined a community'; icon = '🚪'; }

  else if (notif.type === 'like_user') { actionText = 'liked your profile'; icon = '⭐️'; }
  else if (notif.type === 'dislike_user') { actionText = 'disliked your profile'; icon = '📉'; }

  else if (notif.type === 'leave_community') { actionText = 'left a community you created'; icon = '👋'; }
  else if (notif.type === 'community_like') { actionText = 'liked a community you created'; icon = '🏛️❤️'; }
  else if (notif.type === 'community_dislike') { actionText = 'disliked a community you created'; icon = '🏛️👎'; }

  if (notif.type === 'post' && notif.parent_community) {
      const commOwner = communityMap[notif.parent_community]?.owner;
      if (commOwner !== publicKey?.toString()) {
          actionText = 'posted a post in a community you joined';
      }
  }

  return (
    <div 
      ref={itemRef} 
      className={`p-6 border-2 rounded-3xl flex items-start gap-6 transition-colors shadow-md ${
        notif.isRead 
          ? (theme === 'dark' ? 'border-gray-800 bg-gray-900/30 opacity-70' : 'border-gray-200 bg-gray-50 opacity-70') 
          : (theme === 'dark' ? 'border-blue-500/50 bg-blue-900/10' : 'border-blue-400 bg-blue-50')
      }`}
    >
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <img 
          src={user.pfp || DEFAULT_PFP} 
          className="w-12 h-12 rounded-full object-cover shadow-lg cursor-pointer border border-gray-700" 
          onClick={() => { 
            setActiveUser(notif.sender); 
            setView('profile'); 
            window.history.pushState({}, '', `/${user.username || notif.sender}`);
            setShowNotifsModal(false); 
          }}
          alt="PFP" 
        />
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap mb-1">
           <p className="text-[10px] text-gray-500 font-mono">{new Date(notif.timestamp).toLocaleString()}</p>
           {notif.parent_community && communityMap[notif.parent_community] && (
              <button 
                onClick={() => { 
                  setActiveCommunity(notif.parent_community); 
                  setFilter('newest'); 
                  setView('feed'); 
                  window.history.pushState({}, '', `/community/${notif.parent_community}`); 
                  setShowNotifsModal(false);
                }} 
                className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-md hover:bg-blue-500/20 transition-colors cursor-pointer truncate max-w-[150px]"
              >
                🏛️ {censorText(communityMap[notif.parent_community].name, profanityFilterEnabled)}
              </button>
           )}
        </div>
        
        <p className="text-sm break-words whitespace-normal leading-relaxed">
          {/* FIX 7: Removed uppercase, added normal-case to respect original casing */}
          <span className="font-black text-blue-500 tracking-widest mr-2 normal-case">{censorText(user.username || notif.sender.slice(0,8), profanityFilterEnabled)}</span>
          <span className="font-bold text-gray-500">{actionText}</span>
        </p>
        
        {(notif.type === 'post' || notif.type === 'post_comment') && (
          <p className="mt-2 text-lg font-medium italic truncate">"{censorText(notif.text, profanityFilterEnabled)}"</p>
        )}
        
        <button 
          onClick={() => { 
            if (notif.type.includes('user')) {
              setActiveUser(notif.sender); 
              setView('profile'); 
              window.history.pushState({}, '', `/${user.username || notif.sender}`);
            } else {
              setActiveSig(notif.signature); 
              setView('direct'); 
              window.history.pushState({}, '', `/${notif.signature}`); 
            }
            setShowNotifsModal(false); 
          }} 
          className="mt-4 text-xs font-black uppercase text-blue-500 underline hover:text-blue-400 transition-colors block"
        >
          {notif.type.includes('user') ? 'View Profile' : 'View Record'}
        </button>
      </div>

      <div className="flex flex-col gap-4 items-end flex-shrink-0">
        <button onClick={() => dismissNotif(notif.signature)} className="text-gray-500 hover:text-red-500 text-xl font-bold transition">✕</button>
        <button 
          onClick={() => {
            if (notif.isRead) {
              manuallyUnread.current = true; 
              markNotifUnread(notif.signature);
            } else {
              manuallyUnread.current = false; 
              markNotifRead(notif.signature);
            }
          }} 
          className="text-2xl hover:scale-110 transition"
          title={notif.isRead ? "Mark Unread" : "Mark Read"}
        >
          {notif.isRead ? '📭' : '📬'}
        </button>
      </div>
    </div>
  );
}

export default function NotificationsModal() {
  const { 
    theme, 
    setShowNotifsModal, 
    myNotifications, 
    showSimulatedNotifs, 
    setShowSimulatedNotifs 
  } = useTwirvo();

  const filteredNotifs = myNotifications.filter((n: any) => 
    showSimulatedNotifs ? true : !n.isSimulated
  );

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-xl z-[110] flex items-center justify-center p-8 animate-in fade-in`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border-4 p-12 rounded-[60px] max-w-3xl w-full relative shadow-3xl max-h-[85vh] flex flex-col`}>
        
        <button onClick={() => setShowNotifsModal(false)} className="absolute top-10 right-10 text-3xl hover:text-blue-500 transition-colors z-20">✕</button>

        <div className="flex justify-between items-start mb-2 pr-12">
          <div>
            <h2 className="text-4xl font-black uppercase italic text-blue-500 tracking-widest">Notifications Hub</h2>
            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Scroll to mark as read</p>
          </div>
          
          <button 
            onClick={() => setShowSimulatedNotifs(!showSimulatedNotifs)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ml-4 flex-shrink-0 ${
              showSimulatedNotifs 
                ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            {showSimulatedNotifs ? '🤖 Sims Visible' : '🤖 Sims Hidden'}
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-4 mt-6">
          {filteredNotifs.length === 0 ? (
            <p className="text-center text-gray-500 font-bold uppercase tracking-widest py-12">
              {myNotifications.length > 0 ? 'The only notifications available are simulated (hidden)' : 'No new notifications'}
            </p>
          ) : (
            filteredNotifs.map((notif: any) => (
              <NotificationItem key={notif.signature} notif={notif} theme={theme} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}