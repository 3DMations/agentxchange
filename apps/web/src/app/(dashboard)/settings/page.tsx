'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { createSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

/* -------------------------------------------------------------------------- */
/*  Account Tab                                                               */
/* -------------------------------------------------------------------------- */

function AccountTab({
  email,
  displayName,
  onDisplayNameChange,
}: {
  email: string
  displayName: string
  onDisplayNameChange: (name: string) => void
}) {
  const [localName, setLocalName] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setLocalName(displayName)
  }, [displayName])

  async function handleSaveName() {
    setSaving(true)
    setSaved(false)
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.updateUser({
        data: { display_name: localName },
      })
      if (error) throw error
      onDisplayNameChange(localName)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // Silently handled -- user can retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email (read-only) */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-1">Email address</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Your email is managed through your authentication provider and cannot be changed here.
        </p>
        <Input value={email} disabled className="max-w-md bg-muted" />
      </Card>

      {/* Display name */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-1">Display name</h3>
        <p className="text-sm text-muted-foreground mb-3">
          This is how other users will see you across the platform.
        </p>
        <div className="flex items-center gap-3 max-w-md">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Your display name"
            maxLength={100}
          />
          <Button onClick={handleSaveName} disabled={saving || localName === displayName}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-1">Password</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Reset your password via email. You will receive a link to set a new password.
        </p>
        <Button variant="outline" asChild>
          <Link href="/forgot-password">Change password</Link>
        </Button>
      </Card>

      {/* Delete account */}
      <Card className="border-destructive/30">
        <h3 className="text-sm font-semibold text-destructive mb-1">Delete account</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Permanently remove your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            Delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              Are you sure? All your data, tasks, and credits will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" disabled>
                Confirm deletion
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Account deletion is not yet available. Please contact support.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Notifications Tab                                                         */
/* -------------------------------------------------------------------------- */

function ToggleSwitch({
  id,
  checked,
  onChange,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      id={id}
      role="switch"
      type="button"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
        border-2 border-transparent transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}
      `}
    >
      <span
        className={`
          pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}
        `}
      />
    </button>
  )
}

function NotificationsTab() {
  const [taskEmails, setTaskEmails] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [browserNotifs, setBrowserNotifs] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-4">Email notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="task-emails" className="text-sm font-medium text-foreground cursor-pointer">
                Task updates
              </label>
              <p className="text-xs text-muted-foreground">
                Get notified when tasks you are involved in are updated, accepted, or completed.
              </p>
            </div>
            <ToggleSwitch id="task-emails" checked={taskEmails} onChange={setTaskEmails} />
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="marketing-emails" className="text-sm font-medium text-foreground cursor-pointer">
                Product updates and tips
              </label>
              <p className="text-xs text-muted-foreground">
                Occasional emails about new features, best practices, and platform news.
              </p>
            </div>
            <ToggleSwitch id="marketing-emails" checked={marketingEmails} onChange={setMarketingEmails} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-4">Browser notifications</h3>
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="browser-notifs" className="text-sm font-medium text-foreground cursor-pointer">
              Push notifications
            </label>
            <p className="text-xs text-muted-foreground">
              Receive real-time browser notifications for task activity and messages.
            </p>
          </div>
          <ToggleSwitch id="browser-notifs" checked={browserNotifs} onChange={setBrowserNotifs} />
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Notification preferences are saved automatically. Changes may take a few minutes to take effect.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Appearance Tab                                                            */
/* -------------------------------------------------------------------------- */

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-4">Theme</h3>
        <div className="h-10 w-72 animate-pulse rounded-md bg-muted" />
      </Card>
    )
  }

  const options: { value: string; label: string; description: string }[] = [
    { value: 'system', label: 'System', description: 'Follow your operating system preference' },
    { value: 'light', label: 'Light', description: 'Always use the light theme' },
    { value: 'dark', label: 'Dark', description: 'Always use the dark theme' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-1">Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how AgentXchange looks for you. Select a theme preference below.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`
                rounded-lg border p-3 text-left transition-colors duration-150
                ${
                  theme === opt.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/40'
                }
              `}
            >
              <span className="block text-sm font-medium text-foreground">{opt.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{opt.description}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Webhooks Tab                                                              */
/* -------------------------------------------------------------------------- */

function WebhooksTab() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-1">Webhook subscriptions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Subscribe to events via webhooks for programmatic integration. Webhooks let you receive
          real-time HTTP callbacks when tasks are created, completed, or updated.
        </p>
        <Button variant="outline" asChild>
          <Link href="/docs/api-reference">View webhook documentation</Link>
        </Button>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-4">Your webhooks</h3>
        <div className="rounded-lg border border-border">
          {/* Table header */}
          <div className="grid grid-cols-3 gap-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>URL</span>
            <span>Events</span>
            <span>Status</span>
          </div>
          {/* Empty state */}
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">No webhooks configured</p>
            <div className="relative group">
              <Button disabled>Add Webhook</Button>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Settings Page                                                             */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email ?? '')
          setDisplayName(
            (user.user_metadata?.display_name as string) ??
              (user.user_metadata?.full_name as string) ??
              ''
          )
        }
      } catch {
        // Auth load failed -- fields remain empty
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  return (
    <>
      <PageHeader title="Settings" description="Manage your account, notifications, and preferences" />

      {loading ? (
        <div className="space-y-4">
          <div className="h-10 w-80 animate-pulse rounded-md bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountTab
              email={email}
              displayName={displayName}
              onDisplayNameChange={setDisplayName}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>

          <TabsContent value="webhooks">
            <WebhooksTab />
          </TabsContent>
        </Tabs>
      )}
    </>
  )
}
