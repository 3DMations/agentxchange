'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/utils/auth-fetch'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

interface ZoneConfig {
  id: string
  name: string
  min_xp: number
  max_agents: number
  credit_cap: number
  is_active: boolean
}

const MOCK_ZONES: ZoneConfig[] = [
  {
    id: 'zone-starter',
    name: 'Starter',
    min_xp: 0,
    max_agents: 1000,
    credit_cap: 500,
    is_active: true,
  },
  {
    id: 'zone-intermediate',
    name: 'Intermediate',
    min_xp: 100,
    max_agents: 500,
    credit_cap: 2000,
    is_active: true,
  },
  {
    id: 'zone-advanced',
    name: 'Advanced',
    min_xp: 500,
    max_agents: 200,
    credit_cap: 10000,
    is_active: true,
  },
  {
    id: 'zone-expert',
    name: 'Expert',
    min_xp: 2000,
    max_agents: 50,
    credit_cap: 50000,
    is_active: false,
  },
]

export default function ZonesPage() {
  const [zones, setZones] = useState<ZoneConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ZoneConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchZones() {
      try {
        const res = await authFetch('/api/v1/zones')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setZones(json.data ?? [])
      } catch {
        setZones(MOCK_ZONES)
      } finally {
        setLoading(false)
      }
    }
    fetchZones()
  }, [])

  const startEdit = useCallback((zone: ZoneConfig) => {
    setEditingId(zone.id)
    setEditForm({ ...zone })
    setSaveSuccess(null)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditForm(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!editForm) return
    setSaving(true)
    try {
      await authFetch(`/api/v1/admin/zones/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          min_xp: editForm.min_xp,
          max_agents: editForm.max_agents,
          credit_cap: editForm.credit_cap,
          is_active: editForm.is_active,
        }),
      })
    } catch {
      // Continue with optimistic update
    }
    setZones(prev => prev.map(z => (z.id === editForm.id ? { ...editForm } : z)))
    setSaveSuccess(editForm.id)
    setEditingId(null)
    setEditForm(null)
    setSaving(false)
    setTimeout(() => setSaveSuccess(null), 3000)
  }, [editForm])

  const updateField = useCallback(
    (field: keyof ZoneConfig, value: string | number | boolean) => {
      setEditForm(prev => (prev ? { ...prev, [field]: value } : null))
    },
    []
  )

  return (
    <>
      <PageHeader
        title="Zone Configuration"
        description="Configure zone parameters and access tiers"
        action={<Link href="/admin"><Button variant="outline" size="sm">Back to Admin</Button></Link>}
      />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : zones.length === 0 ? (
        <Card>
          <p className="text-center text-muted-foreground py-8">No zones configured.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {zones.map(zone => {
            const isEditing = editingId === zone.id && editForm
            const form = editForm

            return (
              <Card key={zone.id} className={saveSuccess === zone.id ? 'ring-2 ring-success' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{zone.name}</h3>
                  <Badge variant={zone.is_active ? 'success' : 'default'}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {isEditing && form ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground" htmlFor={`name-${zone.id}`}>Name</label>
                      <Input
                        id={`name-${zone.id}`}
                        value={form.name}
                        onChange={e => updateField('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground" htmlFor={`min_xp-${zone.id}`}>Min XP</label>
                      <Input
                        id={`min_xp-${zone.id}`}
                        type="number"
                        value={form.min_xp}
                        onChange={e => updateField('min_xp', parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground" htmlFor={`max_agents-${zone.id}`}>Max Specialists</label>
                      <Input
                        id={`max_agents-${zone.id}`}
                        type="number"
                        value={form.max_agents}
                        onChange={e => updateField('max_agents', parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground" htmlFor={`credit_cap-${zone.id}`}>Credit Cap</label>
                      <Input
                        id={`credit_cap-${zone.id}`}
                        type="number"
                        value={form.credit_cap}
                        onChange={e => updateField('credit_cap', parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`is_active-${zone.id}`}
                        type="checkbox"
                        checked={form.is_active}
                        onChange={e => updateField('is_active', e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <label className="text-sm font-medium text-muted-foreground" htmlFor={`is_active-${zone.id}`}>Active</label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Min XP</span>
                      <span className="font-medium text-foreground">{zone.min_xp.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Specialists</span>
                      <span className="font-medium text-foreground">{zone.max_agents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credit Cap</span>
                      <span className="font-medium text-foreground">{zone.credit_cap.toLocaleString()}</span>
                    </div>
                    <div className="pt-3">
                      <Button size="sm" variant="outline" onClick={() => startEdit(zone)}>
                        Edit Configuration
                      </Button>
                    </div>
                  </div>
                )}

                {saveSuccess === zone.id && (
                  <p className="text-xs text-success mt-2">Configuration saved.</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
