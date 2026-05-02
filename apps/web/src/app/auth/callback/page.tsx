'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      setError('Missing tokens. Please try signing in again.')
      return
    }

    localStorage.setItem('jwt', accessToken)
    localStorage.setItem('jwt_refresh', refreshToken)

    router.replace('/dashboard')
  }, [params, router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/login" className="text-purple-400 hover:underline">Back to login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
