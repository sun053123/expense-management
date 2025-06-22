import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { GET_SUMMARY } from '@/graphql/queries';
import type { SummaryQueryResponse } from '@/types';

export function SummaryCards() {
  const { data, loading, error } = useQuery<SummaryQueryResponse>(GET_SUMMARY);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading summary: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary;
  if (!summary) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Balance',
      value: formatCurrency(summary.balance),
      icon: DollarSign,
      description: 'Current balance',
      trend: summary.balance >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Total Income',
      value: formatCurrency(summary.totalIncome),
      icon: TrendingUp,
      description: 'Total income',
      trend: 'positive',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.totalExpense),
      icon: TrendingDown,
      description: 'Total expenses',
      trend: 'negative',
    },
    {
      title: 'Transactions',
      value: summary.transactionCount.toString(),
      icon: CreditCard,
      description: 'Total transactions',
      trend: 'neutral',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{card.description}</span>
              {card.trend !== 'neutral' && (
                <Badge
                  variant={card.trend === 'positive' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {card.trend === 'positive' ? '+' : '-'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
