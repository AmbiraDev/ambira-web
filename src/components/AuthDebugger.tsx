'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';

/**
 * Debug component to help diagnose mobile OAuth issues
 * Add this temporarily to your app to see what's happening
 *
 * Usage: Add <AuthDebugger /> to your landing page or app
 */
export const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    userAgent: '',
    currentUrl: '',
    authDomain: '',
    isMobile: false,
    isSafari: false,
    screenSize: '',
    platform: '',
    errors: [] as string[],
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

    setDebugInfo({
      userAgent,
      currentUrl: window.location.href,
      authDomain: auth.config.authDomain || 'Not configured',
      isMobile,
      isSafari,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform,
      errors: [],
    });

    // Listen for auth errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, args.join(' ')],
      }));
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const copyToClipboard = () => {
    const debugText = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(debugText);
    alert('Debug info copied to clipboard!');
  };

  // Only show in development or when a special query param is present
  const showDebugger =
    process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' &&
      window.location.search.includes('debug=true'));

  if (!showDebugger) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: '10px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxHeight: '40vh',
        overflow: 'auto',
        zIndex: 9999,
        borderTop: '2px solid #ff0000',
      }}
    >
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <strong>🔧 Auth Debugger</strong>
        <button
          onClick={copyToClipboard}
          style={{
            background: '#0066CC',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '11px',
          }}
        >
          Copy Debug Info
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr',
          gap: '5px',
        }}
      >
        <div>
          <strong>Mobile:</strong>
        </div>
        <div style={{ color: debugInfo.isMobile ? '#00ff00' : '#ff9900' }}>
          {debugInfo.isMobile ? '✓ YES' : '✗ NO'}
        </div>

        <div>
          <strong>Safari:</strong>
        </div>
        <div style={{ color: debugInfo.isSafari ? '#00ff00' : '#ff9900' }}>
          {debugInfo.isSafari ? '✓ YES' : '✗ NO'}
        </div>

        <div>
          <strong>Platform:</strong>
        </div>
        <div>{debugInfo.platform}</div>

        <div>
          <strong>Screen:</strong>
        </div>
        <div>{debugInfo.screenSize}</div>

        <div>
          <strong>Auth Domain:</strong>
        </div>
        <div style={{ wordBreak: 'break-all' }}>{debugInfo.authDomain}</div>

        <div>
          <strong>Current URL:</strong>
        </div>
        <div style={{ wordBreak: 'break-all' }}>{debugInfo.currentUrl}</div>

        <div>
          <strong>User Agent:</strong>
        </div>
        <div style={{ wordBreak: 'break-all', fontSize: '10px' }}>
          {debugInfo.userAgent}
        </div>
      </div>

      {debugInfo.errors.length > 0 && (
        <div
          style={{
            marginTop: '10px',
            borderTop: '1px solid #444',
            paddingTop: '10px',
          }}
        >
          <strong style={{ color: '#ff0000' }}>
            Errors ({debugInfo.errors.length}):
          </strong>
          <div
            style={{ maxHeight: '100px', overflow: 'auto', marginTop: '5px' }}
          >
            {debugInfo.errors.map((error, index) => (
              <div
                key={index}
                style={{
                  color: '#ff9999',
                  marginBottom: '5px',
                  fontSize: '10px',
                }}
              >
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#888' }}>
        Add ?debug=true to URL to show in production
      </div>
    </div>
  );
};

export default AuthDebugger;
