'use client';

import React, { useState, useEffect } from 'react';
import BadgeLeaderboard from './BadgeLeaderboard';
import Leaderboard from './Leaderboard';
import { enhancedBadgeSystem } from '@/lib/badges/enhanced-badge-system';
import { client } from '@/sanity/lib/client';
import Link from 'next/link';

interface LeaderboardSectionProps {
  className?: string;
}

export default function LeaderboardSection({ className = '' }: LeaderboardSectionProps) {
  const [stats, setStats] = useState({
    totalBadges: 0,
    activeUsers: 0,
    diamondUsers: 0,
    startupsCreated: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      await enhancedBadgeSystem.initialize();
      
      // Get comprehensive stats
      const [allUsers, allUserBadges, allStartups, allComments] = await Promise.all([
        client.fetch(`*[_type == "author"]`),
        client.fetch(`*[_type == "userBadge"]`),
        client.fetch(`*[_type == "startup"]`),
        client.fetch(`*[_type == "comment"]`)
      ]).then(results => results.map(result => result || []));

      // Calculate diamond users (users with diamond tier badges)
      const diamondUserIds = new Set();
      allUserBadges.forEach((userBadge: any) => {
        if (userBadge.badge?.tier === 'diamond' && userBadge.user?._ref) {
          diamondUserIds.add(userBadge.user._ref);
        }
      });

      // Calculate total engagement metrics
      const totalLikes = allStartups.reduce((sum: number, startup: any) => sum + (startup.likes || 0), 0);
      const totalViews = allStartups.reduce((sum: number, startup: any) => sum + (startup.views || 0), 0);
      const totalComments = allComments.length;

      setStats({
        totalBadges: allUserBadges.length,
        activeUsers: allUsers.length,
        diamondUsers: diamondUserIds.size,
        startupsCreated: allStartups.length,
        totalLikes,
        totalViews,
        totalComments
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-3">🏆 Community Leaderboards</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover the most active founders, creators, and community members driving innovation
        </p>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-2xl mr-3">📊</span>
          Community Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          <div className="text-center group">
            <div className="text-3xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">🏆</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Badges Earned</div>
            <div className="text-xl font-bold text-gray-900">{stats.totalBadges.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-green-600 mb-2 group-hover:scale-110 transition-transform">👥</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Active Founders</div>
            <div className="text-xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-purple-600 mb-2 group-hover:scale-110 transition-transform">💎</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Elite Members</div>
            <div className="text-xl font-bold text-gray-900">{stats.diamondUsers.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform">🚀</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Startups Launched</div>
            <div className="text-xl font-bold text-gray-900">{stats.startupsCreated.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-red-600 mb-2 group-hover:scale-110 transition-transform">❤️</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Total Likes</div>
            <div className="text-xl font-bold text-gray-900">{stats.totalLikes.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-indigo-600 mb-2 group-hover:scale-110 transition-transform">👁️</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Total Views</div>
            <div className="text-xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-teal-600 mb-2 group-hover:scale-110 transition-transform">💬</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Comments</div>
            <div className="text-xl font-bold text-gray-900">{stats.totalComments.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Leaderboards Grid - Organized by Categories */}
      <div className="space-y-8">
        {/* Startup Performance */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🚀</span>
            Startup Performance
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Leaderboard
              metric="views_received"
              title="Most Viewed Startups"
              limit={6}
              icon="👁️"
            />
            <Leaderboard
              metric="likes_received"
              title="Most Liked Startups"
              limit={6}
              icon="❤️"
            />
            <Leaderboard
              metric="engagement_rate"
              title="Highest Engagement"
              limit={6}
              icon="📈"
            />
          </div>
        </div>

        {/* Community Engagement */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🤝</span>
            Community Engagement
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Leaderboard
              metric="followers_gained"
              title="Most Followed"
              limit={6}
              icon="👥"
            />
            <Leaderboard
              metric="comments_posted"
              title="Top Commenters"
              limit={6}
              icon="💬"
            />
          </div>
        </div>

        {/* Creator Achievement */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🏆</span>
            Creator Achievement
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Leaderboard
              metric="startups_created"
              title="Most Startups Created"
              limit={6}
              icon="🚀"
            />
            <Leaderboard
              metric="startup_success"
              title="Most Successful"
              limit={6}
              icon="⭐"
            />
            <BadgeLeaderboard
              metric="total_badges"
              limit={6}
              title="🏆 Badge Collectors"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Build Your Legacy?</h3>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            Join the ranks of successful founders. Create, engage, and earn recognition in our growing community of innovators.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/startup/create">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
                🚀 Launch Your Startup
              </button>
            </Link>
            <Link href="/badges">
              <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 transform hover:scale-105">
                🏆 View All Badges
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
