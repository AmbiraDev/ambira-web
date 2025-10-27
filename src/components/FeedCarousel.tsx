'use client';

import React, { useState } from 'react';

export const FeedCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="mb-6">
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* Slide 1: Weekly Snapshot */}
          <div className="w-full flex-shrink-0 px-4 md:px-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Your Weekly Snapshot
                </h3>
                <button className="text-[#007AFF] text-sm font-medium hover:text-[#0056D6]">
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Activities
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">12</span>
                    <span className="text-sm text-green-600 flex items-center">
                      <svg
                        className="w-3 h-3 mr-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </svg>
                      +3
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Time
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      24h
                    </span>
                    <span className="text-sm text-green-600 flex items-center">
                      <svg
                        className="w-3 h-3 mr-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </svg>
                      +5h
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Projects
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">5</span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <svg
                        className="w-3 h-3 mr-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                      0
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Compared to last week</p>
              </div>
            </div>
          </div>

          {/* Slide 2: Your Streak */}
          <div className="w-full flex-shrink-0 px-4 md:px-0">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Your streak</h3>

              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="text-5xl font-bold mb-1">4</div>
                  <div className="text-sm opacity-90">weeks</div>
                </div>
                <div className="text-6xl opacity-20">🔥</div>
              </div>

              <button className="w-full bg-white text-orange-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                Record now to continue
              </button>
            </div>
          </div>

          {/* Slide 3: Suggested Goal */}
          <div className="w-full flex-shrink-0 px-4 md:px-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Suggested Goal
                </h3>
                <button className="text-[#007AFF] text-sm font-medium hover:text-[#0056D6]">
                  Customize
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl">
                    🎯
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      25 Hours This Week
                    </h4>
                    <p className="text-xs text-gray-600">
                      Track 25 hours of focused work
                    </p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold">16h / 25h</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                      style={{ width: '64%' }}
                    ></div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-[#007AFF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#0056D6] transition-colors">
                Set Goal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pill Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {[...Array(totalSlides)].map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'w-8 bg-[#007AFF]' : 'w-8 bg-gray-300'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeedCarousel;
