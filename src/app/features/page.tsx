import Link from 'next/link';
import {
  Clock,
  Target,
  Users,
  Award,
  Calendar,
  CheckCircle,
  Zap,
  Activity,
  Trophy,
  BarChart3,
  Heart,
} from 'lucide-react';

export default function FeaturesPage() {
  const features = [
    {
      icon: Clock,
      title: 'Smart Session Tracking',
      description:
        'Track work sessions with our intuitive timer. Start, pause, and log your productivity with detailed notes and project tagging.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Target,
      title: 'Project Management',
      description:
        'Organize your work into projects and tasks. Break down complex goals into manageable pieces and track progress over time.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Calendar,
      title: 'Streak Tracking',
      description:
        'Build momentum with daily streaks. Stay motivated by maintaining your current streak and beat your personal best.',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Users,
      title: 'Social Connectivity',
      description:
        'Follow friends and colleagues to see their productivity sessions. Give support, leave comments, and build a community of focused workers.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Trophy,
      title: 'Groups & Challenges',
      description:
        'Join productivity groups and compete in challenges. Test yourself with most-activity, fastest-effort, and group goal challenges.',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description:
        'Visualize your productivity patterns with detailed analytics. Track time spent across projects and identify your most productive periods.',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: Activity,
      title: 'Live Activity Feed',
      description:
        'See real-time updates from your network. Celebrate wins, discover new projects, and stay inspired by the community.',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
    },
    {
      icon: Award,
      title: 'Achievements',
      description:
        'Unlock achievements as you reach milestones. Earn badges for consistency, dedication, and productivity excellence.',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      icon: Zap,
      title: 'Privacy Controls',
      description:
        'Control who sees your activity. Choose between public, followers-only, or private visibility for your sessions and profile.',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users', icon: Users },
    { value: '1M+', label: 'Sessions Tracked', icon: CheckCircle },
    { value: '500K+', label: 'Hours Logged', icon: Clock },
    { value: '5K+', label: 'Challenges Completed', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0066CC] to-[#0055CC] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Productivity Meets Community
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Track your work sessions, build streaks, compete with friends, and
              celebrate productivity together - like Strava, but for getting
              things done.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-white text-[#0066CC] rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-transparent text-white border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-[#0066CC]" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Stay Productive
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you track, improve, and share
            your productivity journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
            >
              <div
                className={`${feature.bgColor} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Ambira Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes and join a community of productive people
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0066CC] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Track Your Sessions
              </h3>
              <p className="text-gray-600">
                Start the timer when you begin working. Add project tags, tasks,
                and notes to document your progress.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#FC4C02] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Build Your Streak
              </h3>
              <p className="text-gray-600">
                Log at least one session daily to maintain your streak. Watch
                your momentum grow and beat your personal best.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#34C759] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Connect & Compete
              </h3>
              <p className="text-gray-600">
                Follow friends, join groups, and participate in challenges.
                Share your wins and support others in their journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-gradient-to-r from-[#0066CC] to-[#0055CC] rounded-2xl p-8 sm:p-12 text-white text-center">
          <Heart className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Join the Productivity Revolution
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Thousands of people are already tracking their work, building
            streaks, and achieving their goals with Ambira. Be part of the
            community.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-white text-[#0066CC] rounded-lg hover:bg-gray-100 transition-colors"
          >
            Start Tracking Free
          </Link>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600 mb-4">
            Have questions?{' '}
            <Link href="/help" className="text-[#0066CC] hover:underline">
              Visit our Help Center
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-[#0066CC] hover:underline">
              Contact Us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
