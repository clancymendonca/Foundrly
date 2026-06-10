'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getRarityConfig,
  getTierConfig,
  TIER_LIST,
  type LeveledBadge,
} from '@foundrly/shared/badges';
import { getBadgesWithProgress } from '@/lib/badges/get-badges-with-progress';

interface MyBadgesProps {
  userId: string;
}

type StatusFilter = 'all' | 'complete' | 'in_progress' | 'locked';

function TierStepper({ badge }: { badge: LeveledBadge }) {
  return (
    <div className="flex gap-1 mt-3 mb-2">
      {TIER_LIST.map((tier, index) => {
        const config = getTierConfig(tier);
        const filled = index <= badge.currentLevelIndex;
        const isNext = badge.nextTier === tier && !badge.isComplete;
        return (
          <div
            key={tier}
            className="h-1.5 flex-1 rounded-full"
            style={{
              backgroundColor: filled
                ? config.borderColor
                : isNext
                  ? '#93C5FD'
                  : '#E5E7EB',
            }}
          />
        );
      })}
    </div>
  );
}

export default function MyBadges({ userId }: MyBadgesProps) {
  const [badges, setBadges] = useState<LeveledBadge[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    earned: 0,
    inProgress: 0,
    notStarted: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const loadBadgesWithProgress = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBadgesWithProgress(userId);
      setBadges(result.badges);
      setStats(result.stats);
    } catch (error) {
      console.error('Failed to load badges with progress:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBadgesWithProgress();
  }, [loadBadgesWithProgress]);

  const filteredBadges = useMemo(() => {
    let filtered = badges;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }

    switch (statusFilter) {
      case 'complete':
        filtered = filtered.filter((b) => b.isComplete);
        break;
      case 'in_progress':
        filtered = filtered.filter(
          (b) => !b.isComplete && (b.currentTier != null || b.progress.percentage > 0),
        );
        break;
      case 'locked':
        filtered = filtered.filter(
          (b) => !b.isComplete && b.currentTier == null && b.progress.percentage === 0,
        );
        break;
      default:
        break;
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter((b) => b.currentTier === tierFilter);
    }

    return filtered;
  }, [badges, selectedCategory, statusFilter, tierFilter]);

  const categories = useMemo(
    () => ['all', ...new Set(badges.map((b) => b.category).filter(Boolean))],
    [badges],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🏆 My Badges</h1>
        <p className="text-blue-100">
          {stats.earned} of {stats.total} tracks complete at diamond
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <StatCell label="Tracks" value={stats.total} />
          <StatCell label="Complete" value={stats.earned} />
          <StatCell label="In Progress" value={stats.inProgress} />
          <StatCell label="Not Started" value={stats.notStarted} />
          <StatCell label="Completion" value={`${stats.completionRate}%`} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All statuses</option>
          <option value="complete">Complete</option>
          <option value="in_progress">In progress</option>
          <option value="locked">Locked</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">Any tier</option>
          {TIER_LIST.map((tier) => (
            <option key={tier} value={tier}>
              {getTierConfig(tier).label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <p>No badge tracks match your filters.</p>
          </div>
        ) : (
          filteredBadges.map((badge) => {
            const displayTier = badge.currentTier ?? badge.nextTier ?? 'bronze';
            const tierStyle = getTierConfig(displayTier);
            const levelDef =
              badge.levels.find((l) => l.tier === displayTier) ??
              badge.levels.find((l) => l.tier === badge.nextTier);
            const rarityStyle = getRarityConfig(levelDef?.rarity);
            const inProgress = !badge.isComplete && badge.progress.percentage > 0;

            return (
              <div
                key={badge._id}
                className={`bg-white rounded-lg p-4 shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
                  badge.isComplete
                    ? 'border-green-200 bg-green-50'
                    : inProgress
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-3"
                    style={{
                      backgroundColor: tierStyle.bgColor,
                      color: tierStyle.color,
                      border: `2px solid ${tierStyle.borderColor}`,
                    }}
                  >
                    {badge.icon || '🏅'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: rarityStyle.bgColor,
                          color: rarityStyle.color,
                        }}
                      >
                        {rarityStyle.label}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: tierStyle.bgColor,
                          color: tierStyle.color,
                        }}
                      >
                        {tierStyle.icon}{' '}
                        {badge.isComplete
                          ? 'Complete'
                          : badge.currentTier
                            ? `Level ${badge.currentLevelIndex + 1}/5`
                            : 'Not started'}
                      </span>
                    </div>
                  </div>
                  {badge.isComplete && <div className="text-green-600 text-2xl">✓</div>}
                </div>

                <TierStepper badge={badge} />

                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{badge.description}</p>

                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{badge.isComplete ? 'Completed' : 'Progress to next tier'}</span>
                    <span>{badge.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${badge.progress.percentage}%`,
                        backgroundColor: badge.isComplete
                          ? '#10B981'
                          : inProgress
                            ? '#3B82F6'
                            : '#9CA3AF',
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  {badge.progress.current} / {badge.progress.target}
                </div>

                <div className="text-xs font-medium">
                  {badge.isComplete ? (
                    <span className="text-green-600">
                      ✓ Completed
                      {badge.completedAt &&
                        ` on ${new Date(badge.completedAt).toLocaleDateString()}`}
                    </span>
                  ) : badge.currentTier ? (
                    <span className="text-blue-600">🔄 Leveling up</span>
                  ) : (
                    <span className="text-gray-500">⏳ Locked</span>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-400 capitalize">
                  {badge.category} • {badge.metric.replace(/_/g, ' ')}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        Showing {filteredBadges.length} of {stats.total} tracks
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-blue-200">{label}</div>
    </div>
  );
}
