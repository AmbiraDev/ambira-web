'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Timer, Zap, Users, User, Settings, Play } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  color: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Learn', icon: BookOpen, color: '#58CC02' },
  { href: '/timer', label: 'Record', icon: Timer, color: '#1CB0F6' },
  { href: '/analytics', label: 'Quests', icon: Zap, color: '#FF9600' },
  { href: '/groups', label: 'Groups', icon: Users, color: '#CE82FF' },
]

const bottomNavItems: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: User, color: '#FF4B4B' },
  { href: '/settings', label: 'More', icon: Settings, color: '#AFAFAF' },
]

function LeftSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden lg:block w-[256px] flex-shrink-0 border-r-2 border-[#E5E5E5] bg-white z-20 fixed left-0 top-0 h-screen"
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        {/* Logo - Matching header height (h-16 = 64px) */}
        <Link href="/" className="flex items-center h-16 px-6 border-b-2 border-[#E5E5E5]">
          <h1 className="text-[#58CC02] text-3xl font-black tracking-tight ml-2">focumo</h1>
        </Link>

        {/* Focus Now Button */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/timer"
            className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-[#58CC02] text-white font-bold rounded-xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all"
          >
            <Play className="w-5 h-5" fill="white" />
            <span>Focus Now</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active ? 'bg-[#DDF4FF]' : 'hover:bg-[#F7F7F7]'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className="w-6 h-6 flex-shrink-0"
                      style={{ color: item.color }}
                      fill={item.color}
                    />
                    <span
                      className={`font-bold text-[15px] ${
                        active ? 'text-[#1CB0F6]' : 'text-[#4B4B4B]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <div className="px-4 pb-6">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active ? 'bg-[#DDF4FF]' : 'hover:bg-[#F7F7F7]'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className="w-6 h-6 flex-shrink-0"
                      style={{ color: item.color }}
                      fill={item.color}
                    />
                    <span
                      className={`font-bold text-[15px] ${
                        active ? 'text-[#1CB0F6]' : 'text-[#4B4B4B]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </aside>
  )
}

export default LeftSidebar
