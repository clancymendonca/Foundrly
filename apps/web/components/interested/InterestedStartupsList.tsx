'use client';

import { useState, useEffect } from 'react';
import StartupCard from '@/components/startup/StartupCard';

interface InterestedStartup {
  _id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  _createdAt: string;
  author?: {
    _id: string;
    name: string;
    image?: string;
  };
  views?: number;
  likes?: number;
  dislikes?: number;
  commentsCount?: number;
  buyMeACoffeeUsername?: string;
  interestedBy?: string[];
}

interface InterestedStartupsListProps {
  interestedStartups: InterestedStartup[];
  userId: string;
  selectedTab?: string;
  selectedCategory?: string;
  onCategoriesLoaded?: (categories: string[]) => void;
}

export default function InterestedStartupsList({ interestedStartups, userId, selectedTab, selectedCategory, onCategoriesLoaded }: InterestedStartupsListProps) {
  const [startups, setStartups] = useState<InterestedStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch interested startups from API
  useEffect(() => {
    const fetchInterestedStartups = async () => {
      if (!userId) {
        setStartups([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory);
        }
        params.append('sortBy', 'newest'); // You can make this dynamic later

        const response = await fetch(`/api/interested-startups?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setStartups(data.startups || []);
        } else {
          setError(data.message || 'Failed to fetch interested startups');
        }
      } catch (err) {
        setError('Failed to load interested startups');
        console.error('Error fetching interested startups:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterestedStartups();
  }, [userId, selectedCategory]);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      if (!userId || !onCategoriesLoaded) return;

      try {
        const response = await fetch('/api/interested-categories');
        const data = await response.json();
        
        if (data.success) {
          onCategoriesLoaded(data.categories || ['All']);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        onCategoriesLoaded(['All']);
      }
    };

    fetchCategories();
  }, [userId, onCategoriesLoaded]);

  const handleRemove = async (startupId: string) => {
    try {
      const res = await fetch(`/api/interested?id=${startupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        // Remove the startup from the local state
        setStartups(prev => prev.filter(startup => startup._id !== startupId));
      }
    } catch (error) {
      console.error('Error removing interested startup:', error);
    }
  };

  if (loading) {
    return (
      <div className="pr-20">
        <ul className="card_grid-compact">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index}>
              <div className="startup-card_skeleton animate-pulse"></div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!startups || startups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {selectedTab === 'categories' && selectedCategory && selectedCategory !== 'All' 
            ? `No interested startups in ${selectedCategory} category` 
            : 'No interested startups yet'
          }
        </h3>
        <p className="text-gray-500 mb-4">
          {selectedTab === 'categories' && selectedCategory && selectedCategory !== 'All'
            ? `Try selecting a different category or show interest in some ${selectedCategory.toLowerCase()} startups.`
            : 'Start exploring startups and show interest in the ones you find interesting!'
          }
        </p>
        <a 
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Startups
        </a>
      </div>
    );
  }

  return (
    <div className="pr-20">
      <ul className="card_grid-compact">
        {startups.map((startup) => (
          <StartupCard 
            key={startup._id} 
            post={startup}
            isOwner={false}
            isLoggedIn={!!userId}
            userId={userId}
            showDescription={false}
            showCategory={false}
            showDetailsButton={false}
            showLikesDislikes={true}
          />
        ))}
      </ul>
    </div>
  );
}


