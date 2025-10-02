'use client';

function LeftSidebar() {
  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-[60px] space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-24 h-24 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl font-medium text-white">D</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daniel Jones</h2>
          
          <div className="flex justify-center space-x-8 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">Following</div>
              <div className="text-2xl font-bold text-gray-900">2</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Followers</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Activities</div>
              <div className="text-2xl font-bold text-gray-900">1</div>
            </div>
          </div>

          {/* Latest Activity */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="text-sm text-gray-600 mb-1">Latest Activity</div>
            <div className="text-sm font-semibold text-gray-900">Study Session • Oct 1, 2025</div>
          </div>

          {/* Your Streak */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Your streak</div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-900 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Weeks</span>
              </div>
            </div>
            
            {/* Weekly Calendar */}
            <div className="flex justify-between items-end mb-2">
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">M</div>
                <div className="text-sm font-semibold text-gray-400">29</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">T</div>
                <div className="text-sm font-semibold text-gray-400">30</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">W</div>
                <div className="w-8 h-8 mx-auto bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">1</span>
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">T</div>
                <div className="text-sm font-semibold text-gray-400">2</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">F</div>
                <div className="text-sm font-semibold text-gray-400">3</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">S</div>
                <div className="text-sm font-semibold text-gray-400">4</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">S</div>
                <div className="text-sm font-semibold text-gray-400">5</div>
              </div>
            </div>
          </div>
        </div>

        {/* Training Log */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <button className="w-full flex items-center justify-between text-gray-900 hover:text-[#007AFF] transition-colors">
            <span className="text-sm font-medium">Your Training Log</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Activity Icons */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Relative Effort */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#FC4C02] rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">RELATIVE EFFORT</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-600 mb-2">LAST WEEK</div>
          <div className="text-lg font-semibold text-gray-900 mb-2">Recovery Week</div>
          <p className="text-xs text-gray-600 mb-4">Based on your heart rate data, your training last week was less intense than usual. Way to recover intelligently.</p>
          
          {/* Graph placeholder */}
          <div className="h-32 bg-gradient-to-b from-purple-100 to-purple-200 rounded relative">
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-purple-300 to-transparent rounded"></div>
            {/* Graph dots */}
            <div className="absolute bottom-8 left-8 w-3 h-3 bg-purple-400 rounded-full"></div>
            <div className="absolute bottom-12 left-1/3 w-3 h-3 bg-purple-400 rounded-full"></div>
            <div className="absolute bottom-6 left-2/3 w-3 h-3 bg-purple-400 rounded-full"></div>
            <div className="absolute bottom-16 right-8 w-4 h-4 bg-purple-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default LeftSidebar;
