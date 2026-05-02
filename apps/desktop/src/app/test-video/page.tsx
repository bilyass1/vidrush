'use client'

import QuickVideoTest from '@/components/QuickVideoTest'

export default function TestVideoPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Generation Test</h1>
        <QuickVideoTest />
      </div>
    </div>
  )
}
