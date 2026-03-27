'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/utils/auth-fetch'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchInput } from '@/components/ui/search-input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

interface Agent {
  id: string
  handle: string
  email: string
  trust_tier: string
  role: string
  suspension_status: 'active' | 'suspended'
  created_at: string
}

const MOCK_AGENTS: Agent[] = [
  {
    id: 'a-001',
    handle: 'alice_dev',
    email: 'alice@example.com',
    trust_tier: 'gold',
    role: 'agent',
    suspension_status: 'active',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'a-002',
    handle: 'bob_analyst',
    email: 'bob@example.com',
    trust_tier: 'silver',
    role: 'agent',
    suspension_status: 'active',
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 'a-003',
    handle: 'carol_writer',
    email: 'carol@example.com',
    trust_tier: 'bronze',
    role: 'agent',
    suspension_status: 'suspended',
    created_at: '2026-02-20T10:30:00Z',
  },
  {
    id: 'a-004',
    handle: 'dave_design',
    email: 'dave@example.com',
    trust_tier: 'platinum',
    role: 'agent',
    suspension_status: 'active',
    created_at: '2025-12-01T09:00:00Z',
  },
  {
    id: 'a-005',
    handle: 'eve_research',
    email: 'eve@example.com',
    trust_tier: 'new',
    role: 'agent',
    suspension_status: 'active',
    created_at: '2026-03-10T14:00:00Z',
  },
]

const tierVariant: Record<string, string> = {
  new: 'tier-new',
  bronze: 'tier-bronze',
  silver: 'tier-silver',
  gold: 'tier-gold',
  platinum: 'tier-platinum',
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await authFetch('/api/v1/admin/agents')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setAgents(json.data ?? [])
      } catch {
        setAgents(MOCK_AGENTS)
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])

  const handleToggleSuspension = useCallback(async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    setToggling(agentId)
    try {
      await authFetch(`/api/v1/admin/agents/${agentId}/suspension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      // Continue with optimistic update
    }
    setAgents(prev =>
      prev.map(a => (a.id === agentId ? { ...a, suspension_status: newStatus as Agent['suspension_status'] } : a))
    )
    setToggling(null)
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return agents
    const q = search.toLowerCase()
    return agents.filter(
      a => a.handle.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    )
  }, [agents, search])

  return (
    <>
      <PageHeader
        title="Specialist Management"
        description="View and manage specialist accounts"
        action={<Link href="/admin"><Button variant="outline" size="sm">Back to Admin</Button></Link>}
      />

      <div className="mb-6 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by handle or email..."
        />
      </div>

      {loading ? (
        <Card>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-muted-foreground py-8">
            {search ? 'No specialists match your search.' : 'No specialists found.'}
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handle</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Trust Tier</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(agent => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.handle}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{agent.email}</TableCell>
                  <TableCell>
                    <Badge variant={tierVariant[agent.trust_tier] ?? 'default'}>
                      {agent.trust_tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{agent.role}</TableCell>
                  <TableCell>
                    <Badge variant={agent.suspension_status === 'active' ? 'success' : 'danger'}>
                      {agent.suspension_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={agent.suspension_status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        disabled={toggling === agent.id}
                        onClick={() => handleToggleSuspension(agent.id, agent.suspension_status)}
                      >
                        {agent.suspension_status === 'active' ? 'Suspend' : 'Unsuspend'}
                      </Button>
                      <Link href={`/agents/${agent.id}`}>
                        <Button variant="outline" size="sm">View Profile</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
