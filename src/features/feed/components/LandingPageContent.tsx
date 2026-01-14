/**
 * Landing Page Content Component (Clean Architecture)
 *
 * This component handles the public landing page presentation.
 * Extracted from the main route file for better separation of concerns.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import Header from '@/components/HeaderComponent'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Clock, Target, Zap, Users, Trophy, TrendingUp } from 'lucide-react'

export function LandingPageContent() {
  const [isHeroVisible, setIsHeroVisible] = useState(true)
  const heroRef = useRef<HTMLElement>(null)

  // Use Intersection Observer to track hero section visibility
  useEffect(() => {
    const heroElement = heroRef.current
    if (!heroElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hero is visible if it's intersecting the viewport
        setIsHeroVisible(entry.isIntersecting)
      },
      {
        // Trigger when hero is less than 10% visible
        threshold: 0.1,
      }
    )

    observer.observe(heroElement)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header isLandingPage={true} showHeaderAuth={!isHeroVisible} />

      <main role="main">
        {/* Hero Section */}
        <section ref={heroRef} id="hero-section" className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#3C3C3C] mb-6">
              Make productivity <span className="text-[#58CC02]">social.</span>
            </h1>
            <p className="text-xl text-[#777777] mb-10 font-semibold">
              Studying shouldn't be done alone. Join your friends, share your progress, and achieve
              better results together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth"
                className="inline-block px-8 py-4 bg-[#58CC02] text-white font-bold rounded-2xl hover:brightness-105 transition-all text-lg border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
              >
                Sign up free
              </Link>
              <Link
                href="/auth"
                className="inline-block px-8 py-4 bg-[#1CB0F6] text-white font-bold rounded-2xl hover:brightness-105 transition-all text-lg border-2 border-b-4 border-[#0088CC] active:border-b-2 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-4 py-12 space-y-16 md:space-y-24">
          {/* Feature 1: Share Your Sessions */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
            <div className="flex-1 space-y-4 md:pt-8 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3C3C3C]">
                Share Your Work
              </h2>
              <p className="text-lg md:text-xl text-[#777777] font-semibold">
                Track your study and work sessions, then share them with friends. Get encouragement
                and support as you make progress on your goals.
              </p>
            </div>
            <div className="flex-1">
              {/* Session Card Preview - Light Mode */}
              <div className="bg-white rounded-2xl p-6 border-2 border-[#E5E5E5] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58CC02] to-[#45A000] p-0.5">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <span className="text-[#3C3C3C] font-bold text-sm">JD</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[#3C3C3C] font-bold">Jane Doe</p>
                    <p className="text-[#AFAFAF] text-sm">Just now</p>
                  </div>
                </div>
                <h3 className="text-[#3C3C3C] text-xl font-extrabold mb-4">
                  Morning Focus Session
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F7F7F7] rounded-xl p-3 border border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[#3C3C3C] font-extrabold">2h 30m</span>
                    </div>
                  </div>
                  <div className="bg-[#F7F7F7] rounded-xl p-3 border border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[#3C3C3C] font-extrabold">Coding</span>
                    </div>
                  </div>
                  <div className="bg-[#F7F7F7] rounded-xl p-3 border border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#CE82FF] to-[#A855F7] rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" fill="white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[#3C3C3C] font-extrabold">+250 XP</span>
                    </div>
                  </div>
                  <div className="bg-[#F7F7F7] rounded-xl p-3 border border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FF4444] to-[#CC0000] rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" fill="white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[#3C3C3C] font-extrabold font-mono">▰▰▰▰▱</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Join Groups */}
          <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-12">
            <div className="flex-1 space-y-4 md:pt-8 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3C3C3C]">
                Study With Groups
              </h2>
              <p className="text-lg md:text-xl text-[#777777] font-semibold">
                Better results happen with groups. Join communities of students and professionals
                working toward similar goals, and stay accountable together.
              </p>
            </div>
            <div className="flex-1">
              {/* Group Card Preview - Light Mode */}
              <div className="bg-white rounded-2xl p-6 border-2 border-[#E5E5E5] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#CE82FF] to-[#A855F7] rounded-xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[#3C3C3C] text-xl font-extrabold">Study Squad</h3>
                    <p className="text-[#AFAFAF] text-sm font-semibold">1,234 members</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Alex', time: '45h 20m', rank: 1 },
                    { name: 'Sarah', time: '42h 15m', rank: 2 },
                    { name: 'Mike', time: '38h 45m', rank: 3 },
                  ].map((member) => (
                    <div
                      key={member.rank}
                      className="flex items-center gap-3 bg-[#F7F7F7] rounded-xl p-3 border border-[#E5E5E5]"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD900] to-[#FFAA00] flex items-center justify-center">
                        <span className="text-[#1a1a1a] font-extrabold text-sm">{member.rank}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58CC02] to-[#45A000] p-0.5">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                          <span className="text-[#3C3C3C] font-bold text-xs">{member.name[0]}</span>
                        </div>
                      </div>
                      <span className="text-[#3C3C3C] font-bold flex-1">{member.name}</span>
                      <span className="text-[#777777] font-extrabold">{member.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Analytics */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
            <div className="flex-1 space-y-4 md:pt-8 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3C3C3C]">
                Understand Your Habits
              </h2>
              <p className="text-lg md:text-xl text-[#777777] font-semibold">
                See detailed insights into your productivity patterns. Track your progress over time
                and discover when you work best.
              </p>
            </div>
            <div className="flex-1">
              {/* Stats Card Preview - Light Mode */}
              <div className="bg-white rounded-2xl p-6 border-2 border-[#E5E5E5] shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-xl flex items-center justify-center">
                        <Clock className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold text-[#3C3C3C]">127h</div>
                        <div className="text-sm font-semibold text-[#777777]">Total Time</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-xl flex items-center justify-center">
                        <Target className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold text-[#3C3C3C]">48</div>
                        <div className="text-sm font-semibold text-[#777777]">Sessions</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FF9600] to-[#FF6B00] rounded-xl flex items-center justify-center">
                        <Zap className="w-7 h-7 text-white" fill="white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold text-[#3C3C3C]">21</div>
                        <div className="text-sm font-semibold text-[#777777]">Day Streak</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#CE82FF] to-[#A855F7] rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold text-[#3C3C3C]">+24%</div>
                        <div className="text-sm font-semibold text-[#777777]">This Week</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#3C3C3C] mb-6">
            Ready to focus together?
          </h2>
          <Link
            href="/auth"
            className="inline-block px-8 py-4 bg-[#58CC02] text-white font-bold rounded-2xl hover:brightness-105 transition-all text-lg border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
          >
            Start Now
          </Link>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
