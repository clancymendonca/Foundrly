'use client';

import React, { useState, useEffect } from 'react';
import {
  getRarityConfig,
  getTierConfig,
  TIER_LIST,
  type BadgeLevel,
} from '@foundrly/shared/badges';
import { enhancedBadgeSystem, type EnhancedBadge } from '@/lib/badges/enhanced-badge-system';

const BADGE_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: '🏆' },
  { value: 'creator', label: 'Creator', icon: '🎨' },
  { value: 'community', label: 'Community', icon: '🤝' },
  { value: 'social', label: 'Social', icon: '💬' },
  { value: 'achievement', label: 'Achievement', icon: '⭐' },
  { value: 'special', label: 'Special Event', icon: '🎉' },
];

export default function AllBadges() {
  const [badges, setBadges] = useState<EnhancedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAllBadges();
  }, []);

  const loadAllBadges = async () => {
    try {
      setLoading(true);
      await enhancedBadgeSystem.initialize();
      const allBadges = await enhancedBadgeSystem.getAllBadges();
      setBadges(allBadges);
    } catch (error) {
      console.error('Failed to load badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = badges.filter(
    (badge) => selectedCategory === 'all' || badge.category === selectedCategory,
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter tracks</h3>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
        >
          {BADGE_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.icon} {category.label}
            </option>
          ))}
        </select>
        <p className="mt-4 text-sm text-gray-600">
          Showing {filteredBadges.length} of {badges.length} badge tracks
        </p>
      </div>

      {filteredBadges.length === 0 ? (
        <div className="text-center py-12 text-gray-600">No badge tracks found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map((badge) => (
            <div
              key={badge._id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${badge.color || '#6B7280'}20` }}
                >
                  {badge.icon || '🏆'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {badge.category} · {badge.metric?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{badge.description}</p>

              <div className="space-y-2">
                {(badge.levels ?? []).map((level: BadgeLevel) => {
                  const tier = getTierConfig(level.tier);
                  const rarity = getRarityConfig(level.rarity);
                  return (
                    <div
                      key={level.tier}
                      className="flex items-center justify-between text-xs rounded-lg px-2 py-1.5"
                      style={{ backgroundColor: tier.bgColor }}
                    >
                      <span style={{ color: tier.color }}>
                        {tier.icon} {tier.label}
                      </span>
                      <span style={{ color: rarity.color }}>{level.target.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-1 mt-3">
                {TIER_LIST.map((tier) => {
                  const config = getTierConfig(tier);
                  return (
                    <div
                      key={tier}
                      className="h-1 flex-1 rounded-full"
                      style={{ backgroundColor: config.borderColor }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
