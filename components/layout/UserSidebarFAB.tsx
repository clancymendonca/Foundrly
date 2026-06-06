'use client';

import React from 'react';
import { Settings, X } from 'lucide-react';

interface UserSidebarFABProps {
  isSidebarOpen: boolean;
  onToggle: () => void;
}

export default function UserSidebarFAB({ isSidebarOpen, onToggle }: UserSidebarFABProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 right-6 lg:hidden z-50 w-14 h-14 bg-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white"
    >
      {isSidebarOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <Settings className="w-6 h-6" />
      )}
    </button>
  );
}

