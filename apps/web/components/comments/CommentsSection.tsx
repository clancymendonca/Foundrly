"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ThumbsUp, ThumbsDown, Smile, Paperclip, AtSign, Send, Trash2, LogIn, Flag, Ban } from "lucide-react";
import { ReportModal } from "@/components/reports/ReportModal";
import { useBanStatus } from "@/hooks/moderation/use-ban-status";
import { ChatBanMessage } from "@/components/chat/BanMessage";
import dynamic from "next/dynamic";
import markdownit from "markdown-it";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const EmojiPickerClient = dynamic(() => import("@/components/shared/EmojiPickerClient"), { ssr: false });

// Dynamically set MAX_DEPTH based on viewport
function useMaxDepth() {
  const [maxDepth, setMaxDepth] = useState(3);
  useEffect(() => {
    function updateDepth() {
      if (window.innerWidth < 640) setMaxDepth(3); // mobile
      else if (window.innerWidth < 1024) setMaxDepth(4); // tablet
      else setMaxDepth(8); // desktop
    }
    updateDepth();
    window.addEventListener('resize', updateDepth);
    return () => window.removeEventListener('resize', updateDepth);
  }, []);
  return maxDepth;
}

// Render a single comment (with replies) - moved outside to prevent re-renders
function CommentCard({ 
  c, 
  depth = 0, 
  userId, 
  isLoggedIn, 
  isBanned = false,
  onLike, 
  onDislike, 
  onReply, 
  onDelete, 
  replyingTo, 
  setReplyingTo, 
  replyText, 
  setReplyText, 
  handleReply, 
  actionLoading, 
  likeLoading, 
  dislikeLoading,
  setViewingDeepReplies,
  MAX_DEPTH
}: { 
  c: any, 
  depth?: number,
  userId?: string,
  isLoggedIn: boolean,
  isBanned?: boolean,
  onLike: (id: string) => void,
  onDislike: (id: string) => void,
  onReply: (id: string) => void,
  onDelete: (id: string) => void,
  replyingTo: string | null,
  setReplyingTo: (id: string | null) => void,
  replyText: string,
  setReplyText: (text: string) => void,
  handleReply: (parentId: string, replyText: string) => void,
  actionLoading: string | null,
  likeLoading: string | null,
  dislikeLoading: string | null,
  setViewingDeepReplies: (v: {comment: any, depth: number} | null) => void,
  MAX_DEPTH: number
}) {
  const liked = userId && c.likedBy?.includes(userId);
  const disliked = userId && c.dislikedBy?.includes(userId);
  const score = (c.likes || 0) - (c.dislikes || 0);
  let scoreColor = "text-gray-700";
  if (score > 0) scoreColor = "text-green-600";
  else if (score < 0) scoreColor = "text-red-600";
  
  // Check if comment is deleted
  const isDeleted = c.deleted;
  
  // Create unique ref for this reply textarea
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [showReplyToast, setShowReplyToast] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Handle click outside for toast
  const toastRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showReplyToast) return;
    function handleClick(e: MouseEvent) {
      if (toastRef.current && !toastRef.current.contains(e.target as Node)) {
        setShowReplyToast(false);
        setReplyingTo(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showReplyToast, setReplyingTo]);

  // Main comment card
  const card = (
    <div className="flex items-start mb-1 mt-1 md:mb-2 md:mt-2">
      <div className="ml-1 flex-1">
        <div
          className={clsx(
            "mx-1 md:mx-2 pl-2 md:pl-4 border-l-2 border-blue-100 rounded-lg shadow-sm py-2 md:py-4 text-xs md:text-base px-1 md:px-4",
            (() => {
              if (depth === 0) return "ml-0";
              // Decrease indent per layer, but never less than 8px per layer
              const perLayer = Math.max(24 - depth * 2, 6);
              const ml = perLayer * depth;
              return `ml-[${ml}px]`;
            })(),
            depth % 2 === 0 ? "bg-white" : "bg-gray-50"
          )}
        >
          <div className="flex items-start space-x-2 md:space-x-3">
            {/* Avatar inside card */}
            <Link href={`/user/${c.author?._id}`}>
              <Avatar className="w-6 h-6 md:w-8 md:h-8">
                {c.author?.image ? (
                  <AvatarImage src={c.author.image} alt={c.author.name || c.author.username || "?"} />
                ) : (
                  <AvatarFallback>{c.author?.name?.[0] || c.author?.username?.[0] || "?"}</AvatarFallback>
                )}
              </Avatar>
            </Link>
            <div className="flex-1">
              <p className="font-semibold text-xs md:text-sm">{c.author?.name || "User"} <span className="text-[10px] md:text-xs text-gray-500 ml-1">{formatShortRelativeTime(c.createdAt)}</span></p>
              {isDeleted ? (
                <p className="mt-0.5 text-gray-500 italic text-[10px] md:text-xs">[deleted]</p>
              ) : (
                <p className="mt-0.5 text-gray-800 text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: markdownit().render(c.text) }} />
              )}
              {!isDeleted && (
                <div className="flex items-center space-x-1 md:space-x-3 mt-1 md:mt-2">
                  <button
                    className={`flex items-center p-0.5 md:p-1 rounded-full transition-colors duration-200 text-[10px] md:text-xs ${liked ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'} ${!isLoggedIn || likeLoading === c._id || isBanned ? 'opacity-75 cursor-not-allowed' : ''}`}
                    disabled={!isLoggedIn || likeLoading === c._id || isBanned}
                    onClick={() => onLike(c._id)}
                    title={!isLoggedIn ? 'Log in to like' : isBanned ? 'Account suspended' : ''}
                    type="button"
                  >
                    {likeLoading === c._id ? (
                      <svg className="animate-spin h-2 w-2 md:h-3 md:w-3 text-green-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <ThumbsUp className="size-3 md:size-4 text-green-600" />
                    )}
                    <span className="ml-0.5 text-[10px]">{c.likes || 0}</span>
                  </button>
                  <button
                    className={`flex items-center p-0.5 md:p-1 rounded-full transition-colors duration-200 text-[10px] md:text-xs ${disliked ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'} ${!isLoggedIn || dislikeLoading === c._id || isBanned ? 'opacity-75 cursor-not-allowed' : ''}`}
                    disabled={!isLoggedIn || dislikeLoading === c._id || isBanned}
                    onClick={() => onDislike(c._id)}
                    title={!isLoggedIn ? 'Log in to dislike' : isBanned ? 'Account suspended' : ''}
                    type="button"
                  >
                    {dislikeLoading === c._id ? (
                      <svg className="animate-spin h-2 w-2 md:h-3 md:w-3 text-red-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <ThumbsDown className="size-3 md:size-4 text-red-600" />
                    )}
                    <span className="ml-0.5 text-[10px]">{c.dislikes || 0}</span>
                  </button>
                  {/* Only show reply button if not deleted */}
                  {!isDeleted && (
                    <button
                      className={`flex items-center space-x-0.5 md:space-x-1 text-gray-500 text-[10px] md:text-xs ${!isLoggedIn || isBanned ? 'opacity-75 cursor-not-allowed' : 'hover:text-gray-700'}`}
                      disabled={!isLoggedIn || isBanned}
                      onClick={() => { if (isLoggedIn && !isBanned) { setReplyingTo(c._id); setReplyText(""); setShowReplyToast(true); } }}
                      title={!isLoggedIn ? 'Log in to reply' : isBanned ? 'Account suspended' : 'Reply'}
                    >
                      <MessageSquare size={12} className="md:size-4" />
                      <span>Reply</span>
                    </button>
                  )}
                  {/* Report button */}
                  <button
                    className={`flex items-center space-x-0.5 md:space-x-1 text-gray-500 text-[10px] md:text-xs hover:text-orange-600 hover:bg-orange-50`}
                    onClick={() => setShowReportModal(true)}
                    title="Report comment"
                  >
                    <Flag size={12} className="md:size-4" />
                    <span>Report</span>
                  </button>
                  {userId === c.author?._id && (
                    <button
                      className={`flex items-center p-0.5 md:p-1 rounded-full transition-colors duration-200 text-gray-500 hover:bg-red-50 hover:text-red-600 text-[10px] md:text-xs ${actionLoading === c._id + "-delete" ? 'opacity-75 cursor-not-allowed' : ''}`}
                      disabled={actionLoading === c._id + "-delete"}
                      onClick={() => onDelete(c._id)}
                      title="Delete comment"
                      type="button"
                    >
                      {actionLoading === c._id + "-delete" ? (
                        <svg className="animate-spin h-2 w-2 md:h-3 md:w-3 text-red-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <Trash2 className="size-3 md:size-4 text-red-600" />
                      )}
                    </button>
                  )}
                </div>
              )}
              {/* Always render all replies, regardless of depth */}
              {c.replies && c.replies.length > 0 && (
                <>
                  {depth + 1 < MAX_DEPTH ? (
                    c.replies.map((r: any) => (
                      <CommentCard 
                        key={r._id} 
                        c={r} 
                        depth={depth + 1}
                        userId={userId}
                        isLoggedIn={isLoggedIn}
                        isBanned={isBanned}
                        onLike={onLike}
                        onDislike={onDislike}
                        onReply={onReply}
                        onDelete={onDelete}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        handleReply={handleReply}
                        actionLoading={actionLoading}
                        likeLoading={likeLoading}
                        dislikeLoading={dislikeLoading}
                        setViewingDeepReplies={setViewingDeepReplies}
                        MAX_DEPTH={MAX_DEPTH}
                      />
                    ))
                  ) : (
                    <button
                      className="ml-4 md:ml-8 mt-1 md:mt-2 text-blue-600 text-[10px] md:text-sm px-1 py-0.5"
                      onClick={() => setViewingDeepReplies({ comment: c, depth: depth + 1 })}
                    >
                      {c.replies.length} more repl{c.replies.length === 1 ? 'y' : 'ies'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Toast reply textarea (portal)
  const toast = (replyingTo === c._id && isLoggedIn && showReplyToast && typeof window !== 'undefined') ?
    createPortal(
      <>
        <div className="fixed inset-0 bg-black/20 z-40" />
        <div ref={toastRef} className="fixed top-1/2 left-1/2 z-50 w-full max-w-xs md:max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-4 border border-blue-200 flex flex-col">
          <div className="font-semibold mb-2">Replying to <span className="text-blue-600">{c.author?.name || c.author?.username || 'User'}</span></div>
          <textarea
            ref={replyTextareaRef}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Add reply..."
            maxLength={1000}
            className="w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex justify-end mt-2 space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setReplyingTo(null); setShowReplyToast(false); }}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
              onClick={() => { handleReply(c._id, replyText); setShowReplyToast(false); }}
              disabled={actionLoading === c._id + "-reply" || !replyText.trim()}
            >
              {actionLoading === c._id + "-reply" ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Posting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <MessageSquare size={16} />
                  <span>Reply</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </>,
      document.body
    ) : null;

  return (
    <>
      {card}
      {toast}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedType="comment"
        reportedRef={c._id}
        reportedTitle={c.text?.substring(0, 50) + (c.text?.length > 50 ? '...' : '')}
      />
    </>
  );
}

// Utility: Short relative time (e.g., 2d, 20h, 5m)
function formatShortRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.max(0, now.getTime() - date.getTime());
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 30) return `${weeks}w`;
  if (days < 365) return `${months}mo`;
  return `${years}y`;
}

// Utility: Find a comment by ID in nested comments structure
function findCommentById(comments: any[], id: string): any | null {
  for (const comment of comments) {
    if (comment._id === id) {
      return comment;
    }
    if (comment.replies && comment.replies.length > 0) {
      const found = findCommentById(comment.replies, id);
      if (found) return found;
    }
  }
  return null;
}

// Props: startupId, userId, isLoggedIn, userData
export default function CommentsSection({ 
  startupId, 
  userId, 
  isLoggedIn, 
  userData 
}: { 
  startupId: string, 
  userId?: string, 
  isLoggedIn: boolean,
  userData?: { _id: string, bannedUntil: string | null, isBanned: boolean } | null
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Track cursor position for comment and reply editors
  const [commentCursor, setCommentCursor] = useState(0);
  const [replyCursor, setReplyCursor] = useState(0);

  // Track open formatting for toggle mode
  const [openFormat, setOpenFormat] = useState<{ type: string, isReply: boolean, pos: number } | null>(null);

  // Emoji dropdown state
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);
  const [showReplyEmojiDropdown, setShowReplyEmojiDropdown] = useState(false);
  const emojiList = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😜", "😝", "😛", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"
  ];

  const md = markdownit();

  const [sort, setSort] = useState<'best' | 'newest' | 'oldest'>('best');

  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [dislikeLoading, setDislikeLoading] = useState<string | null>(null);

  const { toast } = useToast();

  const [viewingDeepReplies, setViewingDeepReplies] = useState<{comment: any, depth: number} | null>(null);

  // Dynamically set MAX_DEPTH based on viewport
  const MAX_DEPTH = useMaxDepth();

  // Check ban status
  const banStatus = useBanStatus({
    bannedUntil: userData?.bannedUntil || null,
    isBanned: userData?.isBanned || false,
  });

  // Fetch comments (PUBLIC - no auth required)
  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/comments?startupId=${startupId}`, { cache: 'no-store' });
    const data = await res.json();
    setComments(data.comments || []);
    setLoading(false);
  }, [startupId]);
  
  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Post new comment (REQUIRES AUTH)
  const handleSubmit = useCallback(async () => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post a comment.",
        variant: "destructive",
      });
      return;
    }
    
    if (!comment.trim()) return;
    setActionLoading("submit");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'create', text: comment, startupId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to post comment");
      }
      
      setComment("");
      toast({
        title: "Comment posted",
        description: "Your comment was posted successfully.",
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }, [comment, startupId, fetchComments, isLoggedIn, toast]);

  // Like a comment (REQUIRES AUTH)
  const handleLike = useCallback(async (commentId: string) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like comments.",
        variant: "destructive",
      });
      return;
    }
    
    setLikeLoading(commentId);
    setActionLoading(commentId + 'like');
    try {
      const res = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to like comment");
      }
      
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to like comment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setLikeLoading(null);
    }
  }, [isLoggedIn, userId, fetchComments, toast]);

  // Dislike a comment (REQUIRES AUTH)
  const handleDislike = useCallback(async (commentId: string) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to dislike comments.",
        variant: "destructive",
      });
      return;
    }
    
    setDislikeLoading(commentId);
    setActionLoading(commentId + 'dislike');
    try {
      const res = await fetch('/api/comments/dislike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to dislike comment");
      }
      
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike comment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setDislikeLoading(null);
    }
  }, [isLoggedIn, userId, fetchComments, toast]);

  // Post reply (REQUIRES AUTH)
  const handleReply = useCallback(async (parentId: string, replyText: string) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply to comments.",
        variant: "destructive",
      });
      return;
    }
    
    if (!replyText.trim()) return;
    setActionLoading(parentId + "-reply");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", text: replyText, parentId, startupId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to post reply");
      }
      
      setReplyingTo(null);
      setReplyText("");
      toast({
        title: "Reply posted",
        description: "Your reply was posted successfully.",
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }, [startupId, fetchComments, isLoggedIn, toast]);

  // Delete a comment (REQUIRES AUTH)
  const handleDelete = useCallback(async (commentId: string) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete comments.",
        variant: "destructive",
      });
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) return;
    setActionLoading(commentId + "-delete");
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete comment");
      }
      toast({
        title: "Comment deleted",
        description: "Your comment was deleted successfully.",
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }, [fetchComments, isLoggedIn, toast]);

  // Refs for comment and reply editors
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sort comments (top-level only)
  const getSortedComments = useCallback(() => {
    const sorted = [...comments];
    if (sort === 'best') {
      sorted.sort((a, b) => ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)));
    } else if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return sorted;
  }, [comments, sort]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Ban Message */}
      {banStatus.isBanned && (
        <ChatBanMessage 
          description={banStatus.description} 
          isPermanent={banStatus.isPermanent} 
        />
      )}
      
      {/* Comment Input Section */}
      <div className="bg-white shadow rounded-xl p-4">
        {isLoggedIn ? (
          <>
            {banStatus.isBanned ? (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <Ban className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">Account suspended - cannot post comments</span>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  ref={commentTextareaRef}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onSelect={e => setCommentCursor(e.currentTarget.selectionStart)}
                  onClick={e => setCommentCursor(e.currentTarget.selectionStart)}
                  placeholder="Add comment..."
                  maxLength={1000}
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                />
                <div className="flex items-center justify-end mt-2">
                  <Button 
                    className="bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200" 
                    onClick={handleSubmit} 
                    disabled={!comment.trim() || actionLoading === "submit"}
                    size="sm"
                  >
                    {actionLoading === "submit" ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send size={16} />
                        <span>Post Comment</span>
                      </div>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <LogIn className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">Log in to comment</span>
            </div>
            <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={() => signIn()}>
              Log In
            </Button>
          </div>
        )}
      </div>

      {/* Comments Display Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Comments</h2>
          <div className="flex items-center space-x-2">
            <label htmlFor="comment-sort" className="text-sm text-gray-500">Sort by:</label>
            <select
              id="comment-sort"
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="best">Best</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
        {loading && comments.length > 0 && (
          <div className="text-center text-gray-400 mb-2">Refreshing comments...</div>
        )}
        {comments.length === 0 && !loading ? (
          <div className="text-center text-gray-400">No comments yet.</div>
        ) : (
          getSortedComments().map((c) => (
            <CommentCard 
              key={c._id} 
              c={c}
              userId={userId}
              isLoggedIn={isLoggedIn}
              isBanned={banStatus.isBanned}
              onLike={handleLike}
              onDislike={handleDislike}
              onReply={() => {}}
              onDelete={handleDelete}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              actionLoading={actionLoading}
              likeLoading={likeLoading}
              dislikeLoading={dislikeLoading}
              setViewingDeepReplies={setViewingDeepReplies}
              MAX_DEPTH={MAX_DEPTH}
            />
          ))
        )}
      </div>
      {/* Modal for deep replies */}
      {viewingDeepReplies && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-xs md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative">
            {/* Sticky header for title and close button */}
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between border-b border-gray-200 px-4 md:px-6 pt-4 md:pt-6 pb-2 md:pb-4" style={{minHeight: '3rem'}}>
              <h3 className="font-semibold text-lg md:text-xl">Replies</h3>
              <button
                className="text-gray-500 hover:text-gray-700 p-2"
                onClick={() => setViewingDeepReplies(null)}
              >
                Close
              </button>
            </div>
            {/* Modal content below header */}
            <div className="px-4 md:px-6 pt-2 pb-4 md:pb-6">
            {(() => {
              const currentComment = findCommentById(comments, viewingDeepReplies.comment._id);
              if (!currentComment || !currentComment.replies) return null;
              
              return currentComment.replies.map((r: any) => (
                <CommentCard
                  key={r._id}
                  c={r}
                  depth={0}
                  userId={userId}
                  isLoggedIn={isLoggedIn}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onReply={() => {}}
                  onDelete={handleDelete}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  handleReply={handleReply}
                  actionLoading={actionLoading}
                  likeLoading={likeLoading}
                  dislikeLoading={dislikeLoading}
                  setViewingDeepReplies={setViewingDeepReplies}
                  MAX_DEPTH={MAX_DEPTH}
                />
              ));
            })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 