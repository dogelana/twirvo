'use client';
import React from 'react';
import { useTwirvo, DEFAULT_PFP } from '@/contexts/TwirvoContext';

export default function Composer({ parentSig }: { parentSig?: string }) {
  const { 
    theme, memoText, setMemoText, postImage, setPostImage, postLink, setPostLink, 
    showImageInput, setShowImageInput, showLinkInput, setShowLinkInput, 
    isPosting, pushAction, setReplyTo, triggerToast
  } = useTwirvo();

  // Helper to auto-resolve https://
  const formatLink = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.startsWith('/')) return clean; // FIXED: Bug #12 (Sim paths)
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    return clean;
  };

  const handlePost = () => {
    // Validation for Post Text
    if (memoText.length < 5 || memoText.length > 500) {
      triggerToast('Post must be between 5 and 500 characters', 'error');
      return;
    }
    
    const finalImage = formatLink(postImage);
    const finalLink = formatLink(postLink);

    // Validation for Formatted Image URL
    if (showImageInput && postImage.length > 0 && (finalImage.length < 5 || finalImage.length > 500)) {
      triggerToast('Image URL must be between 5 and 500 characters', 'error');
      return;
    }
    
    // Validation for Formatted Link URL
    if (showLinkInput && postLink.length > 0 && (finalLink.length < 5 || finalLink.length > 500)) {
      triggerToast('Link URL must be between 5 and 500 characters', 'error');
      return;
    }

    // Pass formatted links to the action
    pushAction(parentSig ? 'post_comment' : 'post', memoText, parentSig, {
      image: showImageInput ? finalImage : '',
      link: showLinkInput ? finalLink : ''
    });
  };

  return (
    <div className={`p-8 ${parentSig ? 'border-2 rounded-[40px] mt-8 shadow-2xl' : 'border-b'} ${theme === 'dark' ? (parentSig ? 'bg-gray-900 border-gray-800' : 'border-gray-800 bg-blue-500/5') : (parentSig ? 'bg-gray-50 border-gray-200' : 'border-gray-200 bg-blue-50/50')}`}>
      
      <div className="relative">
        <textarea 
          className={`w-full bg-transparent ${parentSig ? 'text-2xl' : 'text-4xl'} outline-none placeholder-gray-500 resize-none font-medium leading-tight pb-8`} 
          /* FEATURE #5: Changed "Etch" placeholders to "Post" */
          placeholder={parentSig ? "Post a reply..." : "Post on-chain..."} 
          rows={2} 
          value={memoText} 
          onChange={(e) => setMemoText(e.target.value)} 
        />
        <div className={`absolute bottom-0 right-0 text-[10px] font-black uppercase tracking-widest ${memoText.length > 0 && (memoText.length < 5 || memoText.length > 500) ? 'text-red-500' : 'text-gray-500'}`}>
          {memoText.length} / 500
        </div>
      </div>

      {showImageInput && (
        <div className={`mt-6 p-6 border-2 rounded-3xl ${theme === 'dark' ? 'border-blue-500/30 bg-black' : 'border-blue-300 bg-white'}`}>
          <div className="flex justify-between items-end mb-4">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Image Source URL</label>
            <span className={`text-[10px] font-black ${postImage.length > 0 && (formatLink(postImage).length < 5 || formatLink(postImage).length > 500) ? 'text-red-500' : 'text-blue-500'}`}>{postImage.length}/500</span>
          </div>
          <input className={`w-full bg-transparent outline-none text-sm mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`} placeholder="Enter an image link..." value={postImage} onChange={(e) => setPostImage(e.target.value)} />
          {postImage && (
            <img 
              src={formatLink(postImage)} 
              className="h-32 rounded-xl object-cover shadow-lg border-2 border-gray-800" 
              alt="Preview" 
              onError={(e) => (e.currentTarget.src = DEFAULT_PFP)}
            />
          )}
        </div>
      )}

      {showLinkInput && (
        <div className={`mt-6 p-6 border-2 rounded-3xl ${theme === 'dark' ? 'border-green-500/30 bg-black' : 'border-green-300 bg-white'}`}>
          <div className="flex justify-between items-end mb-4">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">External Link</label>
            <span className={`text-[10px] font-black ${postLink.length > 0 && (formatLink(postLink).length < 5 || formatLink(postLink).length > 500) ? 'text-red-500' : 'text-green-500'}`}>{postLink.length}/500</span>
          </div>
          <input className={`w-full bg-transparent outline-none text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`} placeholder="Enter a website link..." value={postLink} onChange={(e) => setPostLink(e.target.value)} />
        </div>
      )}

      <div className="flex justify-between items-center mt-8">
        <div className="flex gap-4 items-center">
          <button onClick={() => setShowImageInput(!showImageInput)} className={`text-2xl ${showImageInput ? 'text-blue-500' : 'text-gray-500'} hover:scale-110 transition`}>🖼️</button>
          <button onClick={() => setShowLinkInput(!showLinkInput)} className={`text-2xl ${showLinkInput ? 'text-green-500' : 'text-gray-500'} hover:scale-110 transition`}>🔗</button>
          {parentSig && <button onClick={() => {setReplyTo(null); setMemoText(''); setPostImage(''); setPostLink(''); setShowImageInput(false); setShowLinkInput(false);}} className="text-[10px] font-black text-red-500 uppercase ml-4 hover:underline tracking-widest">Cancel Reply</button>}
        </div>
        <button 
          onClick={handlePost} 
          disabled={isPosting} 
          className="bg-blue-600 px-12 py-4 rounded-full font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isPosting ? '...' : (parentSig ? 'Reply' : 'Post')}
        </button>
      </div>
    </div>
  );
}