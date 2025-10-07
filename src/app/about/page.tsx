'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, Trophy, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">About Ambira</h1>
          <p className="text-xl text-gray-600">
            The social productivity platform that turns work into a shared journey
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#007AFF] to-[#0051D5] text-white rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">
            Strava for Productivity
          </h2>
          <p className="text-lg leading-relaxed">
            Ambira brings the motivation and community of fitness tracking to your work life.
            Track sessions, build streaks, follow friends, and compete in challenges - all while
            staying focused on what matters most.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We believe that productivity shouldn't be a solitary pursuit. When you share your progress,
            celebrate wins with others, and see friends pushing forward, work becomes more meaningful
            and sustainable.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Ambira transforms isolated work sessions into a connected experience where every hour logged,
            every streak maintained, and every goal achieved is part of a larger community journey.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start mb-4">
              <div className="bg-[#007AFF] rounded-lg p-3 mr-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Track Your Work
                </h3>
                <p className="text-gray-600">
                  Log work sessions with projects and tasks. Build a detailed history of your
                  productivity over time.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start mb-4">
              <div className="bg-[#34C759] rounded-lg p-3 mr-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Build Streaks
                </h3>
                <p className="text-gray-600">
                  Maintain daily work streaks to develop consistent habits and track your
                  longest runs of productivity.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start mb-4">
              <div className="bg-[#FC4C02] rounded-lg p-3 mr-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect with Friends
                </h3>
                <p className="text-gray-600">
                  Follow friends, support their sessions, and share your progress in groups.
                  Productivity is better together.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start mb-4">
              <div className="bg-[#FF9500] rounded-lg p-3 mr-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Join Challenges
                </h3>
                <p className="text-gray-600">
                  Compete in time-based challenges, group goals, and leaderboards to stay
                  motivated and push yourself further.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-[#007AFF] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Create Your Profile</h3>
                <p className="text-gray-600">
                  Sign up and set up your profile with projects you're working on.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-[#007AFF] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Track Your Sessions</h3>
                <p className="text-gray-600">
                  Use the timer to log work sessions. Choose what to share publicly or keep private.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-[#007AFF] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Build Your Community</h3>
                <p className="text-gray-600">
                  Follow friends, join groups, and participate in challenges to stay motivated.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-[#007AFF] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Stay Consistent</h3>
                <p className="text-gray-600">
                  Build streaks, earn achievements, and watch your productivity flourish with community support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Community First</h3>
              <p className="text-gray-600">
                We believe progress is better when shared. Our platform fosters supportive communities
                where everyone celebrates each other's wins.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Privacy Matters</h3>
              <p className="text-gray-600">
                You control what you share. Set visibility for your profile, sessions, and projects
                to match your comfort level.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Sustainable Productivity</h3>
              <p className="text-gray-600">
                We promote healthy work habits over burnout. Ambira helps you build consistent,
                sustainable productivity practices.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Continuous Improvement</h3>
              <p className="text-gray-600">
                We're constantly evolving based on user feedback. Your input shapes the future of Ambira.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#007AFF] to-[#0051D5] text-white rounded-lg p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-6">
            Join thousands of users who are making productivity social
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild variant="secondary" size="lg">
              <Link href="/">Go to Feed</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white text-[#007AFF] hover:bg-gray-100">
              <Link href="/help">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
