"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { BanCheckWrapper } from "@/components/moderation/BanCheckWrapper";

function CommentFormContent({ 
  startupId, 
  onCommentAdded, 
  isBanned, 
  banMessage 
}: { 
  startupId: string; 
  onCommentAdded: () => void;
  isBanned: boolean;
  banMessage: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'create', text, startupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post comment");
      setText("");
      setSuccess(true);
      onCommentAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show ban message if user is banned
  if (isBanned) {
    return (
      <div className="space-y-3 mt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Account Suspended</h3>
              <p className="text-red-700 text-sm mt-1">{banMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-6">
      <textarea
        className="w-full border border-black rounded-lg p-3 min-h-[60px]"
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        maxLength={1000}
        disabled={loading}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-primary border-2 border-black rounded-full px-6 py-2 font-bold text-white disabled:opacity-50"
          disabled={loading || !text.trim()}
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
        {error && <span className="text-red-500 text-sm">{error}</span>}
        {success && <span className="text-green-600 text-sm">Comment posted!</span>}
      </div>
    </form>
  );
}

export default function CommentForm({ startupId, onCommentAdded }: { startupId: string; onCommentAdded: () => void }) {
  return (
    <BanCheckWrapper>
      {({ isBanned, banMessage }) => (
        <CommentFormContent 
          startupId={startupId} 
          onCommentAdded={onCommentAdded}
          isBanned={isBanned}
          banMessage={banMessage}
        />
      )}
    </BanCheckWrapper>
  );
} 