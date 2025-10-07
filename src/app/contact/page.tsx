'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageSquare, HelpCircle, Bug } from 'lucide-react';
import { staticPageStyles } from '@/styles/staticPages';

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  privacyAgree?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general',
  });
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string | boolean): string | undefined => {
    switch (name) {
      case 'name':
        if (typeof value === 'string' && !value.trim()) {
          return 'Name is required';
        }
        if (typeof value === 'string' && value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        break;
      case 'email':
        if (typeof value === 'string' && !value.trim()) {
          return 'Email is required';
        }
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'subject':
        if (typeof value === 'string' && !value.trim()) {
          return 'Subject is required';
        }
        if (typeof value === 'string' && value.trim().length < 5) {
          return 'Subject must be at least 5 characters';
        }
        break;
      case 'message':
        if (typeof value === 'string' && !value.trim()) {
          return 'Message is required';
        }
        if (typeof value === 'string' && value.trim().length < 10) {
          return 'Message must be at least 10 characters';
        }
        break;
      case 'privacyAgree':
        if (typeof value === 'boolean' && !value) {
          return 'You must agree to the Privacy Policy to continue';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.name = validateField('name', formData.name);
    newErrors.email = validateField('email', formData.email);
    newErrors.subject = validateField('subject', formData.subject);
    newErrors.message = validateField('message', formData.message);
    newErrors.privacyAgree = validateField('privacyAgree', privacyAgree);

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName));
    const value = fieldName === 'privacyAgree' ? privacyAgree : formData[fieldName as keyof typeof formData];
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (touched.has(fieldName)) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched(new Set(['name', 'email', 'subject', 'message', 'privacyAgree']));

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual form submission to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      alert('Thank you for contacting us! We\'ll get back to you soon.');

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general',
      });
      setPrivacyAgree(false);
      setErrors({});
      setTouched(new Set());
    } catch (error) {
      alert('Sorry, there was an error submitting your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className={`${staticPageStyles.typography.pageTitle} mb-2`}>Contact Us</h1>
          <p className={staticPageStyles.typography.pageDescription}>
            Have a question, suggestion, or need support? We're here to help.
          </p>
        </div>

        <div className={`grid md:grid-cols-3 gap-6 ${staticPageStyles.spacing.sectionMargin}`}>
          {/* Contact Methods */}
          <div className={staticPageStyles.containers.card}>
            <div className={`${staticPageStyles.iconBackgrounds.blue} rounded-lg p-3 w-fit mb-4`}>
              <Mail className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.white}`} />
            </div>
            <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-2`}>Email Support</h3>
            <p className={`${staticPageStyles.typography.smallText} mb-3`}>
              Get help from our support team
            </p>
            <a
              href="mailto:support@ambira.app"
              className={`${staticPageStyles.links.email} ${staticPageStyles.typography.smallText} font-medium`}
            >
              support@ambira.app
            </a>
          </div>

          <div className={staticPageStyles.containers.card}>
            <div className={`${staticPageStyles.iconBackgrounds.green} rounded-lg p-3 w-fit mb-4`}>
              <MessageSquare className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.white}`} />
            </div>
            <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-2`}>General Inquiries</h3>
            <p className={`${staticPageStyles.typography.smallText} mb-3`}>
              For partnerships and press
            </p>
            <a
              href="mailto:hello@ambira.app"
              className={`${staticPageStyles.links.email} ${staticPageStyles.typography.smallText} font-medium`}
            >
              hello@ambira.app
            </a>
          </div>

          <div className={staticPageStyles.containers.card}>
            <div className={`${staticPageStyles.iconBackgrounds.orange} rounded-lg p-3 w-fit mb-4`}>
              <Bug className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.white}`} />
            </div>
            <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-2`}>Report a Bug</h3>
            <p className={`${staticPageStyles.typography.smallText} mb-3`}>
              Help us improve Ambira
            </p>
            <a
              href="mailto:bugs@ambira.app"
              className={`${staticPageStyles.links.email} ${staticPageStyles.typography.smallText} font-medium`}
            >
              bugs@ambira.app
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className={`${staticPageStyles.containers.card} ${staticPageStyles.spacing.sectionMargin}`}>
          <div className="flex items-center mb-6">
            <HelpCircle className={`${staticPageStyles.icons.medium} ${staticPageStyles.icons.primary} mr-2`} />
            <h2 className={staticPageStyles.typography.sectionHeading}>Send us a Message</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    errors.name && touched.has('name')
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-[#007AFF]'
                  }`}
                  placeholder="Your name"
                  aria-invalid={errors.name && touched.has('name') ? 'true' : 'false'}
                  aria-describedby={errors.name && touched.has('name') ? 'name-error' : undefined}
                />
                {errors.name && touched.has('name') && (
                  <p id="name-error" className="mt-1 text-sm text-red-600">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    errors.email && touched.has('email')
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-[#007AFF]'
                  }`}
                  placeholder="your@email.com"
                  aria-invalid={errors.email && touched.has('email') ? 'true' : 'false'}
                  aria-describedby={errors.email && touched.has('email') ? 'email-error' : undefined}
                />
                {errors.email && touched.has('email') && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Inquiry Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
              >
                <option value="general">General Question</option>
                <option value="support">Technical Support</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="account">Account Issue</option>
                <option value="privacy">Privacy Concern</option>
                <option value="partnership">Partnership/Business</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                onBlur={() => handleBlur('subject')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  errors.subject && touched.has('subject')
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-[#007AFF]'
                }`}
                placeholder="Brief description of your inquiry"
                aria-invalid={errors.subject && touched.has('subject') ? 'true' : 'false'}
                aria-describedby={errors.subject && touched.has('subject') ? 'subject-error' : undefined}
              />
              {errors.subject && touched.has('subject') && (
                <p id="subject-error" className="mt-1 text-sm text-red-600">
                  {errors.subject}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                onBlur={() => handleBlur('message')}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none transition-colors ${
                  errors.message && touched.has('message')
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-[#007AFF]'
                }`}
                placeholder="Tell us more about your question or concern..."
                aria-invalid={errors.message && touched.has('message') ? 'true' : 'false'}
                aria-describedby={errors.message && touched.has('message') ? 'message-error' : undefined}
              />
              {errors.message && touched.has('message') && (
                <p id="message-error" className="mt-1 text-sm text-red-600">
                  {errors.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacy-agree"
                  checked={privacyAgree}
                  onChange={(e) => {
                    setPrivacyAgree(e.target.checked);
                    if (touched.has('privacyAgree')) {
                      const error = validateField('privacyAgree', e.target.checked);
                      setErrors(prev => ({ ...prev, privacyAgree: error }));
                    }
                  }}
                  onBlur={() => handleBlur('privacyAgree')}
                  className={`mt-1 mr-2 h-4 w-4 rounded border-gray-300 text-[#007AFF] focus:ring-[#007AFF] ${
                    errors.privacyAgree && touched.has('privacyAgree') ? 'border-red-500' : ''
                  }`}
                  aria-invalid={errors.privacyAgree && touched.has('privacyAgree') ? 'true' : 'false'}
                  aria-describedby={errors.privacyAgree && touched.has('privacyAgree') ? 'privacy-error' : undefined}
                />
                <label htmlFor="privacy-agree" className={staticPageStyles.typography.smallText}>
                  I agree to the{' '}
                  <Link href="/privacy" className={staticPageStyles.links.inline}>
                    Privacy Policy
                  </Link>{' '}
                  and understand my data will be processed to respond to this inquiry.{' '}
                  <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.privacyAgree && touched.has('privacyAgree') && (
                <p id="privacy-error" className="mt-1 text-sm text-red-600">
                  {errors.privacyAgree}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>

        {/* Quick Links */}
        <div className={staticPageStyles.containers.card}>
          <h3 className={`${staticPageStyles.typography.subsectionHeading} mb-4`}>Before you contact us...</h3>
          <p className={`${staticPageStyles.typography.bodyText} mb-4`}>
            You might find the answer to your question in our help resources:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/help">Help Center</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/about">About Ambira</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
