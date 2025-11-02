import { MobileLoadingScreen } from '@/components/MobileLoadingScreen';

export default function Loading() {
  return (
    <>
      {/* Mobile: Full-screen white background with blue logo */}
      <div className="md:hidden">
        <MobileLoadingScreen />
      </div>

      {/* Desktop: Traditional spinner */}
      <div className="hidden md:flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    </>
  );
}
