'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface SearchToastProps {
  query?: string;
  aiSearchReasons: string[];
  postCount: number;
}

export default function SearchToast({ query, aiSearchReasons, postCount }: SearchToastProps) {
  useEffect(() => {
    if (query && aiSearchReasons.length > 0) {
      // Check if this is a fallback search result
      const isFallback = aiSearchReasons.some(reason => 
        reason.includes('using text search') || 
        reason.includes('text search for')
      );
      
      if (isFallback) {
        // This is a fallback search, show warning toast
        toast.success(`Found ${postCount} results (⚠️ AI services unavailable: Using text search instead)`);
      } else {
        // This is a normal AI search result
        toast.success(`Found ${postCount} results`);
      }
    }
  }, [query, aiSearchReasons, postCount]);

  return null; // This component only handles toast display
}


