import React from 'react';
import LeaderboardSection from '@/components/badges/LeaderboardSection';

export const metadata = {
  title: 'Leaderboards - Foundrly',
  description: 'See who\'s leading the community in badges, activity, and achievements',
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeaderboardSection />
      </div>
    </div>
  );
}



