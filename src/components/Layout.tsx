'use client'

import Header from './HeaderComponent'
import BottomNavigation from './BottomNavigation'
import Footer from './Footer'
import { LeftSidebar, RightSidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  showSidebars?: boolean
}

function Layout({ children, showSidebars = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header - hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      <main className="md:pt-16">
        <div className="container mx-auto md:px-4 md:py-8">
          {showSidebars ? (
            <div className="md:flex gap-8">
              {/* Left sidebar - hidden on mobile */}
              <div className="hidden md:block">
                <LeftSidebar />
              </div>
              <div className="flex-1 max-w-2xl md:mx-auto px-4 py-4 md:px-0">{children}</div>
              {/* Right sidebar - hidden on mobile */}
              <div className="hidden md:block">
                <RightSidebar />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-4 md:px-0">{children}</div>
          )}
        </div>
      </main>

      {/* Footer - hidden on mobile */}
      <Footer />

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  )
}

export default Layout
