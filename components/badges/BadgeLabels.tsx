'use client';

import React from 'react';
import { RARITY_LEVELS, TIER_LEVELS } from '@/lib/badges/enhanced-badge-system';
import { Trophy, Star, Zap, Flame, Crown, Gem } from 'lucide-react';

interface BadgeLabelsProps {
  badges: any[];
  maxDisplay?: number;
  showRarity?: boolean;
  showTier?: boolean;
  compact?: boolean;
}

export default function BadgeLabels({ 
  badges, 
  maxDisplay = 8, 
  showRarity = true, 
  showTier = true,
  compact = false 
}: BadgeLabelsProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const hasMore = badges.length > maxDisplay;
  
  // Component initialized

  const getRarityStyle = (rarity: keyof typeof RARITY_LEVELS) => {
    const rarityConfig = RARITY_LEVELS[rarity];
    if (!rarityConfig) return {};
    
    return {
      backgroundColor: rarityConfig.bgColor,
      color: rarityConfig.color,
      borderColor: rarityConfig.borderColor,
    } as React.CSSProperties;
  };

  const getTierStyle = (tier: keyof typeof TIER_LEVELS) => {
    const tierConfig = TIER_LEVELS[tier];
    if (!tierConfig) return {};
    
    return {
      backgroundColor: tierConfig.bgColor,
      color: tierConfig.color,
      borderColor: tierConfig.borderColor,
    } as React.CSSProperties;
  };

  const getRarityIcon = (rarity: keyof typeof RARITY_LEVELS) => {
    switch (rarity) {
      case 'common': return null;
      case 'uncommon': return <Star className="w-3 h-3" />;
      case 'rare': return <Zap className="w-3 h-3" />;
      case 'epic': return <Flame className="w-3 h-3" />;
      case 'legendary': return <Crown className="w-3 h-3" />;
      case 'mythical': return <Gem className="w-3 h-3" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'creator': return '🚀';
      case 'community': return '🤝';
      case 'social': return '💬';
      case 'achievement': return '🏆';
      case 'special': return '⭐';
      default: return '🏅';
    }
  };

  const getTierIcon = (tier: keyof typeof TIER_LEVELS) => {
    const tierConfig = TIER_LEVELS[tier];
    return tierConfig?.icon || '🏅';
  };

  return (
    <div className="w-full">
          
      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
        {displayBadges.map((badge) => (
          <div
            key={badge._id || badge.id}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
              border-4 transition-all duration-200 hover:scale-105 cursor-pointer
              ${compact ? 'min-w-fit' : 'min-w-[120px]'}
            `}
            style={getRarityStyle(badge.rarity)}
            title={`${badge.name} (${badge.tier || 'No Tier'}): ${badge.description}`}
          >
            <span className="text-sm">
              {getCategoryIcon(badge.category)}
            </span>
            
            <span className="truncate">
              {badge.name}
            </span>
          </div>
        ))}
        
        {hasMore && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100 border-4 border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer">
            <span>View More</span>
          </div>
        )}
      </div>
    </div>
  );
}
