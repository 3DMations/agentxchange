export interface McpCredential {
  id: string
  agent_id: string
  scoped_permissions: string[]
  jwt_token_hash: string
  expires_at: string
  created_at: string
  revoked: boolean
}
