'use client'

import { authFetch } from '@/lib/utils/auth-fetch'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WalletBalance {
  available: number
  escrowed: number
  total: number
}

interface WalletLedgerEntry {
  id: string
  type: string
  amount: number
  balance_after: number
  job_id: string | null
  created_at: string
}

const typeBadgeVariant: Record<string, string> = {
  credit: 'success',
  debit: 'danger',
  escrow_lock: 'warning',
  escrow_release: 'info',
  refund: 'info',
  platform_fee: 'default',
  starter_bonus: 'success',
}

const debitTypes = new Set(['debit', 'escrow_lock', 'platform_fee'])

const CREDITS_TO_DOLLARS = 0.10

function creditsToDollars(credits: number): string {
  return `$${(credits * CREDITS_TO_DOLLARS).toFixed(2)}`
}

function formatAmount(type: string, amount: number): string {
  const prefix = debitTypes.has(type) ? '-' : '+'
  return `${prefix}${amount.toLocaleString()}`
}

function isDebit(type: string): boolean {
  return debitTypes.has(type)
}

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [balanceRes, ledgerRes] = await Promise.all([
          authFetch('/api/v1/wallet/balance'),
          authFetch('/api/v1/wallet/ledger'),
        ])

        if (!balanceRes.ok) {
          throw new Error(`Failed to fetch balance: ${balanceRes.status}`)
        }
        if (!ledgerRes.ok) {
          throw new Error(`Failed to fetch ledger: ${ledgerRes.status}`)
        }

        const balanceJson = await balanceRes.json()
        const ledgerJson = await ledgerRes.json()

        if (balanceJson.error) throw new Error(balanceJson.error)
        if (ledgerJson.error) throw new Error(ledgerJson.error)

        setBalance(balanceJson.data)
        setLedger(ledgerJson.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <>
        <PageHeader title="Account Balance" description="Manage your credits and transactions" />
        <p className="text-sm text-muted-foreground py-16 text-center">Finding the best options for you...</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Account Balance" description="Manage your credits and transactions" />
        <Card>
          <p className="text-sm text-destructive py-8 text-center">Error: {error}</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Credits" description="Manage your credit balance and transactions" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <StatCard
          label="Available"
          value={balance ? `${balance.available.toLocaleString()} credits` : '--'}
          subtext={balance ? `${creditsToDollars(balance.available)} \u00b7 Spendable balance` : 'Spendable balance'}
        />
        <StatCard
          label="Held for Tasks"
          value={balance ? `${balance.escrowed.toLocaleString()} credits` : '--'}
          subtext={balance ? `${creditsToDollars(balance.escrowed)} \u00b7 Reserved for active tasks` : 'Reserved for active tasks'}
        />
        <StatCard
          label="Total"
          value={balance ? `${balance.total.toLocaleString()} credits` : '--'}
          subtext={balance ? `${creditsToDollars(balance.total)} \u00b7 Available + Held` : 'Available + Held'}
        />
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>

        {ledger.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="space-y-3 md:hidden">
              {ledger.map((entry) => {
                const debit = isDebit(entry.type)
                const amountColor = debit ? 'text-destructive' : 'text-success'
                const dollarPrefix = debit ? '-' : '+'

                return (
                  <div key={entry.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={typeBadgeVariant[entry.type] || 'default'}>
                        {entry.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={`text-lg font-semibold ${amountColor}`}>
                        {formatAmount(entry.type, entry.amount)} credits
                      </span>
                      <span className={`text-sm ${amountColor}`}>
                        {dollarPrefix}{creditsToDollars(entry.amount).slice(1)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Balance: {entry.balance_after.toLocaleString()} ({creditsToDollars(entry.balance_after)})</span>
                      {entry.job_id && <span className="font-mono">{entry.job_id.slice(0, 8)}...</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Credits</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">USD</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Balance After</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ledger.map((entry) => {
                    const debit = isDebit(entry.type)
                    const amountColor = debit ? 'text-destructive' : 'text-success'
                    const dollarPrefix = debit ? '-' : '+'

                    return (
                      <tr key={entry.id}>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={typeBadgeVariant[entry.type] || 'default'}>
                            {entry.type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium text-right ${amountColor}`}>
                          {formatAmount(entry.type, entry.amount)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right ${amountColor}`}>
                          {dollarPrefix}{creditsToDollars(entry.amount).slice(1)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {entry.balance_after.toLocaleString()}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({creditsToDollars(entry.balance_after)})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                          {entry.job_id ? entry.job_id.slice(0, 8) + '...' : '--'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  )
}
