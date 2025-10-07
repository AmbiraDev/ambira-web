'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertCircle, Scale, Users, Shield, Ban } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <FileText className="w-8 h-8 text-[#007AFF] mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            Welcome to Ambira! These Terms of Service ("Terms") govern your access to and use of the Ambira
            platform, website, and services (collectively, the "Service"). By accessing or using the Service,
            you agree to be bound by these Terms.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Please read these Terms carefully. If you do not agree to these Terms, you may not access or use
            the Service.
          </p>
        </div>

        {/* Key Points */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="bg-[#007AFF] rounded-lg p-3 w-fit mx-auto mb-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">13+ Only</h3>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="bg-[#34C759] rounded-lg p-3 w-fit mx-auto mb-3">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Respectful Community</h3>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="bg-[#FF9500] rounded-lg p-3 w-fit mx-auto mb-3">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Your Content Rights</h3>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Account Terms */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Account Terms</h2>
            </div>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Eligibility:</strong> You must be at least 13 years old to use Ambira. By using the Service,
                you represent that you meet this age requirement.
              </p>
              <p>
                <strong>Account Security:</strong> You are responsible for maintaining the security of your account
                and password. Ambira cannot and will not be liable for any loss or damage from your failure to
                comply with this security obligation.
              </p>
              <p>
                <strong>Accurate Information:</strong> You must provide accurate and complete information when
                creating your account and keep it up to date.
              </p>
              <p>
                <strong>One Account Per Person:</strong> You may not maintain more than one account without
                our express permission.
              </p>
              <p>
                <strong>Account Responsibility:</strong> You are responsible for all activity that occurs under
                your account, whether or not you authorized that activity.
              </p>
            </div>
          </div>

          {/* Acceptable Use */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Acceptable Use</h2>
            </div>
            <p className="text-gray-700 mb-4">
              You agree to use the Service in a lawful and respectful manner. You may not:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Violate any applicable laws or regulations</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Impersonate any person or entity or falsely state or misrepresent your affiliation</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Upload viruses, malware, or any other malicious code</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Attempt to gain unauthorized access to the Service or related systems</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Use the Service to spam, harass, or send unsolicited messages</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Scrape, crawl, or use automated means to access the Service without permission</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Interfere with or disrupt the Service or servers or networks connected to the Service</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Attempt to manipulate metrics, leaderboards, or challenges through fraudulent means</span>
              </li>
            </ul>
          </div>

          {/* Content and Intellectual Property */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <Scale className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Content and Intellectual Property</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Content</h3>
                <p className="text-gray-700 mb-2">
                  You retain all rights to the content you post on Ambira, including work sessions, comments,
                  profile information, and any other materials ("Your Content"). By posting Your Content, you grant
                  Ambira a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute
                  Your Content solely for the purpose of operating and improving the Service.
                </p>
                <p className="text-gray-700">
                  You represent and warrant that you own or have the necessary rights to Your Content and that
                  posting Your Content does not violate any third-party rights or applicable laws.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ambira's Intellectual Property</h3>
                <p className="text-gray-700">
                  The Service and its original content, features, and functionality are owned by Ambira and are
                  protected by international copyright, trademark, patent, trade secret, and other intellectual
                  property laws. You may not copy, modify, distribute, sell, or lease any part of the Service
                  without our express written permission.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Content Moderation</h3>
                <p className="text-gray-700">
                  Ambira reserves the right to remove or modify any content that violates these Terms or that we
                  determine, in our sole discretion, to be inappropriate or harmful. We are not responsible for
                  any content posted by users.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your
              personal information. By using the Service, you agree to our collection and use of information as
              described in the Privacy Policy.
            </p>
            <Button asChild variant="outline">
              <Link href="/privacy">View Privacy Policy</Link>
            </Button>
          </div>

          {/* Termination */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <Ban className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Termination</h2>
            </div>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account and access to the Service at any time,
              with or without notice, for conduct that we believe:
            </p>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Violates these Terms or our policies</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Harms other users, third parties, or Ambira</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Violates applicable laws or regulations</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#007AFF] mr-2 mt-1">•</span>
                <span>Creates legal liability for Ambira</span>
              </li>
            </ul>
            <p className="text-gray-700">
              You may delete your account at any time through your account settings. Upon termination, your right
              to use the Service will immediately cease, but these Terms will continue to apply to any past use
              of the Service.
            </p>
          </div>

          {/* Disclaimers and Limitations of Liability */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-[#007AFF] mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Disclaimers and Limitations of Liability</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Service "As Is"</h3>
                <p className="text-gray-700">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
                  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                  PARTICULAR PURPOSE, AND NON-INFRINGEMENT. AMBIRA DOES NOT WARRANT THAT THE SERVICE WILL BE
                  UNINTERRUPTED, ERROR-FREE, OR SECURE.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                <p className="text-gray-700">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, AMBIRA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
                  DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING
                  FROM: (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR
                  CONTENT OF ANY THIRD PARTY ON THE SERVICE; OR (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR
                  TRANSMISSIONS OR CONTENT.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Indemnification</h3>
                <p className="text-gray-700">
                  You agree to indemnify, defend, and hold harmless Ambira and its officers, directors, employees,
                  and agents from any claims, liabilities, damages, losses, and expenses, including reasonable
                  attorney's fees, arising out of or in any way connected with your access to or use of the Service,
                  Your Content, or your violation of these Terms.
                </p>
              </div>
            </div>
          </div>

          {/* Changes to Terms */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to These Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. If we make material changes, we will notify
              you by email or through a notice on the Service prior to the changes taking effect. Your continued
              use of the Service after the changes become effective constitutes your acceptance of the new Terms.
            </p>
          </div>

          {/* Dispute Resolution */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Informal Resolution:</strong> If you have a dispute with Ambira, please contact us first
                at hello@ambira.app and attempt to resolve the dispute informally.
              </p>
              <p>
                <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with
                the laws of the United States, without regard to its conflict of law provisions.
              </p>
              <p>
                <strong>Arbitration:</strong> Any disputes arising out of or relating to these Terms or the Service
                shall be resolved through binding arbitration in accordance with the rules of the American Arbitration
                Association, rather than in court, except that you may assert claims in small claims court if your
                claims qualify.
              </p>
            </div>
          </div>

          {/* General */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">General</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and
                Ambira regarding the Service and supersede all prior agreements.
              </p>
              <p>
                <strong>Severability:</strong> If any provision of these Terms is held to be invalid or unenforceable,
                that provision will be removed and the remaining provisions will remain in full force and effect.
              </p>
              <p>
                <strong>Waiver:</strong> No waiver of any term of these Terms shall be deemed a further or continuing
                waiver of such term or any other term.
              </p>
              <p>
                <strong>Assignment:</strong> You may not assign or transfer these Terms or your rights under them
                without our prior written consent. Ambira may assign these Terms without restriction.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-[#007AFF] to-[#0051D5] text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
            <p className="mb-4">
              If you have any questions or concerns about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 mb-6">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@ambira.app" className="underline hover:text-gray-200">
                  hello@ambira.app
                </a>
              </p>
              <p>
                <strong>Legal Inquiries:</strong>{' '}
                <a href="mailto:legal@ambira.app" className="underline hover:text-gray-200">
                  legal@ambira.app
                </a>
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
