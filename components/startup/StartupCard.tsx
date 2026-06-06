'use client';

import { cn, formatDate } from "@/lib/utils";
import { EyeIcon, Edit, Trash2, ThumbsUp, ThumbsDown, Bookmark, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Author, Startup } from "@/sanity/types";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteStartupButton from "./DeleteStartupButton";
import InterestedModal from "@/components/interested/InterestedModal";
import React from "react";
// import CountUp from 'react-countup';

export type StartupTypeCard = Omit<Startup, "author"> & { author?: Author };

interface StartupCardProps {
  post: StartupTypeCard;
  isOwner?: boolean;
  isLoggedIn?: boolean;
  userId?: string;
  showDescription?: boolean;
  showCategory?: boolean;
  showDetailsButton?: boolean;
  showComment?: boolean;
  commentType?: 'comment' | 'reply' | 'report';
  showLikesDislikes?: boolean;
  analyticsContent?: React.ReactNode;
  hideActions?: boolean;
  hideImage?: boolean;
  hideViews?: boolean;
  analyticsRedirect?: boolean;
  onAnalyticsClick?: (startupId: string, title: string) => void;
  // Notification props
  currentUserName?: string;
}

const StartupCard = ({ post, isOwner = false, isLoggedIn = false, userId, showDescription = true, showCategory = true, showDetailsButton = true, showComment = false, commentType = 'comment', showLikesDislikes = true, analyticsContent, hideActions = false, hideImage = false, hideViews = false, analyticsRedirect = false, onAnalyticsClick, currentUserName = 'Someone' }: StartupCardProps) => {
  const {
    _createdAt,
    views,
    author,
    title,
    category,
    _id,
    image,
    description,
  } = post;

  // Author data loaded

  const [likes, setLikes] = React.useState(0);
  const [dislikes, setDislikes] = React.useState(0);
  const [liked, setLiked] = React.useState(false);
  const [disliked, setDisliked] = React.useState(false);
  const [likedBy, setLikedBy] = React.useState<string[]>([]);
  const [dislikedBy, setDislikedBy] = React.useState<string[]>([]);
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [dislikeLoading, setDislikeLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [totalViews, setTotalViews] = React.useState<number>(views ?? 0);
  const [saved, setSaved] = React.useState(false);
  const [savedBy, setSavedBy] = React.useState<string[]>([]);
  const [interested, setInterested] = React.useState(false);
  const [interestedBy, setInterestedBy] = React.useState<string[]>([]);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [interestedLoading, setInterestedLoading] = React.useState(false);
  const [isInterestedModalOpen, setIsInterestedModalOpen] = React.useState(false);
  const hasIncremented = React.useRef(false);
  
  // Client-side popup notifications removed; rely on server to notify recipients

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [likesRes, dislikesRes, savedRes, interestedRes] = await Promise.all([
          fetch(`/api/likes?id=${_id}`),
          fetch(`/api/dislikes?id=${_id}`),
          fetch(`/api/saved?id=${_id}`),
          fetch(`/api/interested?id=${_id}`)
        ]);

        const [likeData, dislikeData, savedData, interestedData] = await Promise.all([
          likesRes.ok ? likesRes.json() : { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [] },
          dislikesRes.ok ? dislikesRes.json() : { dislikes: 0, dislikedBy: [], likes: 0, likedBy: [] },
          savedRes.ok ? savedRes.json() : { savedBy: [] },
          interestedRes.ok ? interestedRes.json() : { interestedBy: [] }
        ]);

        setLikes(likeData.likes ?? 0);
        setLikedBy(likeData.likedBy ?? []);
        setLiked(userId ? (likeData.likedBy ?? []).includes(userId) : false);
        setDislikes(dislikeData.dislikes ?? 0);
        setDislikedBy(dislikeData.dislikedBy ?? []);
        setDisliked(userId ? (dislikeData.dislikedBy ?? []).includes(userId) : false);
        setSavedBy(savedData.savedBy ?? []);
        setSaved(userId ? (savedData.savedBy ?? []).includes(userId) : false);
        setInterestedBy(interestedData.interestedBy ?? []);
        setInterested(userId ? (interestedData.interestedBy ?? []).includes(userId) : false);
        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching startup data:', error);
        // Set default values on error
        setLikes(0);
        setLikedBy([]);
        setLiked(false);
        setDislikes(0);
        setDislikedBy([]);
        setDisliked(false);
        setSavedBy([]);
        setSaved(false);
        setInterestedBy([]);
        setInterested(false);
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [_id, userId]);

  // Initial fetch of views
  React.useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch(`/api/views?id=${_id}`);
        if (!res.ok) return;
        const data = await res.json();
        setTotalViews(data.views);
      } catch {}
    };
    fetchViews();
  }, [_id]);

  // Increment views only once per session
  React.useEffect(() => {
    const incrementViews = async () => {
      if (hasIncremented.current) return;
      if (typeof window !== 'undefined') {
        const key = `viewed_${_id}`;
        if (sessionStorage.getItem(key)) {
          hasIncremented.current = true;
          return;
        }
      }
      try {
        const res = await fetch(`/api/views?id=${_id}`, { method: 'POST' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setTotalViews(data.views);
          hasIncremented.current = true;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`viewed_${_id}`, 'true');
          }
        }
      } catch {}
    };
    incrementViews();
  }, [_id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    e.stopPropagation(); // Prevent event bubbling to parent Link
    if (!userId || likeLoading) return;
    
    const previousLiked = liked;
    setLikeLoading(true);
    
    try {
      const res = await fetch(`/api/likes?id=${_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setLikes(data.likes ?? likes);
      setDislikes(data.dislikes ?? dislikes);
      setLikedBy(data.likedBy ?? likedBy);
      setDislikedBy(data.dislikedBy ?? dislikedBy);
      setLiked(data.likedBy?.includes(userId) ?? false);
      setDisliked(data.dislikedBy?.includes(userId) ?? false);
      
      // Debug info
      console.log('🔍 Like debug info:', {
        previousLiked,
        isNewLike: !previousLiked && data.likedBy?.includes(userId),
        authorId: author?._id,
        userId,
        isNotOwner: author?._id && author._id !== userId,
        shouldShowNotification: !previousLiked && data.likedBy?.includes(userId) && author?._id && author._id !== userId,
        apiLikedBy: data.likedBy,
        userInLikedBy: data.likedBy?.includes(userId)
      });
      // No client popup; server handles notifying the startup owner
    } catch (error) {
      console.error('Error liking startup:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    e.stopPropagation(); // Prevent event bubbling to parent Link
    if (!userId || dislikeLoading) return;
    
    const previousDisliked = disliked;
    setDislikeLoading(true);
    
    try {
      const res = await fetch(`/api/dislikes?id=${_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setLikes(data.likes ?? likes);
      setDislikes(data.dislikes ?? dislikes);
      setLikedBy(data.likedBy ?? likedBy);
      setDislikedBy(data.dislikedBy ?? dislikedBy);
      setLiked(data.likedBy?.includes(userId) ?? false);
      setDisliked(data.dislikedBy?.includes(userId) ?? false);
      
      // No client popup for dislike; server handles notifying the recipient
    } catch (error) {
      console.error('Error disliking startup:', error);
    } finally {
      setDislikeLoading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || saveLoading) return;
    setSaveLoading(true);
    
    try {
      const res = await fetch(`/api/saved?id=${_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      
      if (data.success) {
        setSaved(data.saved);
        setSavedBy(data.savedBy ?? savedBy);
      }
    } catch (error) {
      console.error('Error saving startup:', error);
    }
    
    setSaveLoading(false);
  };

  const handleInterested = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;
    
    // Check if user is trying to show interest in their own startup
    if (post.author && post.author._id === userId) {
      alert('You cannot show interest in your own startup');
      return;
    }
    
    // Open the modal instead of making direct API call
    setIsInterestedModalOpen(true);
  };

  const handleInterestedSuccess = async () => {
    // Update the interested state after successful form submission
    setInterested(true);
    setInterestedBy(prev => [...prev, userId!]);
    // No client popup; server sends notification to startup owner
  };

  return (
  <li className="startup-card group hover:bg-blue-50 transition-colors duration-200 relative overflow-hidden" style={{ listStyle: 'none', marginBottom: '0.5rem' }}>
      {(analyticsContent || hideImage) && image && (
        <>
          <div
            className="absolute inset-0 -z-10 bg-center bg-cover blur-lg opacity-30"
            style={{ backgroundImage: `url(${image})` }}
            aria-hidden
          />
          <div className="absolute inset-0 -z-10 bg-white/40" aria-hidden />
        </>
      )}
      <div className="relative z-10 flex-between">
        <div className="flex items-center gap-2">
          <span className="startup_card_date">{formatDate(_createdAt)}</span>
        </div>
        {!hideViews && (
        <div className="flex gap-1.5">
          <EyeIcon className="size-6 text-primary" />
          <span className="text-16-medium">{typeof totalViews === 'number' ? totalViews : '...'}</span>
        </div>
        )}
      </div>

      <div className="relative z-10 flex-between mt-5 gap-5">
        <div className="flex-1">
          <Link href={author?._id ? `/user/${author._id}` : "#"}>
            <p className="text-16-medium line-clamp-1">{author?.name != null ? author.name : "Unknown"}</p>
          </Link>
          {analyticsRedirect && onAnalyticsClick ? (
            <button 
              onClick={() => onAnalyticsClick(_id, title || "")}
              className="text-26-semibold line-clamp-1 text-left hover:text-primary transition-colors"
            >
              {title}
            </button>
          ) : (
            <Link href={`/startup/${_id}`}>
              <h3 className="text-26-semibold line-clamp-1">{title}</h3>
            </Link>
          )}
        </div>
        <Link href={author?._id ? `/user/${author._id}` : "#"}>
          {author?.image && author.image.trim() !== "" ? (
            <Image
              src={author.image}
              alt={author?.name || "Unknown"}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
              {author?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </Link>
      </div>

      {analyticsRedirect && onAnalyticsClick ? (
        <button 
          onClick={() => onAnalyticsClick(_id, title || "")}
          className="block w-full text-left hover:opacity-90 transition-opacity"
        >
          {showDescription && (
            <p className="startup-card_desc relative z-10">{description}</p>
          )}

          {!hideImage && (
            <img src={image} alt="placeholder" className="startup-card_img relative z-10" />
          )}
        </button>
      ) : (
        <Link href={`/startup/${_id}`}>
          {showDescription && (
            <p className="startup-card_desc relative z-10">{description}</p>
          )}

          {!hideImage && (
            <img src={image} alt="placeholder" className="startup-card_img relative z-10" />
          )}
        </Link>
      )}
        
        {/* Likes/Dislikes/Interested/Save controls (only when no analyticsContent) */}
        {!analyticsContent && (!hideActions && showLikesDislikes) && (
            <div className="flex items-center justify-between mt-4 mb-2 relative z-10">
              {initialLoading ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full">
                    <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full">
                    <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  {/* Left side - Like and Dislike buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      aria-label="Like"
                      onClick={(e) => handleLike(e)}
                      disabled={!isLoggedIn || likeLoading}
                      title={!isLoggedIn ? 'Log in to like' : ''}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md
                      ${liked 
                        ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                      } 
                      ${!isLoggedIn || likeLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                      type="button"
                    >
                      {likeLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <ThumbsUp className={`size-5 transition-transform duration-200 ${liked ? 'text-white' : 'text-gray-500 group-hover:text-green-600'}`} />
                      )}
                      <span className="text-sm font-medium">{likes}</span>
                    </button>
                    
                    <button
                      aria-label="Dislike"
                      onClick={(e) => handleDislike(e)}
                      disabled={!isLoggedIn || dislikeLoading}
                      title={!isLoggedIn ? 'Log in to dislike' : ''}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md
                      ${disliked 
                        ? 'bg-red-500 text-white shadow-red-200 hover:bg-red-600' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                      } 
                      ${!isLoggedIn || dislikeLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                      type="button"
                    >
                      {dislikeLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <ThumbsDown className={`size-5 transition-transform duration-200 ${disliked ? 'text-white' : 'text-gray-500 group-hover:text-red-600'}`} />
                      )}
                      <span className="text-sm font-medium">{dislikes}</span>
                    </button>
                  </div>

                  {/* Right side - Interested and Save buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      aria-label="Interested"
                      onClick={(e) => handleInterested(e)}
                      disabled={!isLoggedIn || interestedLoading || (post.author && post.author._id === userId)}
                      title={
                        !isLoggedIn 
                          ? 'Log in to show interest' 
                          : (post.author && post.author._id === userId)
                          ? 'You cannot show interest in your own startup'
                          : ''
                      }
                      className={`group flex items-center justify-center p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md
                        ${interested 
                          ? 'bg-purple-500 text-white shadow-purple-200 hover:bg-purple-600' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
                        } 
                        ${!isLoggedIn || interestedLoading || (post.author && post.author._id === userId) ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                      type="button"
                    >
                      {interestedLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <Heart className={`size-5 transition-transform duration-200 ${interested ? 'text-white' : 'text-gray-500 group-hover:text-purple-600'}`} />
                      )}
                    </button>
                    
                    <button
                      aria-label="Save"
                      onClick={(e) => handleSave(e)}
                      disabled={!isLoggedIn || saveLoading}
                      title={!isLoggedIn ? 'Log in to save' : ''}
                      className={`group flex items-center justify-center p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md
                        ${saved 
                          ? 'bg-blue-500 text-white shadow-blue-200 hover:bg-blue-600' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                        } 
                        ${!isLoggedIn || saveLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                      type="button"
                    >
                      {saveLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <Bookmark className={`size-5 transition-transform duration-200 ${saved ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

      {/* Analytics slot moved outside Link to prevent navigation on interaction */}
      {analyticsContent && (
        <div 
          className="mt-3 relative z-10"
          onClick={(e) => { e.stopPropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          onKeyDown={(e) => { e.stopPropagation(); }}
        >
          {analyticsContent}
        </div>
      )}

      {/* Comment display with icon */}
      {showComment && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {commentType === 'reply' ? (
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : commentType === 'report' ? (
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0 3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs font-medium text-gray-700">
                {commentType === 'reply' ? 'Reply' : commentType === 'report' ? 'Report' : 'Comment'}
              </span>
            </div>
            <p className="text-sm text-gray-800 line-clamp-3">{description}</p>
            </div>
          )}
      <div className="flex-between gap-3 mt-3">
        {showCategory && (
        <Link href={`/?query=${category?.toLowerCase()}`}>
          <p className="text-16-medium truncate max-w-xs whitespace-nowrap">{category}</p>
        </Link>
        )}
        <div className="action-buttons">
          {showDetailsButton && (
            analyticsRedirect && onAnalyticsClick ? (
              <Button 
                className="startup-card_btn" 
                onClick={() => onAnalyticsClick(_id, title || "")}
              >
                View Analytics
              </Button>
            ) : (
              <Button className="startup-card_btn" asChild>
                <Link href={`/startup/${_id}`}>Details</Link>
              </Button>
            )
          )}
          
          {isOwner && (
            <div className="flex gap-2">
              <Button className="edit-btn p-2 h-9 w-9" asChild>
                <Link href={`/startup/${_id}/edit`} aria-label="Edit">
                  <Edit className="h-5 w-5" />
                </Link>
              </Button>
              <DeleteStartupButton 
                startupId={_id} 
                startupTitle={title || ""} 
                userId={author?._id || ""}
                iconOnly
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Interested Modal */}
      <InterestedModal
        isOpen={isInterestedModalOpen}
        onClose={() => setIsInterestedModalOpen(false)}
        startupId={_id}
        startupTitle={title || ""}
        userId={userId}
        onSuccess={handleInterestedSuccess}
      />

    </li>
  );
};

export const StartupCardSkeleton = () => (
  <>
    {[0, 1, 2, 3, 4].map((index: number) => (
      <li key={cn("skeleton", index)}>
        <Skeleton className="startup-card_skeleton" />
      </li>
    ))}
  </>
);

export default StartupCard;