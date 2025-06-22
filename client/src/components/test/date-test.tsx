import { formatTransactionDate, formatDateForInput, testDateFormatting } from '@/utils/date-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DateTest() {
  const testCases = [
    '2024-01-15',
    '2024-01-15T10:30:00Z',
    '2024-01-15T10:30:00.000Z',
    'invalid-date',
    '',
    // @ts-ignore - testing with null/undefined
    null,
    // @ts-ignore - testing with null/undefined
    undefined
  ];

  const handleRunTests = () => {
    testDateFormatting();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Date Formatting Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleRunTests}>
          Run Tests (Check Console)
        </Button>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Test Results:</h3>
          {testCases.map((testCase, index) => (
            <div key={index} className="flex justify-between items-center p-2 border rounded">
              <span className="font-mono text-sm">
                Input: {testCase === null ? 'null' : testCase === undefined ? 'undefined' : `"${testCase}"`}
              </span>
              <span className="font-mono text-sm">
                Display: "{formatTransactionDate(testCase as string)}"
              </span>
              <span className="font-mono text-sm">
                Input: "{formatDateForInput(testCase as string)}"
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
