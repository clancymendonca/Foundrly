'use client';

import React from 'react';
import { Badge, UserBadge } from '@/lib/badges/badge-system';

interface BadgeDisplayProps {
  badges: UserBadge[];
  showProgress?: boolean;
  compact?: boolean;
  maxDisplay?: number;
}

export default function BadgeDisplay({ 
  badges, 
  showProgress = false, 
  compact = false,
  maxDisplay 
}: BadgeDisplayProps) {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {displayBadges.map((userBadge) => (
          <div
            key={userBadge._id}
            className="group relative"
            title={`${userBadge.badge.name}: ${userBadge.badge.description}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: userBadge.badge.color }}
            >
              {userBadge.badge.icon}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              <div className="font-semibold">{userBadge.badge.name}</div>
              <div className="text-gray-300">{userBadge.badge.description}</div>
              <div className="text-gray-400 mt-1">
                Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ))}
        
        {maxDisplay && badges.length > maxDisplay && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
            +{badges.length - maxDisplay}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayBadges.map((userBadge) => (
          <div
            key={userBadge._id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: userBadge.badge.color }}
              >
                {userBadge.badge.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {userBadge.badge.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    userBadge.badge.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                    userBadge.badge.rarity === 'epic' ? 'bg-blue-100 text-blue-800' :
                    userBadge.badge.rarity === 'rare' ? 'bg-green-100 text-green-800' :
                    userBadge.badge.rarity === 'uncommon' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {userBadge.badge.rarity}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {userBadge.badge.description}
                </p>
                
                {showProgress && userBadge.progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{userBadge.progress.current}/{userBadge.progress.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${userBadge.progress.percentage}%`,
                          backgroundColor: userBadge.badge.color
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {maxDisplay && badges.length > maxDisplay && (
        <div className="text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View all {badges.length} badges
          </button>
        </div>
      )}
    </div>
  );
}
