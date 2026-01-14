'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration: number = 4000) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newToast: Toast = { id, type, message, duration }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          hideToast(id)
        }, duration)
      }
    },
    [hideToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(toast.id)
    }, 300) // Match animation duration
  }

  // Auto-close animation before removal
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
      }, toast.duration - 300) // Start exit animation 300ms before removal

      return () => clearTimeout(timer)
    }
    return undefined
  }, [toast.duration])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 flex-shrink-0" />
      case 'error':
        return <AlertCircle className="w-6 h-6 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 flex-shrink-0" />
      case 'info':
        return <Info className="w-6 h-6 flex-shrink-0" />
      default:
        return null
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white border-[#58CC02]'
      case 'error':
        return 'bg-white border-[#FF4B4B]'
      case 'warning':
        return 'bg-white border-[#FF9600]'
      case 'info':
        return 'bg-white border-[#1CB0F6]'
      default:
        return 'bg-white border-[#E5E5E5]'
    }
  }

  const getIconColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-[#58CC02]'
      case 'error':
        return 'text-[#FF4B4B]'
      case 'warning':
        return 'text-[#FF9600]'
      case 'info':
        return 'text-[#1CB0F6]'
      default:
        return 'text-[#AFAFAF]'
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        min-w-[320px] max-w-md
        pointer-events-auto
        flex items-start gap-3
        px-5 py-4
        rounded-2xl border-2 border-l-4 shadow-lg
        ${getStyles()}
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
      style={{
        animation: isExiting ? undefined : 'slideInFromRight 0.3s ease-out',
      }}
    >
      <div className={getIconColor()}>{getIcon()}</div>

      <p className="flex-1 text-sm font-bold leading-snug text-[#3C3C3C]">{toast.message}</p>

      <button
        onClick={handleClose}
        className="text-[#AFAFAF] hover:text-[#3C3C3C] transition-colors flex-shrink-0 p-0.5 -mr-1"
        aria-label="Close notification"
      >
        <X className="w-5 h-5" />
      </button>

      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(2rem) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
