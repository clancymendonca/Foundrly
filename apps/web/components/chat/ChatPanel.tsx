import React from "react";

interface ChatPanelProps {
  name: string;
  message: string;
  time: string;
  avatarUrl?: string;
  onBack?: () => void;
}

export default function ChatPanel({ name, message, time, avatarUrl, onBack }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button className="sm:hidden mr-2" onClick={onBack} aria-label="Back">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-base font-bold text-gray-600 border border-gray-200">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-base text-gray-900">{name}</span>
          <span className="text-xs text-gray-500">Last message: {message}</span>
        </div>
        <span className="ml-auto text-xs text-gray-400">{time}</span>
      </div>
      <div className="flex-1 flex flex-col justify-end bg-gray-50 p-6">
        <div className="flex-1" />
        <div className="text-center text-gray-400 mb-4">This is a dummy chat panel for {name}.</div>
        <div className="flex gap-2">
          <input className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white" placeholder="Type a message..." disabled />
          <button className="bg-primary-500 text-white rounded-full px-4 py-2 font-semibold text-sm opacity-50 cursor-not-allowed" disabled>Send</button>
        </div>
      </div>
    </div>
  );
} 