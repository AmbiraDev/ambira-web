'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity } from '@/types';
import { ImageUpload } from '@/components/ImageUpload';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { IconRenderer } from '@/components/IconRenderer';
import { Check, ChevronDown } from 'lucide-react';

interface FinishSessionModalProps {
  sessionTitle: string;
  setSessionTitle: (title: string) => void;
  sessionDescription: string;
  setSessionDescription: (description: string) => void;
  selectedActivityId: string;
  setSelectedActivityId: (id: string) => void;
  allActivities: Activity[];
  selectedActivity: Activity | null;
  selectedImages: File[];
  imagePreviewUrls: string[];
  onImagesChange: (images: File[], previewUrls: string[]) => void;
  adjustedDuration: number;
  onDurationChange: (value: number | number[]) => void;
  getElapsedTime: () => number;
  getFormattedTime: (seconds: number) => string;
  startTime: Date;
  onStartTimeChange: (timeString: string) => void;
  visibility: 'everyone' | 'followers' | 'private';
  setVisibility: (visibility: 'everyone' | 'followers' | 'private') => void;
  isUploadingImages: boolean;
  onSave: () => void;
  onResume: () => void;
  onDiscard: () => void;
}

export function FinishSessionModal({
  sessionTitle,
  setSessionTitle,
  sessionDescription,
  setSessionDescription,
  selectedActivityId,
  setSelectedActivityId,
  allActivities,
  selectedActivity,
  selectedImages,
  imagePreviewUrls,
  onImagesChange,
  adjustedDuration,
  onDurationChange,
  getElapsedTime,
  getFormattedTime,
  startTime,
  onStartTimeChange,
  visibility,
  setVisibility,
  isUploadingImages,
  onSave,
  onResume,
  onDiscard,
}: FinishSessionModalProps) {
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Helper to format Date to time input value (HH:MM)
  const formatTimeForInput = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto h-full">
          <div className="p-4 sm:p-6 w-full min-h-screen">
            {/* Header with Resume and Save Session title */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={onResume}
                className="text-[#0066CC] hover:text-[#0051D5] font-semibold text-base"
              >
                Resume
              </button>
              <h3 className="text-base font-semibold text-gray-900">
                Save Session
              </h3>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Session Title */}
              <input
                type="text"
                value={sessionTitle}
                onChange={e => setSessionTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base"
                placeholder="Afternoon Work Session"
              />

              {/* Description */}
              <textarea
                value={sessionDescription}
                onChange={e => setSessionDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base"
                rows={3}
                placeholder="How'd it go? Share more about your session."
              />

              {/* Activity Selection */}
              <div className="relative">
                <button
                  onClick={() => setShowActivityPicker(!showActivityPicker)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white cursor-pointer text-base flex items-center gap-3 hover:border-gray-400 transition-colors min-h-[44px]"
                >
                  {selectedActivity ? (
                    <>
                      <IconRenderer
                        iconName={selectedActivity.icon}
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: selectedActivity.color }}
                      />
                      <span className="flex-1 text-left">
                        {selectedActivity.name}
                      </span>
                    </>
                  ) : (
                    <span className="flex-1 text-left text-gray-500">
                      Select an activity
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {showActivityPicker && (
                  <>
                    {/* Backdrop for closing */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActivityPicker(false)}
                    />

                    {/* Dropdown content */}
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {allActivities.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-600 mb-3">
                            No activities yet
                          </p>
                          <Link
                            href="/activities/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Create Activity
                          </Link>
                        </div>
                      ) : (
                        <>
                          {allActivities.map(activity => (
                            <button
                              key={activity.id}
                              onClick={() => {
                                setSelectedActivityId(activity.id);
                                setShowActivityPicker(false);
                              }}
                              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                                selectedActivityId === activity.id
                                  ? 'bg-blue-50'
                                  : ''
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `${activity.color}20`,
                                }}
                              >
                                <IconRenderer
                                  iconName={activity.icon}
                                  className="w-4 h-4"
                                  style={{ color: activity.color }}
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-medium text-gray-900">
                                  {activity.name}
                                </div>
                              </div>
                              {selectedActivityId === activity.id && (
                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                          <Link
                            href="/activities/new"
                            className="w-full flex items-center gap-3 p-3 border-t border-gray-200 hover:bg-gray-50 transition-colors text-gray-900 font-medium"
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                              <svg
                                className="w-4 h-4 text-[#0066CC]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            </div>
                            <span className="text-sm">Create New Activity</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Image Upload */}
              <div className="max-w-md">
                <ImageUpload
                  maxImages={3}
                  maxSizeMB={5}
                  images={selectedImages}
                  previewUrls={imagePreviewUrls}
                  onImagesChange={onImagesChange}
                  uploadMode="deferred"
                  showProgress={false}
                />
              </div>

              {/* Duration Adjuster */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Adjust Duration
                </label>
                <div className="space-y-3">
                  {/* Start Time Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formatTimeForInput(startTime)}
                      onChange={e => onStartTimeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm"
                    />
                  </div>

                  <div className="py-2 px-1">
                    <Slider
                      min={0}
                      max={getElapsedTime()}
                      step={900}
                      value={adjustedDuration}
                      onChange={onDurationChange}
                      trackStyle={{ backgroundColor: '#0066CC', height: 6 }}
                      railStyle={{ backgroundColor: '#E5E7EB', height: 6 }}
                      handleStyle={{
                        backgroundColor: 'white',
                        border: '3px solid #0066CC',
                        width: 20,
                        height: 20,
                        marginTop: -7,
                        boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
                        opacity: 1,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 px-1">
                    <span>0m</span>
                    <span className="font-semibold text-base text-gray-900">
                      {getFormattedTime(adjustedDuration)}
                    </span>
                    <span>{getFormattedTime(getElapsedTime())}</span>
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={e =>
                    setVisibility(e.target.value as typeof visibility)
                  }
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] appearance-none bg-white min-h-[44px]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                  }}
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="private">Only You</option>
                </select>
              </div>

              {/* Discard Session Link */}
              <div className="pt-2 pb-1 text-center">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-red-600 hover:text-red-700 text-base font-medium"
                >
                  Discard Session
                </button>
              </div>

              {/* Save Session Button */}
              <button
                onClick={onSave}
                disabled={!sessionTitle.trim() || isUploadingImages}
                className="w-full px-4 py-3 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
              >
                {isUploadingImages ? 'Uploading...' : 'Save Session'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal - Portal-style overlay */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Discard Session?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to discard this session? All progress will
              be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Keep Session
              </button>
              <button
                onClick={onDiscard}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
