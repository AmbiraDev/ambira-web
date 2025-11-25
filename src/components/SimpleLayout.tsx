'use client'

import Link from 'next/link'

interface SimpleLayoutProps {
  children: React.ReactNode
}

export default function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Ambira</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link
                href="/activities"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Activities
              </Link>
              <Link href="/groups" className="text-gray-700 hover:text-blue-600 transition-colors">
                Groups
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
