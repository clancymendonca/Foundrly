"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FilterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'recent';

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const applyFilter = (filterType: string) => {
    const currentQuery = searchParams.get('query') || '';
    const params = new URLSearchParams();
    
    if (currentQuery) {
      params.set('query', currentQuery);
    }
    
    if (filterType !== 'recent') {
      params.set('filter', filterType);
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(newUrl);
    closeDropdown();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 text-gray-800 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
      >
        <Filter className="w-8 h-8" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={closeDropdown}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => applyFilter('recent')}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentFilter === 'recent' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Most Recent
              </button>
              <button
                onClick={() => applyFilter('popular')}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentFilter === 'popular' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Most Popular
              </button>
              <button
                onClick={() => applyFilter('viewed')}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentFilter === 'viewed' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Most Viewed
              </button>
              <button
                onClick={() => applyFilter('liked')}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentFilter === 'liked' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Most Liked
              </button>
              <button
                onClick={() => applyFilter('commented')}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentFilter === 'commented' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Most Commented
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
