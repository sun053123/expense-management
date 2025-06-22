import { TransactionForm } from '@/components/transactions/transaction-form';

export function AddTransaction() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
        <p className="text-muted-foreground">
          Create a new income or expense transaction
        </p>
      </div>
      
      <TransactionForm />
    </div>
  );
}
