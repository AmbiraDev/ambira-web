'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-[#007AFF] mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            At Ambira, we take your privacy seriously. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our social productivity tracking platform.
          </p>
          <p className="text-gray-700 leading-relaxed">
            By using Ambira, you agree to the collection and use of information in accordance with this policy.
          </p>
        </div>

        {/* Key Privacy Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="bg-[#007AFF] rounded-lg p-3 w-fit mx-auto mb-3">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">You Control Visibility</h3>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="bg-[#34C759] rounded-lg p-3 w-fit mx-auto mb-3">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Secure Storage</h3>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="bg-[#FF9500] rounded-lg p-3 w-fit mx-auto mb-3">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">No Third-Party Sales</h3>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Information We Collect */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <Database className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
                <p className="text-gray-700">
                  When you create an account, we collect your name, email address, username, and password.
                  You may optionally provide additional profile information such as a profile picture and bio.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Session Data</h3>
                <p className="text-gray-700">
                  We collect information about your work sessions including duration, project names, task descriptions,
                  timestamps, and any notes you add. You control the visibility of this data through privacy settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Social Interactions</h3>
                <p className="text-gray-700">
                  We track your social activity including follows, supports (likes), comments, group memberships,
                  and challenge participation to provide social features and analytics.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage Information</h3>
                <p className="text-gray-700">
                  We collect information about how you interact with Ambira, including pages visited, features used,
                  and device information (browser type, operating system, IP address).
                </p>
              </div>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Provide and maintain the Ambira platform and its features</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Enable social features like following, commenting, and group participation</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Generate analytics and insights about your productivity</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Send notifications about activity on your account (with your permission)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Improve and optimize the platform based on usage patterns</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Prevent fraud, abuse, and ensure platform security</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Communicate with you about service updates and support</span>
              </li>
            </ul>
          </div>

          {/* Privacy Controls */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <Eye className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Your Privacy Controls</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Ambira gives you granular control over your data visibility:
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">Profile Visibility</h3>
                <p className="text-sm text-gray-700">
                  Choose who can view your profile: Everyone, Followers Only, or Private
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">Session Visibility</h3>
                <p className="text-sm text-gray-700">
                  Set default visibility for work sessions: Public, Followers, or Private
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">Project Visibility</h3>
                <p className="text-sm text-gray-700">
                  Control who can see your projects and their details
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/settings/privacy">Manage Privacy Settings</Link>
              </Button>
            </div>
          </div>

          {/* Information Sharing */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information to third parties. We may share information in these limited circumstances:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span><strong>With Other Users:</strong> Based on your privacy settings, other users may see your profile, sessions, and activity</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span><strong>Service Providers:</strong> We use Firebase (Google) for authentication and data storage, subject to their privacy policies</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect rights and safety</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span><strong>Business Transfers:</strong> In the event of a merger or acquisition, user data may be transferred to the new entity</span>
              </li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <Lock className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
            </div>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Encrypted data transmission using HTTPS/TLS</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Secure password hashing and authentication via Firebase Auth</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Regular security audits and updates</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Firestore security rules to prevent unauthorized data access</span>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect
              your data, we cannot guarantee absolute security.
            </p>
          </div>

          {/* Your Rights */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Access and download your personal data</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Correct inaccurate or incomplete information</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Delete your account and associated data</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Opt out of marketing communications</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Object to certain data processing activities</span>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@ambira.app" className="text-[#007AFF] hover:underline">
                privacy@ambira.app
              </a>
            </p>
          </div>

          {/* Data Retention */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services.
              When you delete your account, we will delete or anonymize your personal information within 30 days,
              except where we are required to retain it for legal compliance or legitimate business purposes.
            </p>
          </div>

          {/* Children's Privacy */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              Ambira is not intended for users under the age of 13. We do not knowingly collect personal information
              from children under 13. If you believe we have collected information from a child under 13, please
              contact us immediately so we can delete it.
            </p>
          </div>

          {/* International Users */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Users</h2>
            <p className="text-gray-700">
              Ambira is hosted in the United States. If you access the platform from outside the US, your information
              may be transferred to, stored, and processed in the US. By using Ambira, you consent to this transfer.
            </p>
          </div>

          {/* Changes to Privacy Policy */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting the new policy on this page and updating the "Last updated" date. We encourage you to review
              this policy periodically.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-[#007AFF] to-[#0051D5] text-white rounded-lg p-8">
            <div className="flex items-center mb-4">
              <Mail className="w-6 h-6 mr-2" />
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </div>
            <p className="mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@ambira.app" className="underline hover:text-gray-200">
                  privacy@ambira.app
                </a>
              </p>
              <p>
                <strong>General Inquiries:</strong>{' '}
                <a href="mailto:hello@ambira.app" className="underline hover:text-gray-200">
                  hello@ambira.app
                </a>
              </p>
            </div>
            <div className="mt-6">
              <Button asChild variant="secondary">
                <Link href="/contact">Contact Form</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
