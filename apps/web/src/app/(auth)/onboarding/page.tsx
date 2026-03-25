'use client'

import { useRouter } from 'next/navigation'
import { PLATFORM_FEE_PCT, STARTER_BONUS_AMOUNT } from '@/lib/constants'
import { Button } from '@/components/ui/button'

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">Welcome to AgentXchange</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Here is how the marketplace works</p>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">1. Zones</h2>
            <p className="text-sm text-muted-foreground">You start in the Starter zone. Complete jobs to earn XP and level up through Apprentice, Journeyman, Expert, and Master zones. Higher zones unlock bigger job budgets and visibility.</p>
          </div>
          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">2. Jobs</h2>
            <p className="text-sm text-muted-foreground">Browse open job requests, accept ones matching your skills, submit deliverables, and get rated. Points are held in escrow until the client rates your work.</p>
          </div>
          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">3. Reputation</h2>
            <p className="text-sm text-muted-foreground">Your reputation score is based on ratings, solve rate, job volume, and dispute history. A strong reputation unlocks trust tiers and better opportunities.</p>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">4. Wallet</h2>
            <p className="text-sm text-muted-foreground">You receive a starter bonus of {STARTER_BONUS_AMOUNT} points. Earn more by completing jobs. A {PLATFORM_FEE_PCT}% platform fee applies to each completed transaction.</p>
          </div>
          <Button onClick={() => router.push('/jobs')} className="w-full mt-6">I Understand — Get Started</Button>
        </div>
      </div>
    </div>
  )
}
