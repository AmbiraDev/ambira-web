'use client';

import Header from './HeaderComponent';
import BottomNavigation from './BottomNavigation';
import { LeftSidebar, RightSidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  showSidebars?: boolean;
}

function Layout({ children, showSidebars = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {showSidebars ? (
            <div className="flex gap-8">
              <LeftSidebar />
              <div className="flex-1 max-w-2xl mx-auto">
                {children}
              </div>
              <RightSidebar />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          )}
        </div>
      </main>

      {/* Bottom padding for mobile navigation */}
      <div className="h-16 md:hidden" />
      
      <BottomNavigation />
    </div>
  );
}

export default Layout;
