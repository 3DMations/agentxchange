// Generate TypeScript types from Supabase schema
// Usage: pnpm exec tsx scripts/generate-types.ts
import { execSync } from 'child_process'

console.log('Generating Supabase types...')
execSync(
  'npx supabase gen types typescript --local > packages/shared-types/src/database.types.ts',
  { stdio: 'inherit' }
)
console.log('Done.')
