'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectedRef = useRef(false)

  useEffect(() => {
    // Only redirect if auth is fully loaded and user is not authenticated
    if (!isLoading && !isAuthenticated && !redirectedRef.current) {
      // Mark that we've already triggered a redirect to prevent duplicate redirects
      redirectedRef.current = true

      // Store the intended destination for post-login redirect
      const redirectTo = pathname !== '/' ? pathname : '/'
      router.push(`/?redirect=${encodeURIComponent(redirectTo)}`)
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Show loading spinner while checking authentication (first load)
  if (isLoading) {
    return (
      <main role="main" className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  // If not authenticated AND we've initiated redirect, show minimal content
  // This prevents child components from initializing and making unnecessary requests
  if (!isAuthenticated) {
    return (
      <main role="main" className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </main>
    )
  }

  // If authenticated, render the protected content
  return <>{children}</>
}

export default ProtectedRoute
export { ProtectedRoute }
