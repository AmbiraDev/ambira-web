'use client'

import React from 'react'

interface TimePickerModalProps {
  customStartTime: Date | null
  onCustomStartTimeChange: (time: Date | null) => void
  onClose: () => void
}

export function TimePickerModal({
  customStartTime,
  onCustomStartTimeChange,
  onClose,
}: TimePickerModalProps) {
  const handleCancel = () => {
    onCustomStartTimeChange(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Start From Past Time</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set when you actually started working. Your session will begin from that time.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
              type="datetime-local"
              value={
                customStartTime
                  ? new Date(
                      customStartTime.getTime() - customStartTime.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
                  : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                      .toISOString()
                      .slice(0, 16)
              }
              onChange={(e) => {
                if (e.target.value) {
                  onCustomStartTimeChange(new Date(e.target.value))
                } else {
                  onCustomStartTimeChange(null)
                }
              }}
              max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base"
            />
          </div>

          {customStartTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Duration:</strong>{' '}
                {Math.floor((new Date().getTime() - customStartTime.getTime()) / 1000 / 60 / 60)}h{' '}
                {Math.floor(((new Date().getTime() - customStartTime.getTime()) / 1000 / 60) % 60)}m
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#0066CC] text-white rounded-xl hover:bg-[#0051D5] transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
