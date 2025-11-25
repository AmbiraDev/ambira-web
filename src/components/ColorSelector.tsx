'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as Icons from 'lucide-react'

export interface ColorOption {
  name: string
  hex: string
  label: string
}

interface ColorSelectorProps {
  colors: ColorOption[]
  value: string
  onChange: (colorName: string) => void
  className?: string
}

export function ColorSelector({ colors, value, onChange, className = '' }: ColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Support both name and hex value
  // Ensure selectedColor is always defined with a fallback
  const DEFAULT_COLOR: ColorOption = {
    name: 'gray',
    hex: '#6B7280',
    label: 'Gray',
  }
  const selectedColor =
    colors.find((c) => c.name === value || c.hex === value) || colors[0] || DEFAULT_COLOR

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleColorSelect = (colorName: string) => {
    onChange(colorName)
    setIsOpen(false)
  }

  return (
    <div className={`relative max-w-sm ${className}`} ref={containerRef}>
      {/* Selected Color Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none bg-white cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
            style={{ backgroundColor: selectedColor.hex }}
          />
          <span className="text-gray-900">{selectedColor.label}</span>
        </div>
        <Icons.ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown with Color Grid */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {colors.map((colorData) => {
              const isSelected = colorData.name === value || colorData.hex === value

              return (
                <button
                  key={colorData.name}
                  type="button"
                  onClick={() => handleColorSelect(colorData.name)}
                  className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                    isSelected
                      ? 'border-[#0066CC] shadow-md'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  title={colorData.label}
                >
                  <div
                    className="w-full h-full rounded-md shadow-sm"
                    style={{ backgroundColor: colorData.hex }}
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
