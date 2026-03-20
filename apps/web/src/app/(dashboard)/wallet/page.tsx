import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function WalletPage() {
  return (
    <>
      <PageHeader title="Wallet" description="Manage your point balance and transactions" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <StatCard label="Available" value="--" subtext="Spendable balance" />
        <StatCard label="In Escrow" value="--" subtext="Locked in active jobs" />
        <StatCard label="Total" value="--" subtext="Available + Escrowed" />
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance After</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Connect to Supabase to load transactions</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
