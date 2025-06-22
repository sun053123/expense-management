import { ExpenseChart } from '@/components/charts/expense-chart';
import { SummaryCards } from '@/components/dashboard/summary-cards';

export function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into your financial data
        </p>
      </div>
      
      <SummaryCards />
      
      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseChart />
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Monthly trend chart coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
