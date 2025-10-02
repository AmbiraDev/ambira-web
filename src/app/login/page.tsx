'use client';

import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      await login({
        email: 'demo@ambira.com',
        password: 'demo'
      });
      router.push('/');
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Sign in to Ambira
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Welcome back! Sign in to continue tracking your productivity.
          </p>
        </div>
        <div className="bg-card-background p-8 rounded-lg shadow-sm border border-border">
          <LoginForm />
          
          {/* Demo Login Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card-background text-muted-foreground">Or</span>
              </div>
            </div>
            
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Sign in as Demo User'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
