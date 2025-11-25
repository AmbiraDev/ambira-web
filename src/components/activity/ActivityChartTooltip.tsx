'use client'

import React from 'react'

interface TooltipPayload {
  color: string
  name: string
  value: number
}

interface ActivityChartTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

export function ActivityChartTooltip({ active, payload, label }: ActivityChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}</span>: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}
