'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function TestAuthContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Authentication Test Page</h1>
        
        <div className="bg-card-background p-6 rounded-lg shadow-sm border border-border space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Authentication Status</h2>
          
          <div className="space-y-2">
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? `${user.name} (${user.email})` : 'None'}</p>
          </div>

          {user && (
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium text-foreground mb-2">User Details:</h3>
              <pre className="text-sm text-muted-foreground overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={logout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Logout
            </button>
            
            <a
              href="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Home
            </a>
          </div>
        </div>

        <div className="mt-8 bg-card-background p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Try accessing this page without being logged in - you should be redirected to login</li>
            <li>Create a new account using the signup form</li>
            <li>Login with your credentials</li>
            <li>Verify you can access this protected page</li>
            <li>Test the logout functionality</li>
            <li>Try accessing a protected route after logout - you should be redirected to login</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function TestAuthPage() {
  return (
    <ProtectedRoute>
      <TestAuthContent />
    </ProtectedRoute>
  );
}
