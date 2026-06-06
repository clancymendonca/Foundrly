import React from "react";

interface SuggestedUserProps {
  name: string;
  username: string;
}

export default function SuggestedUser({ name, username }: SuggestedUserProps) {
  return (
    <div className="flex flex-col px-4 py-2 hover:bg-gray-100 transition rounded-lg cursor-pointer">
      <span className="font-medium text-sm text-gray-900">{name}</span>
      <span className="text-xs text-gray-500">{username}</span>
    </div>
  );
} 