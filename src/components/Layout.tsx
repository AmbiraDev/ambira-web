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
    <div className="min-h-screen bg-white">
      {/* Header - hidden on mobile and desktop when sidebars are shown */}
      <div className={showSidebars ? 'hidden md:hidden' : 'hidden md:block'}>
        <Header />
      </div>

      <main className={showSidebars ? '' : 'md:pt-16'}>
        {showSidebars ? (
          <div className="flex min-h-screen">
            {/* Left sidebar - Fixed position */}
            <LeftSidebar />

            {/* Main Content Area - Offset by sidebar width */}
            <div className="flex-1 lg:ml-[256px] flex justify-center w-full">
              <div className="flex gap-8 w-full max-w-[1056px] px-4 py-8">
                {/* Center Content */}
                <div className="flex-1 min-w-0">{children}</div>

                {/* Right sidebar - hidden on mobile/tablet */}
                <div className="hidden xl:block">
                  <RightSidebar />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto md:px-4 md:py-8">
            <div className="max-w-4xl mx-auto px-4 py-4 md:px-0">{children}</div>
          </div>
        )}
      </main>

      {/* Footer - hidden on mobile */}
      {!showSidebars && <Footer />}

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  )
}

export default Layout
