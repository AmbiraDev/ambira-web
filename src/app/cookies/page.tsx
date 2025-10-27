'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Cookie,
  Shield,
  Eye,
  Settings,
  Globe,
  BarChart,
} from 'lucide-react';

export default function CookiePolicyPage() {
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
            <Cookie className="w-8 h-8 text-[#0066CC] mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
          </div>
          <p className="text-gray-600">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            This Cookie Policy explains how Ambira uses cookies and similar
            technologies to recognize you when you visit our platform. It
            explains what these technologies are, why we use them, and your
            rights to control their use.
          </p>
          <p className="text-gray-700 leading-relaxed">
            By using Ambira, you consent to the use of cookies in accordance
            with this policy.
          </p>
        </div>

        {/* What Are Cookies */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What Are Cookies?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Cookies are small text files that are placed on your device when you
            visit a website. They are widely used to make websites work more
            efficiently and to provide information to the site owners.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Cookies can be "persistent" (remain on your device until deleted or
            expired) or "session" cookies (deleted when you close your browser).
          </p>
        </div>

        {/* Cookie Categories */}
        <div className="space-y-6 mb-8">
          {/* Essential Cookies */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <div className="bg-[#0066CC] rounded-lg p-3 mr-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Essential Cookies
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              These cookies are strictly necessary for the website to function
              and cannot be disabled. They enable core functionality such as
              security, network management, and accessibility.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Cookie Name
                    </th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Purpose
                    </th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">
                      firebase-auth-token
                    </td>
                    <td className="py-3">
                      Maintains user authentication session
                    </td>
                    <td className="py-3">Session</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">session-state</td>
                    <td className="py-3">
                      Preserves active timer and session state
                    </td>
                    <td className="py-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs">csrf-token</td>
                    <td className="py-3">
                      Security token to prevent cross-site attacks
                    </td>
                    <td className="py-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Functional Cookies */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <div className="bg-[#34C759] rounded-lg p-3 mr-3">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Functional Cookies
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              These cookies enable enhanced functionality and personalization,
              such as remembering your preferences and settings.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Cookie Name
                    </th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Purpose
                    </th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">theme-preference</td>
                    <td className="py-3">Remembers your theme selection</td>
                    <td className="py-3">1 year</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">feed-filter</td>
                    <td className="py-3">Saves your feed view preferences</td>
                    <td className="py-3">30 days</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs">
                      notification-settings
                    </td>
                    <td className="py-3">Stores notification preferences</td>
                    <td className="py-3">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <div className="bg-[#FF9500] rounded-lg p-3 mr-3">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Analytics Cookies
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              These cookies help us understand how visitors interact with Ambira
              by collecting and reporting information anonymously. This helps us
              improve the platform.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Cookie Name
                    </th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Purpose
                    </th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">_ga</td>
                    <td className="py-3">
                      Google Analytics - tracks user sessions
                    </td>
                    <td className="py-3">2 years</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">_ga_*</td>
                    <td className="py-3">
                      Google Analytics - maintains session state
                    </td>
                    <td className="py-3">2 years</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs">usage-metrics</td>
                    <td className="py-3">
                      Tracks feature usage for improvements
                    </td>
                    <td className="py-3">90 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center mb-4">
            <Globe className="w-6 h-6 text-[#0066CC] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              Third-Party Cookies
            </h2>
          </div>
          <p className="text-gray-700 mb-4">
            We use services from trusted third-party providers that may set
            their own cookies:
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Firebase (Google)
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                Provides authentication, database, and analytics services.
                Firebase may set cookies for authentication and performance
                monitoring.
              </p>
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0066CC] hover:underline"
              >
                View Firebase Privacy Policy →
              </a>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Google Analytics
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                Helps us understand how users interact with our platform through
                anonymized usage data.
              </p>
              <a
                href="https://policies.google.com/technologies/cookies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0066CC] hover:underline"
              >
                View Google Cookie Policy →
              </a>
            </div>
          </div>
        </div>

        {/* Your Cookie Choices */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center mb-4">
            <Eye className="w-6 h-6 text-[#0066CC] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              Your Cookie Choices
            </h2>
          </div>
          <p className="text-gray-700 mb-4">
            You have several options to manage cookies:
          </p>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-[#0066CC] mr-2 mt-1">•</span>
              <div>
                <strong className="text-gray-900">Browser Settings:</strong>
                <span className="text-gray-700">
                  {' '}
                  Most browsers allow you to refuse or accept cookies through
                  their settings. Note that blocking essential cookies may
                  affect site functionality.
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-[#0066CC] mr-2 mt-1">•</span>
              <div>
                <strong className="text-gray-900">
                  Google Analytics Opt-Out:
                </strong>
                <span className="text-gray-700"> You can install the </span>
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0066CC] hover:underline"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-[#0066CC] mr-2 mt-1">•</span>
              <div>
                <strong className="text-gray-900">Clear Cookies:</strong>
                <span className="text-gray-700">
                  {' '}
                  You can delete cookies already stored on your device through
                  your browser settings. This will sign you out of Ambira.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Browser Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Managing Cookies by Browser
          </h2>
          <p className="text-gray-700 mb-4">
            Here's how to manage cookies in popular browsers:
          </p>
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center">
              <span className="font-semibold min-w-[100px]">Chrome:</span>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066CC] hover:underline text-sm"
              >
                Cookie settings guide →
              </a>
            </div>
            <div className="flex items-center">
              <span className="font-semibold min-w-[100px]">Firefox:</span>
              <a
                href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066CC] hover:underline text-sm"
              >
                Cookie settings guide →
              </a>
            </div>
            <div className="flex items-center">
              <span className="font-semibold min-w-[100px]">Safari:</span>
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066CC] hover:underline text-sm"
              >
                Cookie settings guide →
              </a>
            </div>
            <div className="flex items-center">
              <span className="font-semibold min-w-[100px]">Edge:</span>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066CC] hover:underline text-sm"
              >
                Cookie settings guide →
              </a>
            </div>
          </div>
        </div>

        {/* Updates to Policy */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Changes to This Policy
          </h2>
          <p className="text-gray-700">
            We may update this Cookie Policy from time to time to reflect
            changes in our practices or for other operational, legal, or
            regulatory reasons. Please review this page periodically for
            updates.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-[#0066CC] to-[#0051D5] text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Questions About Cookies?</h2>
          <p className="mb-4">
            If you have questions about our use of cookies or this Cookie
            Policy, please contact us:
          </p>
          <div className="space-y-2 mb-6">
            <p>
              <strong>Email:</strong>{' '}
              <a
                href="mailto:privacy@ambira.app"
                className="underline hover:text-gray-200"
              >
                privacy@ambira.app
              </a>
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <Button asChild variant="secondary">
              <Link href="/privacy">View Privacy Policy</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white text-[#0066CC] hover:bg-gray-100"
            >
              <Link href="/settings/privacy">Privacy Settings</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
