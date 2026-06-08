import React from "react";

interface MessageCardProps {
  name: string;
  message: string;
  time: string;
  avatarUrl?: string;
  onClick?: (name: string) => void;
}

export default function MessageCard({ name, message, time, avatarUrl, onClick }: MessageCardProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition rounded-lg cursor-pointer"
      onClick={() => onClick?.(name)}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 border border-gray-200">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-base text-gray-900 truncate">{name}</span>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{time}</span>
        </div>
        <div className="text-sm text-gray-600 truncate max-w-xs">{message}</div>
      </div>
    </div>
  );
} 