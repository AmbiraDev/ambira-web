'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ChevronDown, Search } from 'lucide-react';

export interface IconOption {
  name: string;
  icon: string; // Iconify icon string like "flat-color-icons:briefcase"
  label: string;
}

interface IconSelectorProps {
  icons: IconOption[];
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
}

export function IconSelector({
  icons,
  value,
  onChange,
  className = '',
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Support both name and full icon string
  const selectedIcon =
    icons.find(i => i.name === value || i.icon === value) || icons[0];

  // Filter icons based on search query
  const filteredIcons = icons.filter(icon =>
    icon.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative max-w-sm ${className}`} ref={containerRef}>
      {/* Selected Icon Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none bg-white cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Icon
            icon={selectedIcon ? selectedIcon.icon : 'mdi:circle'}
            width={32}
            height={32}
          />
          <span className="text-gray-900">
            {selectedIcon ? selectedIcon.label : 'Select Icon'}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown with Search and Icon Grid */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden left-0">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search icons..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Icon Grid */}
          <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            <div className="p-4 grid grid-cols-6 gap-2">
              {filteredIcons.length > 0 ? (
                filteredIcons.map(iconData => {
                  const isSelected = iconData.name === value;

                  return (
                    <button
                      key={iconData.name}
                      type="button"
                      onClick={() => handleIconSelect(iconData.name)}
                      className={`p-2 rounded-lg transition-all hover:scale-105 flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-[#0066CC] ring-offset-2 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      title={iconData.label}
                    >
                      <Icon icon={iconData.icon} width={32} height={32} />
                    </button>
                  );
                })
              ) : (
                <div className="col-span-6 text-center py-8 text-gray-500 text-sm">
                  No icons found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
