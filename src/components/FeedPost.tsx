'use client';

interface FeedPostProps {
  author: string;
  authorInitials: string;
  authorColor: string;
  timestamp: string;
  location?: string;
  title: string;
  description?: string;
  time: string;
  metric1: string;
  metric1Value: string;
  metric2: string;
  metric2Value: string;
  kudosCount: number;
  commentCount: number;
}

function FeedPost({
  author,
  authorInitials,
  authorColor,
  timestamp,
  location,
  title,
  description,
  time,
  metric1,
  metric1Value,
  metric2,
  metric2Value,
  kudosCount,
  commentCount
}: FeedPostProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${authorColor} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-sm font-medium text-white">{authorInitials}</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{author}</div>
              <div className="text-xs text-gray-600">{timestamp}{location && ` • ${location}`}</div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="flex items-start space-x-3 mb-3">
          <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600 text-xs">Time</div>
                <div className="font-semibold text-gray-900">{time}</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs">{metric1}</div>
                <div className="font-semibold text-gray-900">{metric1Value}</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs">{metric2}</div>
                <div className="font-semibold text-gray-900">{metric2Value}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Kudos avatars */}
          <div className="flex -space-x-2">
            <div className="w-6 h-6 bg-orange-400 rounded-full border-2 border-white"></div>
            <div className="w-6 h-6 bg-blue-400 rounded-full border-2 border-white"></div>
            <div className="w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <span className="text-sm text-gray-600">{kudosCount} kudos • {commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-[#007AFF] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-[#007AFF] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Comment Section */}
      {commentCount > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-white">ES</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm text-gray-900">Elijah Shekinah</span>
                <span className="text-xs text-gray-500">about 3 hours ago</span>
              </div>
              <p className="text-sm text-gray-700">Just like witches at black masses 😈</p>
              <button className="flex items-center space-x-1 mt-1 text-xs text-gray-500 hover:text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>1 like</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedPost;
