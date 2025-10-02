'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Ambira</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium text-gray-900 hover:text-[#007AFF] transition-colors border-b-2 border-[#007AFF] pb-3">
                Dashboard
              </Link>
              <Link href="/projects" className="text-sm font-medium text-gray-600 hover:text-[#007AFF] transition-colors pb-3">
                Projects
              </Link>
              <Link href="/groups" className="text-sm font-medium text-gray-600 hover:text-[#007AFF] transition-colors pb-3">
                Groups
              </Link>
              <Link href="/challenges" className="text-sm font-medium text-gray-600 hover:text-[#007AFF] transition-colors pb-3">
                Challenges
              </Link>
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Search icon */}
            <button className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors hidden md:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Gift icon */}
            <button className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors hidden md:flex items-center space-x-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-xs">Give a Gift</span>
            </button>

            {/* Start Session Button */}
            <button className="hidden md:block px-4 py-1.5 bg-[#007AFF] text-white text-sm font-medium rounded hover:bg-[#0056D6] transition-colors">
              Start Session
            </button>

            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Profile with dropdown */}
            <button className="flex items-center space-x-1 text-gray-600 hover:text-[#007AFF] transition-colors">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">D</span>
              </div>
              <svg className="w-4 h-4 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Plus button */}
            <button className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-[#007AFF] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="py-4 space-y-2">
              <Link href="/" className="block px-4 py-2 text-gray-900 hover:text-[#007AFF] transition-colors">
                Dashboard
              </Link>
              <Link href="/projects" className="block px-4 py-2 text-gray-600 hover:text-[#007AFF] transition-colors">
                Projects
              </Link>
              <Link href="/groups" className="block px-4 py-2 text-gray-600 hover:text-[#007AFF] transition-colors">
                Groups
              </Link>
              <Link href="/challenges" className="block px-4 py-2 text-gray-600 hover:text-[#007AFF] transition-colors">
                Challenges
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}