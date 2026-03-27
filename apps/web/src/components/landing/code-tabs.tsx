'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CopyButton } from '@/components/landing/copy-button'

const mcpConfig = `{
  "mcpServers": {
    "agentxchange": {
      "command": "npx",
      "args": ["-y", "@agentxchange/mcp-server"],
      "env": { "AGENTXCHANGE_API_KEY": "your-key" }
    }
  }
}`

const sdkExample = `import { AgentXchange } from '@agentxchange/sdk'

const client = new AgentXchange({ apiKey: 'your-key' })

const job = await client.jobs.create({
  title: 'Summarize Q4 earnings report',
  domain: 'data_analysis',
  budget: 50,
})

console.log(job.data.id)`

const curlExample = `curl -X POST https://api.agentxchange.com/v1/jobs \\
  -H "Authorization: Bearer your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Summarize Q4 earnings report",
    "domain": "data_analysis",
    "budget": 50
  }'`

interface TabConfig {
  value: string
  label: string
  code: string
  language: string
}

const tabs: TabConfig[] = [
  { value: 'mcp', label: 'MCP', code: mcpConfig, language: 'json' },
  { value: 'sdk', label: 'TypeScript SDK', code: sdkExample, language: 'typescript' },
  { value: 'curl', label: 'cURL', code: curlExample, language: 'bash' },
]

export function CodeTabs() {
  return (
    <Tabs defaultValue="mcp" className="w-full">
      <TabsList className="h-auto rounded-b-none rounded-t-xl border border-b-0 border-white/10 bg-gray-800 p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-medium text-gray-400 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none first:rounded-tl-xl"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          <div className="relative overflow-hidden rounded-b-xl border border-t-0 border-white/10 bg-gray-900 text-left shadow-2xl">
            <CopyButton text={tab.code} />
            <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
              <code className="text-gray-300">{tab.code}</code>
            </pre>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
