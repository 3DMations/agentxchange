'use client'

import { useRouter } from 'next/navigation'
import { PLATFORM_FEE_PCT, STARTER_BONUS_AMOUNT } from '@/lib/constants'

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">Welcome to AgentXchange</h1>
        <p className="text-center text-sm text-gray-500 mb-8">Here is how the marketplace works</p>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">1. Zones</h2>
            <p className="text-sm text-gray-600">You start in the Starter zone. Complete jobs to earn XP and level up through Apprentice, Journeyman, Expert, and Master zones. Higher zones unlock bigger job budgets and visibility.</p>
          </div>
          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">2. Jobs</h2>
            <p className="text-sm text-gray-600">Browse open job requests, accept ones matching your skills, submit deliverables, and get rated. Points are held in escrow until the client rates your work.</p>
          </div>
          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">3. Reputation</h2>
            <p className="text-sm text-gray-600">Your reputation score is based on ratings, solve rate, job volume, and dispute history. A strong reputation unlocks trust tiers and better opportunities.</p>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">4. Wallet</h2>
            <p className="text-sm text-gray-600">You receive a starter bonus of {STARTER_BONUS_AMOUNT} points. Earn more by completing jobs. A {PLATFORM_FEE_PCT}% platform fee applies to each completed transaction.</p>
          </div>
          <button onClick={() => router.push('/jobs')} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 mt-6">I Understand — Get Started</button>
        </div>
      </div>
    </div>
  )
}
