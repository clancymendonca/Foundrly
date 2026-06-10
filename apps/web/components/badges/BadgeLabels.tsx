'use client';

import React from 'react';
import {
  getRarityConfig,
  getTierConfig,
  type LeveledBadge,
} from '@foundrly/shared/badges';

interface BadgeLabelsProps {
  badges: LeveledBadge[];
  maxDisplay?: number;
  showTier?: boolean;
  compact?: boolean;
}

export default function BadgeLabels({
  badges,
  maxDisplay = 8,
  showTier = true,
  compact = false,
}: BadgeLabelsProps) {
  if (!badges?.length) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const hasMore = badges.length > maxDisplay;

  return (
    <div className="w-full">
      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
        {displayBadges.map((badge) => {
          const tier = getTierConfig(badge.currentTier);
          const levelDef = badge.levels.find((l) => l.tier === badge.currentTier);
          const rarity = getRarityConfig(levelDef?.rarity);

          return (
            <div
              key={badge._id}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                border-2 transition-all duration-200 hover:scale-105 cursor-pointer
                ${compact ? 'min-w-fit' : 'min-w-[120px]'}
              `}
              style={{
                backgroundColor: rarity.bgColor,
                color: rarity.color,
                borderColor: rarity.borderColor,
              }}
              title={`${badge.name}${badge.currentTier ? ` · ${badge.currentTier}` : ''}`}
            >
              {showTier && badge.currentTier ? (
                <span className="text-sm">{tier.icon}</span>
              ) : (
                <span className="text-sm">{badge.icon || '🏅'}</span>
              )}
              <span className="truncate">{badge.name}</span>
            </div>
          );
        })}

        {hasMore && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100 border-2 border-gray-200">
            <span>View More</span>
          </div>
        )}
      </div>
    </div>
  );
}
