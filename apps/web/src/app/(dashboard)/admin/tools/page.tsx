'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/utils/auth-fetch'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Tool {
  id: string
  name: string
  capabilities: string
  submitted_by: string
  submitted_at: string
  status: 'pending_review' | 'approved' | 'rejected'
  rejection_reason: string | null
}

const MOCK_TOOLS: Tool[] = [
  {
    id: 'tool-001',
    name: 'CodeAssist Pro',
    capabilities: 'Automated code review, refactoring suggestions, and test generation',
    submitted_by: 'alice_dev',
    submitted_at: '2026-03-25T10:00:00Z',
    status: 'pending_review',
    rejection_reason: null,
  },
  {
    id: 'tool-002',
    name: 'DataCrunch',
    capabilities: 'Statistical analysis, data visualization, and anomaly detection',
    submitted_by: 'bob_analyst',
    submitted_at: '2026-03-24T14:30:00Z',
    status: 'pending_review',
    rejection_reason: null,
  },
  {
    id: 'tool-003',
    name: 'WriterBot',
    capabilities: 'Content generation, grammar checking, and style adaptation',
    submitted_by: 'carol_writer',
    submitted_at: '2026-03-20T09:15:00Z',
    status: 'approved',
    rejection_reason: null,
  },
  {
    id: 'tool-004',
    name: 'DesignEngine',
    capabilities: 'Layout generation, color palette suggestions, and asset resizing',
    submitted_by: 'dave_design',
    submitted_at: '2026-03-18T16:00:00Z',
    status: 'approved',
    rejection_reason: null,
  },
  {
    id: 'tool-005',
    name: 'SpamGen',
    capabilities: 'Mass email generation',
    submitted_by: 'unknown_user',
    submitted_at: '2026-03-15T08:00:00Z',
    status: 'rejected',
    rejection_reason: 'Tool violates acceptable use policy',
  },
]

const statusVariant: Record<string, string> = {
  pending_review: 'warning',
  approved: 'success',
  rejected: 'danger',
}

const statusLabel: Record<string, string> = {
  pending_review: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    async function fetchTools() {
      try {
        const res = await authFetch('/api/v1/admin/tools')
        if (!res.ok) {
          const fallback = await authFetch('/api/v1/tools')
          if (!fallback.ok) throw new Error('Unavailable')
          const json = await fallback.json()
          setTools(json.data ?? [])
          return
        }
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setTools(json.data ?? [])
      } catch {
        setTools(MOCK_TOOLS)
      } finally {
        setLoading(false)
      }
    }
    fetchTools()
  }, [])

  const handleApprove = useCallback(async (toolId: string) => {
    setActionId(toolId)
    try {
      await authFetch(`/api/v1/admin/tools/${toolId}/approve`, {
        method: 'POST',
      })
    } catch {
      // Optimistic update
    }
    setTools(prev =>
      prev.map(t => (t.id === toolId ? { ...t, status: 'approved' as const } : t))
    )
    setActionId(null)
  }, [])

  const handleReject = useCallback(async (toolId: string) => {
    if (!rejectReason.trim()) return
    setActionId(toolId)
    try {
      await authFetch(`/api/v1/admin/tools/${toolId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
    } catch {
      // Optimistic update
    }
    setTools(prev =>
      prev.map(t =>
        t.id === toolId ? { ...t, status: 'rejected' as const, rejection_reason: rejectReason } : t
      )
    )
    setRejectId(null)
    setRejectReason('')
    setActionId(null)
  }, [rejectReason])

  const byStatus = (status: Tool['status']) => tools.filter(t => t.status === status)

  function ToolCard({ tool }: { tool: Tool }) {
    return (
      <Card key={tool.id} className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{tool.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{tool.capabilities}</p>
          </div>
          <Badge variant={statusVariant[tool.status]}>{statusLabel[tool.status]}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Submitted by: {tool.submitted_by}</span>
          <span>{new Date(tool.submitted_at).toLocaleDateString()}</span>
        </div>
        {tool.rejection_reason && (
          <div className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Reason: {tool.rejection_reason}
          </div>
        )}
        {tool.status === 'pending_review' && (
          <div className="flex gap-2 pt-1">
            {rejectId === tool.id ? (
              <div className="flex-1 space-y-2">
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!rejectReason.trim() || actionId === tool.id}
                    onClick={() => handleReject(tool.id)}
                  >
                    Confirm Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setRejectId(null); setRejectReason('') }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  disabled={actionId === tool.id}
                  onClick={() => handleApprove(tool.id)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actionId === tool.id}
                  onClick={() => setRejectId(tool.id)}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        )}
      </Card>
    )
  }

  function ToolSkeleton() {
    return (
      <Card>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <PageHeader
        title="Tool Approval Queue"
        description="Review and approve submitted tools"
        action={<Link href="/admin"><Button variant="outline" size="sm">Back to Admin</Button></Link>}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ToolSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({byStatus('pending_review').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({byStatus('approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({byStatus('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {byStatus('pending_review').length === 0 ? (
              <Card>
                <p className="text-center text-muted-foreground py-8">No pending tools.</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byStatus('pending_review').map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            {byStatus('approved').length === 0 ? (
              <Card>
                <p className="text-center text-muted-foreground py-8">No approved tools.</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byStatus('approved').map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            {byStatus('rejected').length === 0 ? (
              <Card>
                <p className="text-center text-muted-foreground py-8">No rejected tools.</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byStatus('rejected').map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </>
  )
}
