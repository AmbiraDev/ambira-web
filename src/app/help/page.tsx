'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { staticPageStyles } from '@/styles/staticPages';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is Ambira?',
        a: 'Ambira is a social productivity tracking platform - think "Strava for Productivity". Track your work sessions, build streaks, follow friends, and compete in challenges to stay motivated and productive.',
      },
      {
        q: 'How do I create my first session?',
        a: 'Click the timer icon in the navigation or go to /timer. Select a project, optionally add a task, and start tracking. Your session will appear in your feed and profile once completed.',
      },
      {
        q: 'What are projects and tasks?',
        a: 'Projects help you organize your work (e.g., "Mobile App", "Marketing"). Tasks are specific items within projects. Both are optional - you can track sessions without them.',
      },
    ],
  },
  {
    category: 'Social Features',
    questions: [
      {
        q: 'How does the feed work?',
        a: 'Your feed shows work sessions from people you follow. Sessions can be public (visible to everyone), followers-only, or private. Support sessions and leave comments to encourage others.',
      },
      {
        q: 'What are supports?',
        a: 'Supports are like "likes" - a way to show appreciation for someone\'s work session. They appear on sessions in the feed and profile.',
      },
      {
        q: 'How do I follow someone?',
        a: 'Visit their profile by clicking their username anywhere in the app, then click the "Follow" button. You\'ll see their public sessions in your feed.',
      },
    ],
  },
  {
    category: 'Streaks & Challenges',
    questions: [
      {
        q: 'How do streaks work?',
        a: 'Complete at least one work session per day to maintain your streak. Miss a day and your streak resets. Your longest streak is saved in your profile.',
      },
      {
        q: 'What types of challenges are available?',
        a: 'Challenges include Most Activity (total time), Fastest Effort (speed), Longest Session, and Group Goals. Join global challenges or create group-specific ones.',
      },
      {
        q: 'How do I join a challenge?',
        a: 'Go to /challenges, browse available challenges, and click "Join". Track your progress on the challenge leaderboard.',
      },
    ],
  },
  {
    category: 'Privacy & Settings',
    questions: [
      {
        q: 'Can I make my profile private?',
        a: 'Yes! Go to Settings → Privacy to control who can see your profile, activity feed, and projects. Options include everyone, followers-only, or private.',
      },
      {
        q: 'How do I control session visibility?',
        a: 'When creating or editing a session, choose visibility: Public (everyone), Followers (people who follow you), or Private (only you).',
      },
      {
        q: 'Can I delete my account?',
        a: 'Contact support to request account deletion. We\'ll remove your data in accordance with our privacy policy.',
      },
    ],
  },
  {
    category: 'Groups',
    questions: [
      {
        q: 'What are groups?',
        a: 'Groups are communities where members share sessions, participate in challenges, and stay motivated together. Groups can be public or require approval to join.',
      },
      {
        q: 'How do I create a group?',
        a: 'Go to /groups and click "Create Group". Add a name, description, and choose privacy settings. You\'ll become the group admin.',
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-start justify-between text-left hover:bg-gray-50 transition-colors px-4"
      >
        <span className={`${staticPageStyles.typography.subsectionHeading} pr-4`}>{question}</span>
        {isOpen ? (
          <ChevronUp className={`${staticPageStyles.icons.small} text-gray-500 flex-shrink-0 mt-0.5`} />
        ) : (
          <ChevronDown className={`${staticPageStyles.icons.small} text-gray-500 flex-shrink-0 mt-0.5`} />
        )}
      </button>
      {isOpen && (
        <div className={`px-4 pb-4 ${staticPageStyles.typography.bodyText}`}>
          {answer}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
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
          <h1 className={`${staticPageStyles.typography.pageTitle} mb-2`}>Help Center</h1>
          <p className={staticPageStyles.typography.pageDescription}>
            Find answers to common questions about using Ambira
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((section) => (
            <div key={section.category} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className={`${staticPageStyles.iconBackgrounds.blue} text-white px-6 py-4`}>
                <h2 className={`${staticPageStyles.typography.sectionHeading} text-white`}>{section.category}</h2>
              </div>
              <div>
                {section.questions.map((item, index) => (
                  <FAQItem key={index} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className={`mt-12 ${staticPageStyles.containers.card} text-center`}>
          <h2 className={`${staticPageStyles.typography.sectionHeading} mb-2`}>
            Still need help?
          </h2>
          <p className={`${staticPageStyles.typography.bodyText} mb-4`}>
            Can't find the answer you're looking for? Reach out to our support team.
          </p>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
