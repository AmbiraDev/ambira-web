export default function GroupsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header placeholder */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-40">
        <div className="flex items-center justify-center h-8">
          <h1 className="text-base font-bold text-gray-900">Groups</h1>
        </div>
      </div>

      {/* Loading content */}
      <div className="flex items-center justify-center pt-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
          <p className="text-gray-600 text-sm">Loading groups...</p>
        </div>
      </div>

      {/* Bottom navigation space */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
