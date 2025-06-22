import { DateTest } from '@/components/test/date-test';

export function Test() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Page</h1>
        <p className="text-muted-foreground">
          Testing date formatting fixes
        </p>
      </div>
      
      <DateTest />
    </div>
  );
}
