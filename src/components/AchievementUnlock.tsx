'use client';

import React, { useEffect, useState } from 'react';
import { X, Share2 } from 'lucide-react';
import { Achievement } from '@/types';

interface AchievementUnlockProps {
  achievement: Achievement;
  onClose: () => void;
  onShare?: (achievementId: string) => void;
}

export const AchievementUnlock: React.FC<AchievementUnlockProps> = ({
  achievement,
  onClose,
  onShare,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleShare = () => {
    onShare?.(achievement.id);
    handleClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
      >
        {/* Confetti background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 opacity-50" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Icon with animation */}
          <div className="mb-4 animate-bounce">
            <div className="text-8xl inline-block">{achievement.icon}</div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Achievement Unlocked!
          </h2>

          {/* Achievement name */}
          <h3 className="text-2xl font-semibold text-orange-600 mb-3">
            {achievement.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6">{achievement.description}</p>

          {/* Action buttons */}
          <div className="flex gap-3">
            {onShare && (
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Share2 className="w-5 h-5" />
                Share to Feed
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />
      </div>
    </div>
  );
};
