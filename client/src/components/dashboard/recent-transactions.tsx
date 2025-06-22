import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { GET_TRANSACTIONS } from '@/graphql/queries';
import { TransactionType, type TransactionsQueryResponse } from '@/types';

export function RecentTransactions() {
  const { data, loading, error } = useQuery<TransactionsQueryResponse>(GET_TRANSACTIONS, {
    variables: {
      filter: {}, // Get all transactions, we'll limit on the frontend
    },
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted animate-pulse rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading transactions: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.transactions || [];
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <div className="flex space-x-2">
          <Button asChild size="sm">
            <Link to="/transactions/new">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/transactions">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No transactions yet</p>
            <Button asChild>
              <Link to="/transactions/new">
                <Plus className="h-4 w-4 mr-2" />
                Add your first transaction
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center space-x-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  transaction.type === TransactionType.INCOME 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {transaction.type === TransactionType.INCOME ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={transaction.type === TransactionType.INCOME ? 'default' : 'destructive'}
                  >
                    {transaction.type === TransactionType.INCOME ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
