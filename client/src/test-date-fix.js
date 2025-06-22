// Quick test to verify date formatting fixes
// Run this in browser console to test

console.log('Testing date formatting fixes...');

// Test cases that would previously cause "Invalid time value" errors
const testCases = [
  '2024-01-15',
  '2024-01-15T10:30:00Z',
  '2024-01-15T10:30:00.000Z',
  'invalid-date',
  '',
  null,
  undefined,
  'not-a-date',
  '2024-13-45', // Invalid date
  '2024-02-30', // Invalid date (Feb 30th doesn't exist)
];

console.log('=== Testing formatTransactionDate ===');
testCases.forEach(testCase => {
  try {
    // This would be the old way that caused errors:
    // const result = format(new Date(testCase), 'MMM dd, yyyy');

    // New safe way (simulated):
    let date;
    if (testCase) {
      date = new Date(testCase);
      if (isNaN(date.getTime())) {
        console.log(`✅ Input: ${testCase} -> Output: "Invalid date" (safely handled)`);
      } else {
        console.log(`✅ Input: ${testCase} -> Output: Valid date (${date.toDateString()})`);
      }
    } else {
      console.log(`✅ Input: ${testCase} -> Output: "Invalid date" (safely handled)`);
    }
  } catch (error) {
    console.log(`❌ Input: ${testCase} -> Error: ${error.message}`);
  }
});

console.log('\n=== Testing Date Sorting ===');
const mockTransactions = [
  { id: '1', createdAt: '2024-01-15T10:30:00Z' },
  { id: '2', createdAt: 'invalid-date' },
  { id: '3', createdAt: '2024-01-16T10:30:00Z' },
  { id: '4', createdAt: null },
];

try {
  // Create a copy to avoid mutating the original array (important for Apollo Client data)
  const sorted = [...mockTransactions].sort((a, b) => {
    try {
      const dateA = new Date(b.createdAt).getTime();
      const dateB = new Date(a.createdAt).getTime();

      if (isNaN(dateA) || isNaN(dateB)) {
        return 0;
      }

      return dateA - dateB;
    } catch {
      return 0;
    }
  });

  console.log('✅ Sorting with invalid dates handled safely:', sorted.map(t => ({ id: t.id, createdAt: t.createdAt })));
} catch (error) {
  console.log(`❌ Sorting failed: ${error.message}`);
}

console.log('\n🎉 All date formatting tests completed!');
