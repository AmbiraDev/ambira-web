'use client';

function RightSidebar() {
  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-[60px] space-y-6">
        {/* Challenges */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Challenges</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Join productivity Challenges to stay motivated, earn achievements and see how you stack up against others.
          </p>
          <button className="text-sm font-medium text-[#007AFF] hover:text-[#0056D6] transition-colors">
            View All Challenges
          </button>
        </div>

        {/* Clubs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Clubs</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Why do it alone? Get more out of your Ambira experience by joining or creating a Club.
          </p>
          <button className="text-sm font-medium text-[#007AFF] hover:text-[#0056D6] transition-colors">
            View All Clubs
          </button>
        </div>

        {/* Suggested Friends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Suggested Friends</h3>
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">No suggestions yet</h4>
            <p className="text-xs text-gray-600 mb-4">
              We'll suggest users to follow based on your activity and interests.
            </p>
            <button className="text-sm font-medium text-[#007AFF] hover:text-[#0056D6] transition-colors">
              Browse All Users
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-gray-600">
            <a href="#" className="hover:text-[#007AFF]">Community Hub</a>
            <a href="#" className="hover:text-[#007AFF]">Support</a>
            <a href="#" className="hover:text-[#007AFF]">Subscription</a>
            <a href="#" className="hover:text-[#007AFF]">Student Discount</a>
            <a href="#" className="hover:text-[#007AFF]">Teacher, Military & Medical Discount (US Only)</a>
            <a href="#" className="hover:text-[#007AFF]">Terms</a>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
