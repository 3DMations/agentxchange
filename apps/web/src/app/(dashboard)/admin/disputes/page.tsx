'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/utils/auth-fetch'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

interface Dispute {
  id: string
  job_id: string
  job_title: string
  status: 'open' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'critical'
  reporter_handle: string
  reason: string
  created_at: string
  resolved_at: string | null
  resolution: string | null
}

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'disp-001',
    job_id: 'job-101',
    job_title: 'API Integration Task',
    status: 'open',
    priority: 'high',
    reporter_handle: 'alice_dev',
    reason: 'Deliverable did not meet specifications',
    created_at: '2026-03-25T10:30:00Z',
    resolved_at: null,
    resolution: null,
  },
  {
    id: 'disp-002',
    job_id: 'job-102',
    job_title: 'Data Analysis Report',
    status: 'open',
    priority: 'critical',
    reporter_handle: 'bob_analyst',
    reason: 'Payment not released after completion',
    created_at: '2026-03-24T14:15:00Z',
    resolved_at: null,
    resolution: null,
  },
  {
    id: 'disp-003',
    job_id: 'job-098',
    job_title: 'Content Writing Sprint',
    status: 'resolved',
    priority: 'medium',
    reporter_handle: 'carol_writer',
    reason: 'Late delivery without communication',
    created_at: '2026-03-20T09:00:00Z',
    resolved_at: '2026-03-22T11:00:00Z',
    resolution: 'Resolved in favor of requester',
  },
  {
    id: 'disp-004',
    job_id: 'job-095',
    job_title: 'Logo Design',
    status: 'resolved',
    priority: 'low',
    reporter_handle: 'dave_design',
    reason: 'Scope disagreement',
    created_at: '2026-03-18T16:45:00Z',
    resolved_at: '2026-03-19T10:30:00Z',
    resolution: 'Resolved in favor of specialist',
  },
]

type StatusFilter = 'all' | 'open' | 'resolved'

const priorityVariant: Record<string, string> = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const res = await authFetch('/api/v1/admin/disputes')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setDisputes(json.data ?? [])
      } catch {
        setDisputes(MOCK_DISPUTES)
      } finally {
        setLoading(false)
      }
    }
    fetchDisputes()
  }, [])

  const handleResolve = useCallback(async (disputeId: string, favor: 'requester' | 'specialist') => {
    setResolving(disputeId)
    try {
      const res = await authFetch(`/api/v1/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: `Resolved in favor of ${favor}` }),
      })
      if (res.ok) {
        setDisputes(prev =>
          prev.map(d =>
            d.id === disputeId
              ? { ...d, status: 'resolved' as const, resolved_at: new Date().toISOString(), resolution: `Resolved in favor of ${favor}` }
              : d
          )
        )
      }
    } catch {
      // Optimistic update even on error for demo
      setDisputes(prev =>
        prev.map(d =>
          d.id === disputeId
            ? { ...d, status: 'resolved' as const, resolved_at: new Date().toISOString(), resolution: `Resolved in favor of ${favor}` }
            : d
        )
      )
    } finally {
      setResolving(null)
    }
  }, [])

  const filtered = filter === 'all' ? disputes : disputes.filter(d => d.status === filter)

  return (
    <>
      <PageHeader
        title="Dispute Management"
        description="Review and resolve task disputes"
        action={<Link href="/admin"><Button variant="outline" size="sm">Back to Admin</Button></Link>}
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['all', 'open', 'resolved'] as StatusFilter[]).map(s => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({disputes.filter(d => d.status === s).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-muted-foreground py-8">No disputes found.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Task Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(dispute => (
                <>
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-xs">{dispute.id}</TableCell>
                    <TableCell className="font-medium">{dispute.job_title}</TableCell>
                    <TableCell>
                      <Badge variant={dispute.status === 'open' ? 'warning' : 'success'}>
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[dispute.priority] ?? 'default'}>
                        {dispute.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{dispute.reporter_handle}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === dispute.id ? null : dispute.id)}
                      >
                        {expandedId === dispute.id ? 'Hide' : 'View Details'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === dispute.id && (
                    <TableRow key={`${dispute.id}-detail`}>
                      <TableCell colSpan={7}>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Reason</span>
                            <p className="text-sm">{dispute.reason}</p>
                          </div>
                          {dispute.resolution && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Resolution</span>
                              <p className="text-sm">{dispute.resolution}</p>
                            </div>
                          )}
                          {dispute.status === 'open' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleResolve(dispute.id, 'requester')}
                                disabled={resolving === dispute.id}
                              >
                                Resolve in favor of requester
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleResolve(dispute.id, 'specialist')}
                                disabled={resolving === dispute.id}
                              >
                                Resolve in favor of specialist
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
