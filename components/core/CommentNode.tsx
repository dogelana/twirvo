'use client';
import React, { useState, useEffect } from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';
import Composer from './Composer';
import { censorText } from '@/utils/profanity';

export default function CommentNode({ comment }: { comment: any }) {
  const { 
    theme, userMap, statsMap, publicKey, pushAction, setActiveUser, 
    setView, setReplyTo, replyTo, setActiveSig, 
    blockedUsers, hiddenPosts, hidePost, unhidePost, setExamineSig, setAuditTab, triggerToast,
    communityMap, setActiveCommunity, setFilter, profanityFilterEnabled 
  } = useTwirvo();

  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(`twirvo_collapsed_${comment.signature}`);
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, [comment.signature]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (nextState) {
      localStorage.setItem(`twirvo_collapsed_${comment.signature}`, 'true');
    } else {
      localStorage.removeItem(`twirvo_collapsed_${comment.signature}`);
    }
  };

  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    // Fix 4: Ensure local absolute paths (simulated) are preserved
    if (clean.startsWith('/')) return clean; 
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  // Drop blocked users
  if (blockedUsers.includes(comment.owner)) {
    return null;
  }

  // Fix 13: Hard-hide logic - if the post is hidden, return null so it is removed from the DOM
  if (hiddenPosts.includes(comment.signature)) {
    return null;
  }

  const user = userMap[comment.owner] || {};
  const stats = statsMap[comment.signature] || { likes: [], dislikes: [], comments: [] };

  return (
    <div className={`mt-6 ml-10 p-6 border-l-4 ${theme === 'dark' ? 'border-gray-800 hover:bg-white/[0.02]' : 'border-gray-200 hover:bg-black/[0.02]'} transition-colors relative rounded-r-3xl`}>
      
      <button 
        onClick={toggleCollapse}
        className="absolute -left-[14px] top-6 bg-blue-600 border border-blue-400 text-white rounded-full w-7 h-7 flex items-center justify-center z-10 hover:scale-110 hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
        >
          <path d="M12 21l-12-18h24z" />
        </svg>
      </button>

      <div className="flex items-start space-x-6 min-w-0">
        <img 
          src={formatLink(user.pfp) || DEFAULT_PFP} 
          className="w-12 h-12 rounded-full object-cover cursor-pointer border border-gray-700 flex-shrink-0" 
          onClick={() => { setActiveUser(comment.owner); setView('profile'); window.history.pushState({}, '', `/${user.username || comment.owner}`); }} 
          alt="PFP" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4 flex-wrap mb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-black text-blue-500 text-sm cursor-pointer hover:underline truncate" onClick={() => { setActiveUser(comment.owner); setView('profile'); window.history.pushState({}, '', `/${user.username || comment.owner}`); }}>
                {censorText(user.username || comment.owner.slice(0, 8), profanityFilterEnabled)}
              </span>
              <span className="text-[8px] text-gray-500 font-mono flex-shrink-0">{new Date(comment.timestamp).toLocaleString()}</span>
              
              {comment.parent_community && communityMap[comment.parent_community] && (
                <button 
                  onClick={() => { setActiveCommunity(comment.parent_community); setFilter('recent'); setView('feed'); window.history.pushState({}, '', `/community/${comment.parent_community}`); }} 
                  className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-md hover:bg-blue-500/20 transition-colors cursor-pointer truncate max-w-[150px]"
                >
                  🏛️ {censorText(communityMap[comment.parent_community].name, profanityFilterEnabled)}
                </button>
              )}

              {isCollapsed && <span className="text-[10px] text-blue-400/60 italic font-black uppercase tracking-widest ml-2 flex-shrink-0">[Thread Collapsed]</span>}
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Fix 13: Rename button label */}
              <button onClick={() => hidePost(comment.signature)} className="text-[8px] font-black uppercase text-gray-500 hover:text-orange-500 hover:underline tracking-widest transition-colors">
                Hide From Feed
              </button>
              
              {publicKey?.toString() === comment.owner && !comment.isSimulated && (
                <button 
                  onClick={() => {
                    if (confirmDelete) {
                      pushAction("remove_comment", comment.signature);
                      setConfirmDelete(false);
                    } else {
                      setConfirmDelete(true);
                      triggerToast("Tap again to confirm comment deletion", "info");
                      setTimeout(() => setConfirmDelete(false), 4000);
                    }
                  }} 
                  className={`text-[8px] font-black uppercase transition-all ${
                    confirmDelete 
                      ? 'text-white bg-red-600 px-2 py-1 rounded animate-pulse' 
                      : 'text-red-500 hover:underline'
                  }`}
                >
                  {confirmDelete ? 'Confirm?' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          {!isCollapsed && (
            <>
              <p className="text-xl font-medium my-3 leading-snug cursor-pointer break-words whitespace-normal" onClick={() => { setActiveSig(comment.signature); setView('direct'); window.history.pushState({}, '', `/${comment.signature}`); }}>
                {censorText(comment.text, profanityFilterEnabled)}
              </p>
              
              {comment.image && (
                <img 
                  src={formatLink(comment.image)} 
                  className="mt-4 max-h-[300px] w-full rounded-2xl object-cover border-2 border-gray-800 shadow-xl" 
                  alt="Media" 
                  onError={(e) => (e.currentTarget.src = DEFAULT_PFP)}
                />
              )}
              {comment.link && (
                <p className="mt-4 text-xs font-black text-blue-500 uppercase tracking-widest truncate">
                  URL: <a href={formatLink(comment.link)} target="_blank" className="underline lowercase hover:text-blue-400" rel="noreferrer">{comment.link}</a>
                </p>
              )}

              <div className="flex space-x-8 mt-4 text-gray-500 items-center">
                <button onClick={() => pushAction('post_like', '', comment.signature)} className="hover:text-pink-500 text-xl font-black transition-colors">❤️ {stats.likes.length}</button>
                <button onClick={() => pushAction('post_dislike', '', comment.signature)} className="hover:text-orange-500 text-xl font-black transition-colors">👎 {stats.dislikes.length}</button>
                <button onClick={() => setReplyTo(comment.signature)} className="hover:text-blue-500 text-xl font-black transition-colors">💬 {stats.comments.length}</button>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${comment.signature}`); triggerToast("Link Copied", "success"); }} className="hover:text-green-500 text-xl transition-transform active:scale-90">🔗</button>
                <button onClick={() => { setExamineSig(comment.signature); setAuditTab('ancestry'); }} className="hover:text-white text-xl transition-transform active:scale-90">🔍</button>
              </div>

              {replyTo === comment.signature && <Composer parentSig={comment.signature} />}
              
              {stats.comments.map((c: any) => (
                <CommentNode key={c.signature} comment={c} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}