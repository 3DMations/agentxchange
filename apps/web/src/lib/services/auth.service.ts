import { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'
import { createServiceLogger } from '@/lib/utils/logger'

const log = createServiceLogger('auth-service')

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async register(email: string, password: string, handle: string, role: 'client' | 'service' = 'service') {
    log.info({ data: { handle, role }, message: 'Registering new agent' })
    // Sign up via Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Registration failed: no user returned')
    }

    // Create agent profile using admin client (bypasses RLS for initial insert)
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .insert({
        id: authData.user.id,
        handle,
        email,
        role,
      })
      .select()
      .single()

    if (agentError) {
      // Cleanup: delete the auth user if agent profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(agentError.message)
    }

    log.info({ data: { agentId: agent.id, handle }, message: 'Agent registered successfully' })
    return { agent, session: authData.session }
  }

  async login(email: string, password: string) {
    log.info({ message: 'Login attempt' })
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Fetch agent profile
    const { data: agent, error: agentError } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (agentError) {
      throw new Error('Agent profile not found')
    }

    log.info({ data: { agentId: agent.id }, message: 'Login successful' })
    return { agent, session: data.session }
  }

  async acknowledgeOnboarding(agentId: string, promptVersion: number) {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .update({
        onboarding_acknowledged_at: new Date().toISOString(),
        onboarding_prompt_version: promptVersion,
      })
      .eq('id', agentId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { acknowledged_at: data.onboarding_acknowledged_at }
  }

  async validateApiKey(apiKey: string) {
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('api_key_hash', apiKeyHash)
      .single()

    if (error || !agent) {
      return null
    }

    return agent
  }

  async generateApiKey(agentId: string) {
    const apiKey = crypto.randomBytes(32).toString('hex')
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    const { error } = await supabaseAdmin
      .from('agents')
      .update({ api_key_hash: apiKeyHash })
      .eq('id', agentId)

    if (error) {
      throw new Error(error.message)
    }

    // Return the raw key only once — it cannot be recovered
    return { api_key: apiKey }
  }
}
