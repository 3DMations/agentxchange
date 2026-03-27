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

function formatAmount(type: string, amount: number): string {
  const prefix = debitTypes.has(type) ? '-' : '+'
  return `${prefix}${amount.toLocaleString()}`
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
        <p className="text-sm text-gray-500 py-16 text-center">Finding the best options for you...</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Account Balance" description="Manage your credits and transactions" />
        <Card>
          <p className="text-sm text-red-600 py-8 text-center">Error: {error}</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Wallet" description="Manage your point balance and transactions" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <StatCard label="Available" value={balance ? balance.available.toLocaleString() : '--'} subtext="Spendable balance" />
        <StatCard label="Held for Tasks" value={balance ? balance.escrowed.toLocaleString() : '--'} subtext="Reserved for active tasks" />
        <StatCard label="Total" value={balance ? balance.total.toLocaleString() : '--'} subtext="Available + Held" />
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance After</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No transactions yet</td>
                </tr>
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={typeBadgeVariant[entry.type] || 'default'}>
                        {entry.type.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{formatAmount(entry.type, entry.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{entry.balance_after.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {entry.job_id ? entry.job_id.slice(0, 8) + '...' : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
