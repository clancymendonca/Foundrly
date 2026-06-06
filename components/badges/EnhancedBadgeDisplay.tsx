'use client';

import React, { useState } from 'react';
import { EnhancedBadge, RARITY_LEVELS } from '@/lib/badges/enhanced-badge-system';

interface EnhancedBadgeDisplayProps {
  badges: any[];
  showProgress?: boolean;
  compact?: boolean;
  maxDisplay?: number;
  showRarity?: boolean;
  showCategory?: boolean;
  interactive?: boolean;
}

export default function EnhancedBadgeDisplay({ 
  badges, 
  showProgress = false, 
  compact = false,
  maxDisplay,
  showRarity = true,
  showCategory = true,
  interactive = true
}: EnhancedBadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;

  const getRarityStyle = (rarity: keyof typeof RARITY_LEVELS) => {
    const rarityConfig = RARITY_LEVELS[rarity];
    return {
      color: rarityConfig.color,
      backgroundColor: rarityConfig.bgColor,
      borderColor: rarityConfig.borderColor,
      boxShadow: rarity === 'mythical' ? '0 0 20px rgba(255, 215, 0, 0.6)' : 
                 rarity === 'legendary' ? '0 0 15px rgba(220, 38, 38, 0.5)' :
                 rarity === 'epic' ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none'
    };
  };

  const getBadgeSize = () => {
    if (compact) return 'w-8 h-8';
    if (maxDisplay && maxDisplay <= 5) return 'w-12 h-12';
    return 'w-10 h-10';
  };

  const getBadgeIcon = (badge: any) => {
    // Custom icon mapping for different categories
    const iconMap: { [key: string]: string } = {
      'creator': '🚀',
      'community': '💬',
      'social': '🦋',
      'achievement': '🏆',
      'special': '⭐'
    };

    // Use custom icon if available, otherwise fall back to category icon
    return badge.icon || iconMap[badge.category] || '🏅';
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {displayBadges.map((userBadge) => {
          const badge = userBadge.badge || userBadge;
          const rarityStyle = getRarityStyle(badge.rarity);
          
          return (
            <div
              key={userBadge._id}
              className="group relative"
              onMouseEnter={() => setHoveredBadge(userBadge._id)}
              onMouseLeave={() => setHoveredBadge(null)}
            >
              <div
                className={`${getBadgeSize()} rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 cursor-pointer hover:scale-110`}
                style={rarityStyle}
                onClick={() => interactive && setSelectedBadge(userBadge)}
              >
                {getBadgeIcon(badge)}
              </div>
              
              {/* Hover tooltip */}
              {hoveredBadge === userBadge._id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <div className="font-semibold">{badge.name}</div>
                  <div className="text-xs opacity-80">{badge.description}</div>
                  {showRarity && (
                    <div className="text-xs mt-1" style={{ color: rarityStyle.color }}>
                      {RARITY_LEVELS[badge.rarity].label}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Badge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayBadges.map((userBadge) => {
          const badge = userBadge.badge || userBadge;
          const rarityStyle = getRarityStyle(badge.rarity);
          const isEarned = userBadge.earnedAt || userBadge.isEarned;
          
          return (
            <div
              key={userBadge._id}
              className={`group relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
                interactive ? 'hover:scale-105' : ''
              } ${!isEarned ? 'opacity-50 grayscale' : ''}`}
              onMouseEnter={() => setHoveredBadge(userBadge._id)}
              onMouseLeave={() => setHoveredBadge(null)}
              onClick={() => interactive && setSelectedBadge(userBadge)}
            >
              {/* Badge Icon */}
              <div className="flex justify-center mb-3">
                <div
                  className={`${getBadgeSize()} rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                    badge.customStyles?.glow ? 'animate-pulse' : ''
                  }`}
                  style={rarityStyle}
                >
                  {getBadgeIcon(badge)}
                </div>
              </div>

              {/* Badge Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                  {badge.name}
                </h3>
                
                {showCategory && (
                  <div className="text-xs text-gray-500 mb-2 capitalize">
                    {badge.category}
                  </div>
                )}

                {showRarity && (
                  <div 
                    className="text-xs font-medium px-2 py-1 rounded-full mb-2 inline-block"
                    style={{
                      color: rarityStyle.color,
                      backgroundColor: rarityStyle.backgroundColor,
                      border: `1px solid ${rarityStyle.borderColor}`
                    }}
                  >
                    {RARITY_LEVELS[badge.rarity].label}
                  </div>
                )}

                {/* Progress Bar */}
                {showProgress && userBadge.progress && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${userBadge.progress.percentage}%`,
                        backgroundColor: rarityStyle.color
                      }}
                    />
                  </div>
                )}

                {/* Earned Date */}
                {isEarned && userBadge.earnedAt && (
                  <div className="text-xs text-gray-400">
                    Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Rarity Glow Effect */}
              {badge.rarity === 'mythical' && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 via-yellow-300/20 to-yellow-400/20 animate-pulse pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedBadge.badge?.name || selectedBadge.name}
                </h2>
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-6">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4`}
                  style={getRarityStyle(selectedBadge.badge?.rarity || 'common')}
                >
                  {getBadgeIcon(selectedBadge.badge || selectedBadge)}
                </div>

                <p className="text-gray-600 mb-4">
                  {selectedBadge.badge?.description || selectedBadge.description}
                </p>

                {showRarity && (
                  <div className="mb-4">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={getRarityStyle(selectedBadge.badge?.rarity || 'common')}
                    >
                      {RARITY_LEVELS[selectedBadge.badge?.rarity || 'common'].label}
                    </span>
                  </div>
                )}

                {showCategory && (
                  <div className="text-sm text-gray-500 mb-4">
                    Category: <span className="capitalize">{selectedBadge.badge?.category || selectedBadge.category}</span>
                  </div>
                )}

                {showProgress && selectedBadge.progress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{selectedBadge.progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${selectedBadge.progress.percentage}%`,
                          backgroundColor: getRarityStyle(selectedBadge.badge?.rarity || 'common').color
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedBadge.progress.current} / {selectedBadge.progress.target}
                    </div>
                  </div>
                )}

                {selectedBadge.earnedAt && (
                  <div className="text-sm text-gray-500">
                    Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
