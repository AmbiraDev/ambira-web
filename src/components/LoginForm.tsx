'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginCredentials } from '@/types'

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear field-specific error when user starts typing
    if (errors[name as keyof LoginCredentials]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await login(formData)

      // Check for invite context in sessionStorage
      const inviteContextStr =
        typeof window !== 'undefined' ? sessionStorage.getItem('inviteContext') : null

      if (inviteContextStr) {
        try {
          const inviteContext = JSON.parse(inviteContextStr)

          // Clear the invite context
          sessionStorage.removeItem('inviteContext')

          // Redirect based on invite type
          if (inviteContext.type === 'group' && inviteContext.groupId) {
            router.push(`/invite/group/${inviteContext.groupId}`)
            return
          }
        } catch (_error) {}
      }

      // Get redirect URL from query params
      const redirectTo = searchParams.get('redirect') || '/'
      router.push(redirectTo)
    } catch (_error) {
      setSubmitError(_error instanceof Error ? _error.message : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {submitError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#3C3C3C] mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 rounded-xl text-[#3C3C3C] font-semibold focus:border-[#58CC02] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] ${
              errors.email ? 'border-red-300' : 'border-[#E5E5E5]'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#3C3C3C] mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 rounded-xl text-[#3C3C3C] font-semibold focus:border-[#58CC02] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] ${
              errors.password ? 'border-red-300' : 'border-[#E5E5E5]'
            }`}
            placeholder="Enter your password"
          />
          {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-[#777777]">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="font-bold text-[#58CC02] hover:text-[#45A000] transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </form>
  )
}
