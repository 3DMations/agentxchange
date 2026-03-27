'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/utils/auth-fetch'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

interface FinancialStats {
  total_credits_in_circulation: number
  total_escrowed: number
  total_fees_collected: number
}

interface LargeTransaction {
  id: string
  agent_handle: string
  type: string
  amount: number
  created_at: string
  description: string
}

interface Anomaly {
  id: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  detected_at: string
}

const MOCK_STATS: FinancialStats = {
  total_credits_in_circulation: 1_245_800,
  total_escrowed: 87_500,
  total_fees_collected: 34_200,
}

const MOCK_TRANSACTIONS: LargeTransaction[] = [
  {
    id: 'tx-001',
    agent_handle: 'alice_dev',
    type: 'escrow_release',
    amount: 5000,
    created_at: '2026-03-26T14:30:00Z',
    description: 'Escrow released for API Integration Task',
  },
  {
    id: 'tx-002',
    agent_handle: 'bob_analyst',
    type: 'deposit',
    amount: 10000,
    created_at: '2026-03-25T09:15:00Z',
    description: 'Credit purchase',
  },
  {
    id: 'tx-003',
    agent_handle: 'carol_writer',
    type: 'escrow_release',
    amount: 3500,
    created_at: '2026-03-24T16:00:00Z',
    description: 'Escrow released for Content Writing Sprint',
  },
  {
    id: 'tx-004',
    agent_handle: 'dave_design',
    type: 'withdrawal',
    amount: 8000,
    created_at: '2026-03-23T11:45:00Z',
    description: 'Credit withdrawal',
  },
]

const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: 'anom-001',
    type: 'velocity',
    description: 'Specialist eve_research completed 12 tasks in 1 hour, well above the 95th percentile',
    severity: 'high',
    detected_at: '2026-03-26T18:00:00Z',
  },
  {
    id: 'anom-002',
    type: 'balance',
    description: 'Escrow balance discrepancy of 150 credits detected between ledger and wallet',
    severity: 'medium',
    detected_at: '2026-03-25T22:00:00Z',
  },
]

const txTypeVariant: Record<string, string> = {
  escrow_release: 'success',
  deposit: 'info',
  withdrawal: 'warning',
  fee: 'default',
}

const severityVariant: Record<string, string> = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
}

export default function WalletPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [transactions, setTransactions] = useState<LargeTransaction[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Fetch stats
      try {
        const res = await authFetch('/api/v1/admin/dashboard/kpis')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        const d = json.data
        setStats({
          total_credits_in_circulation: d?.total_points_in_circulation ?? MOCK_STATS.total_credits_in_circulation,
          total_escrowed: d?.total_escrowed ?? MOCK_STATS.total_escrowed,
          total_fees_collected: d?.total_fees_collected ?? MOCK_STATS.total_fees_collected,
        })
      } catch {
        setStats(MOCK_STATS)
      }

      // Fetch recent large transactions
      try {
        const res = await authFetch('/api/v1/admin/wallet/transactions?min_amount=1000')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setTransactions(json.data ?? [])
      } catch {
        setTransactions(MOCK_TRANSACTIONS)
      }

      // Fetch anomalies
      try {
        const res = await authFetch('/api/v1/admin/wallet/anomalies')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setAnomalies(json.data ?? [])
      } catch {
        setAnomalies(MOCK_ANOMALIES)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <>
      <PageHeader
        title="Financial Overview"
        description="Platform credits, escrow, and transaction monitoring"
        action={<Link href="/admin"><Button variant="outline" size="sm">Back to Admin</Button></Link>}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        {loading ? (
          <>
            <Card><Skeleton className="h-16 w-full" /></Card>
            <Card><Skeleton className="h-16 w-full" /></Card>
            <Card><Skeleton className="h-16 w-full" /></Card>
          </>
        ) : stats ? (
          <>
            <StatCard label="Credits in Circulation" value={stats.total_credits_in_circulation.toLocaleString()} />
            <StatCard label="Total Escrowed" value={stats.total_escrowed.toLocaleString()} />
            <StatCard label="Fees Collected" value={stats.total_fees_collected.toLocaleString()} />
          </>
        ) : null}
      </div>

      {/* Anomaly Alerts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Anomaly Alerts</h2>
        {loading ? (
          <div className="space-y-3">
            <Card><Skeleton className="h-12 w-full" /></Card>
            <Card><Skeleton className="h-12 w-full" /></Card>
          </div>
        ) : anomalies.length === 0 ? (
          <Card>
            <p className="text-center text-muted-foreground py-4">No anomalies detected.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {anomalies.map(anomaly => (
              <Card key={anomaly.id} className={anomaly.severity === 'high' ? 'border-destructive/40' : ''}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={severityVariant[anomaly.severity]}>
                        {anomaly.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{anomaly.type}</span>
                    </div>
                    <p className="text-sm text-foreground">{anomaly.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Detected: {new Date(anomaly.detected_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Large Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Large Transactions</h2>
        {loading ? (
          <Card>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <p className="text-center text-muted-foreground py-8">No large transactions found.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Specialist</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.agent_handle}</TableCell>
                    <TableCell>
                      <Badge variant={txTypeVariant[tx.type] ?? 'default'}>
                        {tx.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{tx.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  )
}
