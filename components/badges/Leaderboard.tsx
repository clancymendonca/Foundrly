'use client';

import React, { useState, useEffect } from 'react';
import { client } from '@/sanity/lib/client';
import Link from 'next/link';

interface LeaderboardEntry {
  _id: string;
  name: string;
  username: string;
  image?: string;
  value: number;
  metric: string;
  subtitle?: string;
}

interface LeaderboardProps {
  metric: 'likes_received' | 'followers_gained' | 'startups_created' | 'comments_posted' | 'views_received' | 'engagement_rate' | 'startup_success';
  title: string;
  limit?: number;
  icon?: string;
}

export default function Leaderboard({ 
  metric, 
  title, 
  limit = 10,
  icon = '🏆'
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [metric, limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      let query = '';
      let valueField = '';
      
      switch (metric) {
        case 'likes_received':
          query = `
            *[_type == "author"] {
              _id,
              name,
              username,
              image
            }
          `;
          valueField = 'likes';
          break;
          
        case 'followers_gained':
          query = `
            *[_type == "author"] {
              _id,
              name,
              username,
              image,
              "value": coalesce(count(followers), 0)
            } | order(value desc)[0...${limit}]
          `;
          valueField = 'followers';
          break;
          
        case 'startups_created':
          query = `
            *[_type == "author"] {
              _id,
              name,
              username,
              image
            }
          `;
          valueField = 'startups';
          break;
          
        case 'comments_posted':
          query = `
            *[_type == "author"] {
              _id,
              name,
              username,
              image
            }
          `;
          valueField = 'comments';
          break;
          
        case 'views_received':
          query = `
            *[_type == "author"] {
              _id,
              name,
              username,
              image
            }
          `;
          valueField = 'views';
          break;

        case 'engagement_rate':
          query = `
            *[_type == "author"] {
              _id,
              name,
              username,
              image
            }
          `;
          valueField = 'engagement';
          break;

        case 'startup_success':
          query = `
            *[_type == "author"] {
              _id,
              name,
              username,
              image
            }
          `;
          valueField = 'success';
          break;
      }

      const results = await client.fetch(query) || [];
      
      let processedResults = results;
      
      // Handle aggregation for various metrics
      if (metric === 'likes_received' || metric === 'views_received' || metric === 'startups_created' || metric === 'comments_posted' || metric === 'engagement_rate' || metric === 'startup_success') {
        if (metric === 'comments_posted') {
          // Fetch all comments separately
          const allComments = await client.fetch(`*[_type == "comment"] { _id, author }`);
          
          // Group comments by author
          const commentsByAuthor = new Map();
          allComments.forEach((comment: any) => {
            const authorId = comment.author?._ref;
            if (!authorId) {
              return;
            }
            if (!commentsByAuthor.has(authorId)) {
              commentsByAuthor.set(authorId, []);
            }
            commentsByAuthor.get(authorId).push(comment);
          });
          
          processedResults = results.map((entry: any) => {
            const comments = commentsByAuthor.get(entry._id) || [];
            return {
              ...entry,
              value: comments.length
            };
          }).filter((entry: any) => entry.value >= 0)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, limit);
        } else if (metric === 'engagement_rate') {
          // Calculate engagement rate (likes + comments) / views
          const [allStartups, allComments] = await Promise.all([
            client.fetch(`*[_type == "startup"] { _id, author, likes, views }`),
            client.fetch(`*[_type == "comment"] { _id, author }`)
          ]);
          
          const startupsByAuthor = new Map();
          const commentsByAuthor = new Map();
          
          allStartups.forEach((startup: any) => {
            const authorId = startup.author?._ref;
            if (!authorId) {
              return;
            }
            if (!startupsByAuthor.has(authorId)) {
              startupsByAuthor.set(authorId, []);
            }
            startupsByAuthor.get(authorId).push(startup);
          });
          
          allComments.forEach((comment: any) => {
            const authorId = comment.author?._ref;
            if (!authorId) {
              return;
            }
            if (!commentsByAuthor.has(authorId)) {
              commentsByAuthor.set(authorId, []);
            }
            commentsByAuthor.get(authorId).push(comment);
          });
          
          processedResults = results.map((entry: any) => {
            const startups = startupsByAuthor.get(entry._id) || [];
            const comments = commentsByAuthor.get(entry._id) || [];
            
            const totalLikes = startups.reduce((sum: number, startup: any) => sum + (startup.likes || 0), 0);
            const totalViews = startups.reduce((sum: number, startup: any) => sum + (startup.views || 0), 0);
            const totalComments = comments.length;
            
            const engagement = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100) : 0;
            
            return {
              ...entry,
              value: Math.round(engagement * 100) / 100, // Round to 2 decimal places
              subtitle: `${totalLikes} likes, ${totalComments} comments`
            };
          }).filter((entry: any) => entry.value >= 0)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, limit);
        } else if (metric === 'startup_success') {
          // Calculate startup success score based on likes, views, and comments
          const [allStartups, allComments] = await Promise.all([
            client.fetch(`*[_type == "startup"] { _id, author, likes, views }`),
            client.fetch(`*[_type == "comment"] { _id, startup }`)
          ]);
          
          const startupsByAuthor = new Map();
          const commentsByStartup = new Map();
          
          allStartups.forEach((startup: any) => {
            const authorId = startup.author?._ref;
            if (!authorId) {
              return;
            }
            if (!startupsByAuthor.has(authorId)) {
              startupsByAuthor.set(authorId, []);
            }
            startupsByAuthor.get(authorId).push(startup);
          });
          
          allComments.forEach((comment: any) => {
            const startupId = comment.startup?._ref;
            if (!startupId) {
              return;
            }
            if (!commentsByStartup.has(startupId)) {
              commentsByStartup.set(startupId, []);
            }
            commentsByStartup.get(startupId).push(comment);
          });
          
          processedResults = results.map((entry: any) => {
            const startups = startupsByAuthor.get(entry._id) || [];
            
            const successScore = startups.reduce((totalScore: number, startup: any) => {
              const startupComments = commentsByStartup.get(startup._id) || [];
              const commentScore = startupComments.length * 2; // Comments worth 2 points each
              const likeScore = (startup.likes || 0) * 1; // Likes worth 1 point each
              const viewScore = Math.floor((startup.views || 0) / 10); // Every 10 views worth 1 point
              
              return totalScore + commentScore + likeScore + viewScore;
            }, 0);
            
            return {
              ...entry,
              value: successScore,
              subtitle: `${startups.length} startups`
            };
          }).filter((entry: any) => entry.value >= 0)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, limit);
        } else {
          // Fetch all startups separately for likes, views, and startups_created
          const allStartups = await client.fetch(`*[_type == "startup"] { _id, author, ${metric === 'likes_received' ? 'likes' : metric === 'views_received' ? 'views' : ''} }`);
          
          // Group startups by author
          const startupsByAuthor = new Map();
          allStartups.forEach((startup: any) => {
            const authorId = startup.author?._ref;
            if (!authorId) {
              return;
            }
            if (!startupsByAuthor.has(authorId)) {
              startupsByAuthor.set(authorId, []);
            }
            startupsByAuthor.get(authorId).push(startup);
          });
        
          processedResults = results.map((entry: any) => {
            const startups = startupsByAuthor.get(entry._id) || [];
            
            const totalValue = startups.reduce((sum: number, startup: any) => {
              if (metric === 'startups_created') {
                return sum + 1; // Count each startup as 1
              }
              const value = metric === 'likes_received' ? startup.likes : startup.views;
              return sum + (value || 0);
            }, 0);
            
            return {
              ...entry,
              value: totalValue
            };
          }).filter((entry: any) => entry.value >= 0)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, limit);
        }
      } else {
        // For followers, show all users (even with 0 values)
        processedResults = results.filter((entry: any) => entry && entry.value >= 0);
      }
      
      const leaderboardEntries: LeaderboardEntry[] = processedResults
        .map((entry: any) => ({
          _id: entry._id,
          name: entry.name || 'Unknown User',
          username: entry.username || 'unknown',
          image: entry.image,
          value: entry.value || 0,
          metric: valueField,
          subtitle: entry.subtitle
        }));

      setEntries(leaderboardEntries);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  const getMetricIcon = () => {
    switch (metric) {
      case 'likes_received': return '❤️';
      case 'followers_gained': return '👥';
      case 'startups_created': return '🚀';
      case 'comments_posted': return '💬';
      case 'views_received': return '👁️';
      case 'engagement_rate': return '📈';
      case 'startup_success': return '⭐';
      default: return '📊';
    }
  };

  const formatValue = (value: number) => {
    if (metric === 'engagement_rate') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">{icon}</span>
          {title}
        </h3>
        <div className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="text-xl mr-2">{icon}</span>
        {title}
      </h3>
      
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {entries.length === 0 ? (
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center w-8 h-8 text-lg font-bold text-gray-300">
              #1
            </div>
            
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 font-medium text-sm">?</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-400 truncate">
                No data available
              </div>
              <div className="text-sm text-gray-300">
                @placeholder
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-gray-400 flex items-center space-x-1">
                <span>{getMetricIcon()}</span>
                <span>0</span>
              </div>
              <div className="text-xs text-gray-300">
                {entries.length > 0 ? entries[0]?.metric : 'data'}
              </div>
            </div>
          </div>
        ) : (
          entries.map((entry, index) => (
            <Link
              key={entry._id}
              href={`/user/${entry._id}`}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-center w-8 h-8 text-lg font-bold text-gray-600 group-hover:text-gray-800">
                {getRankIcon(index)}
              </div>
              
              <div className="flex-shrink-0">
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                    <span className="text-gray-600 font-medium text-sm group-hover:text-gray-800">
                      {(entry.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {entry.name}
                </div>
                <div className="text-sm text-gray-500">
                  @{entry.username}
                </div>
                {entry.subtitle && (
                  <div className="text-xs text-gray-400 mt-1">
                    {entry.subtitle}
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900 flex items-center space-x-1 group-hover:text-blue-600 transition-colors">
                  <span>{getMetricIcon()}</span>
                  <span>{formatValue(entry.value)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {entry.metric}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button 
          onClick={loadLeaderboard}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

