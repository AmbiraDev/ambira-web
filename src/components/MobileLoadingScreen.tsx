/**
 * Mobile Loading Screen Component
 *
 * Displays a full-screen white background with the blue Ambira logo
 * centered on mobile devices during loading states.
 *
 * Design: Clean, professional loading experience for mobile users
 * - Background: White (matching default theme-color)
 * - Blue Ambira logo centered
 * - No spinner - simple and elegant
 * - No theme-color changes needed - always white
 */

'use client';

export function MobileLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        {/* Ambira Logo SVG */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 375 375"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-4"
        >
          <path
            d="M 56.387 320.265 L 105.145 307.202 L 134.619 191.47 L 222.369 275.789 L 300.91 254.743 C 300.91 254.743 327.644 243.277 327.701 205.067 C 327.765 162.452 292.22 150.864 292.22 150.864 C 292.22 150.864 311.586 129.825 286.573 94.501 C 265.409 64.612 226.767 75.885 226.767 75.885 L 131.479 100.996 L 163.14 132.378 L 240.652 113.004 C 240.652 113.004 253.429 109.011 259.254 125.122 C 264.463 139.529 249.128 146.798 249.139 146.809 C 249.186 146.856 192.6 161.379 192.553 161.379 C 192.506 161.379 224.354 193.363 224.406 193.466 C 224.435 193.523 259.751 183.839 259.751 183.839 C 259.751 183.839 281.184 181.354 285.882 196.467 C 292.14 216.599 271.779 222.147 271.79 222.147 C 271.837 222.147 239.215 231.316 239.215 231.316 C 239.215 231.316 113.277 106.094 113.228 106.045 C 113.179 105.996 56.211 321.004 56.387 320.265 Z"
            fill="#305CDE"
            transform="matrix(0.96592605, 0.25881901, -0.25881901, 0.96592605, 57.2958925, -43.02296686)"
          />
        </svg>

        {/* Ambira Text */}
        <h1 className="text-[#305CDE] text-2xl font-bold tracking-wide">
          Ambira
        </h1>
      </div>
    </div>
  );
}
