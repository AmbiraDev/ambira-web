'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, Trophy, TrendingUp } from 'lucide-react';
import { staticPageStyles } from '@/styles/staticPages';

export default function AboutPage() {
  return (
    <div className={staticPageStyles.containers.page}>
      <div className={staticPageStyles.containers.content}>
        {/* Header */}
        <div className={staticPageStyles.spacing.sectionMargin}>
          <Button variant="ghost" asChild className={staticPageStyles.backButton}>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className={`${staticPageStyles.typography.pageTitle} mb-2`}>About Ambira</h1>
          <p className={staticPageStyles.typography.pageDescription}>
            The social productivity platform that turns work into a shared journey
          </p>
        </div>

        {/* Hero Section */}
        <div className={`${staticPageStyles.gradientCta} ${staticPageStyles.spacing.sectionMargin} shadow-lg`}>
          <h2 className={`${staticPageStyles.typography.sectionHeading} text-white mb-4`}>
            Strava for Productivity
          </h2>
          <p className="text-lg leading-relaxed">
            Ambira brings the motivation and community of fitness tracking to your work life.
            Track sessions, build streaks, follow friends, and compete in challenges - all while
            staying focused on what matters most.
          </p>
        </div>

        {/* Mission Statement */}
        <div className={`${staticPageStyles.containers.card} ${staticPageStyles.spacing.sectionMargin}`}>
          <h2 className={`${staticPageStyles.typography.sectionHeading} mb-4`}>Our Mission</h2>
          <p className={`${staticPageStyles.typography.bodyText} ${staticPageStyles.spacing.paragraphSpacing}`}>
            We believe that productivity shouldn't be a solitary pursuit. When you share your progress,
            celebrate wins with others, and see friends pushing forward, work becomes more meaningful
            and sustainable.
          </p>
          <p className={staticPageStyles.typography.bodyText}>
            Ambira transforms isolated work sessions into a connected experience where every hour logged,
            every streak maintained, and every goal achieved is part of a larger community journey.
          </p>
        </div>

        {/* Key Features */}
        <div className={`grid md:grid-cols-2 gap-6 ${staticPageStyles.spacing.sectionMargin}`}>
          <div className={staticPageStyles.containers.card}>
            <div className="flex items-start mb-4">
              <div className={`${staticPageStyles.iconBackgrounds.blue} rounded-lg p-3 mr-4`}>
                <Target className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.white}`} />
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-2`}>
                  Track Your Work
                </h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Log work sessions with projects and tasks. Build a detailed history of your
                  productivity over time.
                </p>
              </div>
            </div>
          </div>

          <div className={staticPageStyles.containers.card}>
            <div className="flex items-start mb-4">
              <div className={`${staticPageStyles.iconBackgrounds.green} rounded-lg p-3 mr-4`}>
                <TrendingUp className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.white}`} />
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-2`}>
                  Build Streaks
                </h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Maintain daily work streaks to develop consistent habits and track your
                  longest runs of productivity.
                </p>
              </div>
            </div>
          </div>

          <div className={staticPageStyles.containers.card}>
            <div className="flex items-start mb-4">
              <div className="bg-[#FC4C02] rounded-lg p-3 mr-4">
                <Users className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.white}`} />
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-2`}>
                  Connect with Friends
                </h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Follow friends, support their sessions, and share your progress in groups.
                  Productivity is better together.
                </p>
              </div>
            </div>
          </div>

          <div className={staticPageStyles.containers.card}>
            <div className="flex items-start mb-4">
              <div className={`${staticPageStyles.iconBackgrounds.orange} rounded-lg p-3 mr-4`}>
                <Trophy className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.white}`} />
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-2`}>
                  Join Challenges
                </h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Compete in time-based challenges, group goals, and leaderboards to stay
                  motivated and push yourself further.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className={`${staticPageStyles.containers.card} ${staticPageStyles.spacing.sectionMargin}`}>
          <h2 className={`${staticPageStyles.typography.sectionHeading} mb-6`}>How It Works</h2>
          <div className={staticPageStyles.spacing.elementSpacing}>
            <div className="flex items-start">
              <div className={`${staticPageStyles.iconBackgrounds.blue} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0`}>
                1
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Create Your Profile</h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Sign up and set up your profile with projects you're working on.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className={`${staticPageStyles.iconBackgrounds.blue} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0`}>
                2
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Track Your Sessions</h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Use the timer to log work sessions. Choose what to share publicly or keep private.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className={`${staticPageStyles.iconBackgrounds.blue} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0`}>
                3
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Build Your Community</h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Follow friends, join groups, and participate in challenges to stay motivated.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className={`${staticPageStyles.iconBackgrounds.blue} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0`}>
                4
              </div>
              <div>
                <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Stay Consistent</h3>
                <p className={staticPageStyles.typography.bodyText}>
                  Build streaks, earn achievements, and watch your productivity flourish with community support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className={`${staticPageStyles.containers.card} ${staticPageStyles.spacing.sectionMargin}`}>
          <h2 className={`${staticPageStyles.typography.sectionHeading} mb-6`}>Our Values</h2>
          <div className={staticPageStyles.spacing.elementSpacing}>
            <div>
              <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Community First</h3>
              <p className={staticPageStyles.typography.bodyText}>
                We believe progress is better when shared. Our platform fosters supportive communities
                where everyone celebrates each other's wins.
              </p>
            </div>
            <div>
              <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Privacy Matters</h3>
              <p className={staticPageStyles.typography.bodyText}>
                You control what you share. Set visibility for your profile, sessions, and projects
                to match your comfort level.
              </p>
            </div>
            <div>
              <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Sustainable Productivity</h3>
              <p className={staticPageStyles.typography.bodyText}>
                We promote healthy work habits over burnout. Ambira helps you build consistent,
                sustainable productivity practices.
              </p>
            </div>
            <div>
              <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-1`}>Continuous Improvement</h3>
              <p className={staticPageStyles.typography.bodyText}>
                We're constantly evolving based on user feedback. Your input shapes the future of Ambira.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className={`${staticPageStyles.gradientCta} text-center shadow-lg`}>
          <h2 className={`${staticPageStyles.typography.sectionHeading} text-white mb-4`}>Ready to Get Started?</h2>
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
