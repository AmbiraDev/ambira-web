'use client';

import React, { useState } from 'react';
import { SearchUsers, SearchUsersModal } from '@/components/SearchUsers';
import { SuggestedUsers } from '@/components/SuggestedUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Users</h1>
          <p className="text-muted-foreground">
            Find and connect with other productivity enthusiasts
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-card-background rounded-lg border border-border p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Search Users</h2>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-base"
              />
            </div>
            <Button 
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Advanced Search
            </Button>
          </div>

          {searchQuery && (
            <div className="mt-6">
              <SearchUsers
                query={searchQuery}
                variant="compact"
                showResults={true}
                maxResults={10}
              />
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Suggested Users */}
          <div className="lg:col-span-2">
            <SuggestedUsers
              limit={12}
              showHeader={true}
              variant="compact"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-card-background rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSearchModal(true)}
                  className="w-full justify-start"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Users
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-start"
                >
                  <Link href="/groups">
                    <Users className="w-4 h-4 mr-2" />
                    Browse Groups
                  </Link>
                </Button>
              </div>
            </div>

            {/* Popular Categories */}
            <div className="bg-card-background rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Popular Categories
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Developers', count: '2.3k', icon: '💻' },
                  { name: 'Students', count: '1.8k', icon: '🎓' },
                  { name: 'Designers', count: '1.2k', icon: '🎨' },
                  { name: 'Writers', count: '890', icon: '✍️' },
                  { name: 'Researchers', count: '650', icon: '🔬' },
                ].map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-card-background rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Tips</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Follow users with similar interests to see their activity in your feed</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Join groups to find users working on similar projects</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Complete your profile to get better suggestions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchUsersModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Search Users"
      />
    </div>
  );
}
