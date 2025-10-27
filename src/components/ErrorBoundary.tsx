'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components, logs them to Sentry,
 * and displays a fallback UI. Follows React Error Boundary pattern
 * with recovery strategies.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging (allowed in error boundary)
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Capture error with Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      level: 'error',
    });

    // Store error info and event ID in state
    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state to attempt recovery
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // Full page reload as fallback recovery
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl border border-red-200 shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Error Message */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error while loading this page.
                Please try again.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-mono text-gray-800 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer font-medium mb-1">
                        Component Stack
                      </summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0066CC] text-white px-6 py-3 rounded-lg hover:bg-[#0051D5] transition-colors font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
                  aria-label="Try again"
                >
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-6 py-3 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
                  aria-label="Reload page"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
