"use client";

import React, { useState } from "react";
import Image from "next/image";

interface Author {
  _id: string;
  name: string;
  username: string;
  image?: string;
}

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  author: Author;
  upvotes?: number;
  downvotes?: number;
  upvotedBy?: string[];
  downvotedBy?: string[];
  replies?: Comment[];
}

function Avatar({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return <Image src={src} alt={alt} width={36} height={36} className="rounded-full object-cover border border-gray-300" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 text-gray-500 font-bold text-lg">
      {alt?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function CommentList({ comments, loading, userId, parentId, onAction, startupId }: {
  comments: Comment[];
  loading: boolean;
  userId?: string;
  parentId?: string;
  onAction?: () => void;
  startupId: string;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleUpvote = async (commentId: string) => {
    setActionLoading(commentId + "-upvote");
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote", commentId }),
    });
    setActionLoading(null);
    onAction && onAction();
  };
  const handleDownvote = async (commentId: string) => {
    setActionLoading(commentId + "-downvote");
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "downvote", commentId }),
    });
    setActionLoading(null);
    onAction && onAction();
  };
  const handleDelete = async (commentId: string) => {
    setActionLoading(commentId + "-delete");
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    setActionLoading(null);
    onAction && onAction();
  };
  const handleEdit = async (commentId: string) => {
    setActionLoading(commentId + "-edit");
    await fetch("/api/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, text: editText }),
    });
    setEditing(null);
    setEditText("");
    setActionLoading(null);
    onAction && onAction();
  };
  const handleReply = async (parentId: string) => {
    setActionLoading(parentId + "-reply");
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reply", text: replyText, parentId, startupId }),
    });
    setReplyingTo(null);
    setReplyText("");
    setActionLoading(null);
    onAction && onAction();
  };

  if (loading) return <div className="text-center py-4">Loading comments...</div>;
  if (!comments.length) return <div className="text-center py-4 text-gray-500">No comments yet.</div>;

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li
          key={comment._id}
          className="flex items-start group"
        >
          {/* Upvote/Downvote bar */}
          <div className="flex flex-col items-center mr-3 select-none">
            <button
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-blue-100 transition-colors ${comment.upvotedBy?.includes(userId || "") ? "text-blue-500" : "text-gray-400 hover:text-blue-500"}`}
              onClick={() => handleUpvote(comment._id)}
              disabled={!userId || actionLoading === comment._id + "-upvote"}
              title="Upvote"
            >
              {actionLoading === comment._id + "-upvote" ? (
                <span className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><polygon points="10,4 18,16 2,16" /></svg>
              )}
            </button>
            {(() => {
              const score = (comment.upvotedBy?.length || 0) - (comment.downvotedBy?.length || 0);
              let scoreColor = "text-gray-700";
              if (score > 0) scoreColor = "text-blue-600";
              else if (score < 0) scoreColor = "text-red-600";
              return (
                <span className={`font-bold text-sm py-1 ${scoreColor}`}>{score}</span>
              );
            })()}
            <button
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-orange-100 transition-colors ${comment.downvotedBy?.includes(userId || "") ? "text-orange-500" : "text-gray-400 hover:text-orange-500"}`}
              onClick={() => handleDownvote(comment._id)}
              disabled={!userId || actionLoading === comment._id + "-downvote"}
              title="Downvote"
            >
              {actionLoading === comment._id + "-downvote" ? (
                <span className="animate-spin w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full"></span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><polygon points="2,4 18,4 10,16" /></svg>
              )}
            </button>
          </div>
          {/* Comment Card */}
          <div className={`flex-1 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 ${parentId ? "ml-2 bg-gray-50" : ""}`}>
            <div className="flex items-center gap-2 mb-1">
              <Avatar src={comment.author?.image} alt={comment.author?.name || comment.author?.username || "?"} />
              <span className="font-semibold text-black/90">{comment.author?.name}</span>
              <span className="text-xs font-mono text-gray-400">@{comment.author?.username}</span>
              <span className="text-xs text-gray-300 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            {editing === comment._id ? (
              <div className="mt-2 bg-gray-100 border border-primary/30 rounded-lg p-2">
                <textarea
                  className="w-full border border-black/20 rounded-lg p-2 bg-white"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2 mt-1">
                  <button className="text-blue-600 font-semibold" onClick={() => handleEdit(comment._id)} disabled={actionLoading === comment._id + "-edit"}>
                    Save
                  </button>
                  <button className="text-gray-500" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-black-700 text-base leading-relaxed whitespace-pre-line">{comment.text}</div>
            )}
            <div className="flex gap-3 mt-2 items-center text-xs flex-wrap font-semibold">
              {userId && (
                <button
                  className="text-green-700 hover:underline"
                  onClick={() => setReplyingTo(comment._id)}
                  disabled={actionLoading === comment._id + "-reply"}
                  title="Reply"
                >
                  Reply
                </button>
              )}
              {userId === comment.author?._id && (
                <>
                  <button
                    className="text-yellow-700 hover:underline"
                    onClick={() => { setEditing(comment._id); setEditText(comment.text); }}
                    disabled={actionLoading === comment._id + "-edit"}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-700 hover:underline"
                    onClick={() => handleDelete(comment._id)}
                    disabled={actionLoading === comment._id + "-delete"}
                    title="Delete"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
            {replyingTo === comment._id && (
              <div className="mt-2 bg-gray-100 border border-primary/30 rounded-lg p-2">
                <textarea
                  className="w-full border border-black/20 rounded-lg p-2 bg-white"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={2}
                  placeholder="Write a reply..."
                />
                <div className="flex gap-2 mt-1">
                  <button className="text-green-700 font-semibold" onClick={() => handleReply(comment._id)} disabled={actionLoading === comment._id + "-reply"}>
                    Post Reply
                  </button>
                  <button className="text-gray-500" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-6 mt-4 border-l-4 border-gray-200 pl-4">
                <CommentList comments={comment.replies} loading={false} userId={userId} parentId={comment._id} onAction={onAction} startupId={startupId} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
} 