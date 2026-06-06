'use client';

import React, { useState, useEffect } from 'react';
import { UserBadge } from '@/lib/badges/badge-system';
import { RARITY_LEVELS } from '@/lib/badges/enhanced-badge-system';
import { X, Star, Zap, Fire, Crown, Gem } from 'lucide-react';

interface EnhancedBadgeNotificationProps {
  badge: UserBadge;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
  showProgress?: boolean;
  showRarity?: boolean;
  showCategory?: boolean;
}

export default function EnhancedBadgeNotification({ 
  badge, 
  onClose, 
  autoClose = true, 
  duration = 8000,
  showProgress = true,
  showRarity = true,
  showCategory = true
}: EnhancedBadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getRarityStyle = (rarity: string) => {
    const rarityConfig = RARITY_LEVELS[rarity as keyof typeof RARITY_LEVELS];
    if (!rarityConfig) return RARITY_LEVELS.common;
    return rarityConfig;
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'mythical':
        return <Crown className="w-5 h-5" />;
      case 'legendary':
        return <Fire className="w-5 h-5" />;
      case 'epic':
        return <Zap className="w-5 h-5" />;
      case 'rare':
        return <Gem className="w-5 h-5" />;
      case 'uncommon':
        return <Star className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'creator': '🚀',
      'community': '💬',
      'social': '🦋',
      'achievement': '🏆',
      'special': '⭐'
    };
    return iconMap[category] || '🎯';
  };

  const rarityStyle = getRarityStyle(badge.badge?.rarity || 'common');

  if (isClosing) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`bg-white rounded-xl shadow-2xl border-2 transition-all duration-300 transform ${
          isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
        }`}
        style={{
          borderColor: rarityStyle.borderColor,
          boxShadow: badge.badge?.rarity === 'mythical' 
            ? '0 0 30px rgba(255, 215, 0, 0.8)' 
            : badge.badge?.rarity === 'legendary'
            ? '0 0 25px rgba(220, 38, 38, 0.6)'
            : badge.badge?.rarity === 'epic'
            ? '0 0 20px rgba(124, 58, 237, 0.5)'
            : '0 10px 25px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
              style={{
                backgroundColor: rarityStyle.bgColor,
                color: rarityStyle.color,
                border: `2px solid ${rarityStyle.borderColor}`
              }}
            >
              {badge.badge?.icon || getCategoryIcon(badge.badge?.category || '')}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Badge Earned!
              </h3>
              {showRarity && (
                <div className="flex items-center space-x-1">
                  {getRarityIcon(badge.badge?.rarity || 'common')}
                  <span 
                    className="text-xs font-medium"
                    style={{ color: rarityStyle.color }}
                  >
                    {rarityStyle.label}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge Content */}
        <div className="px-4 pb-4">
          <div className="text-center mb-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3"
              style={{
                backgroundColor: rarityStyle.bgColor,
                color: rarityStyle.color,
                border: `3px solid ${rarityStyle.borderColor}`
              }}
            >
              {badge.badge?.icon || getCategoryIcon(badge.badge?.category || '')}
            </div>
            
            <h4 className="font-bold text-gray-900 text-lg mb-1">
              {badge.badge?.name || 'Unknown Badge'}
            </h4>
            
            <p className="text-gray-600 text-sm mb-3">
              {badge.badge?.description || 'No description available'}
            </p>

            {/* Category and Rarity Tags */}
            <div className="flex items-center justify-center space-x-2 mb-3">
              {showCategory && badge.badge?.category && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                  {badge.badge.category}
                </span>
              )}
              {showRarity && (
                <span 
                  className="px-2 py-1 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: rarityStyle.bgColor,
                    color: rarityStyle.color,
                    border: `1px solid ${rarityStyle.borderColor}`
                  }}
                >
                  {rarityStyle.label}
                </span>
              )}
            </div>

            {/* Progress Bar (if available) */}
            {showProgress && badge.progress && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{badge.progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${badge.progress.percentage}%`,
                      backgroundColor: rarityStyle.color
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {badge.progress.current} / {badge.progress.target}
                </div>
              </div>
            )}

            {/* Earned Date */}
            {badge.earnedAt && (
              <div className="text-xs text-gray-400">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{
                backgroundColor: rarityStyle.color
              }}
            >
              Got it!
            </button>
          </div>

          {/* Expandable Details */}
          {showDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-900 text-sm mb-2">Badge Details</h5>
              
              {badge.badge?.criteria && (
                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Type:</span> {badge.badge.criteria.type}
                  </div>
                  <div>
                    <span className="font-medium">Target:</span> {badge.badge.criteria.target}
                  </div>
                  <div>
                    <span className="font-medium">Metric:</span> {badge.badge.criteria.metric}
                  </div>
                  <div>
                    <span className="font-medium">Timeframe:</span> {badge.badge.criteria.timeframe}
                  </div>
                </div>
              )}

              {badge.metadata && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Context:</span> {badge.metadata.context}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rarity Glow Effect */}
        {badge.badge?.rarity === 'mythical' && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/10 via-yellow-300/10 to-yellow-400/10 animate-pulse pointer-events-none" />
        )}
      </div>
    </div>
  );
}
