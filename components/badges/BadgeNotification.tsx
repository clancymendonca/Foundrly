'use client';

import React, { useState, useEffect } from 'react';
import { UserBadge } from '@/lib/badges/badge-system';
import { X } from 'lucide-react';

interface BadgeNotificationProps {
  badge: UserBadge;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function BadgeNotification({ 
  badge, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: BadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isVisible && !isClosing 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 animate-bounce"
            style={{ backgroundColor: badge.badge.color }}
          >
            {badge.badge.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-sm">
                🏆 Badge Earned!
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="font-semibold text-gray-900 mb-1">
              {badge.badge.name}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {badge.badge.description}
            </p>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                badge.badge.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                badge.badge.rarity === 'epic' ? 'bg-blue-100 text-blue-800' :
                badge.badge.rarity === 'rare' ? 'bg-green-100 text-green-800' :
                badge.badge.rarity === 'uncommon' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {badge.badge.rarity}
              </span>
              
              <span className="text-xs text-gray-500">
                Just now
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress bar for progress-based badges */}
        {badge.progress && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{badge.progress.current}/{badge.progress.target}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${badge.progress.percentage}%`,
                  backgroundColor: badge.badge.color
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
