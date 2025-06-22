import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely formats a date string for display
 * Handles various date formats and invalid dates gracefully
 */
export const formatTransactionDate = (dateString: string): string => {
  try {
    // Try parsing as ISO string first
    let date = parseISO(dateString);
    
    // If that fails, try creating a new Date
    if (!isValid(date)) {
      date = new Date(dateString);
    }
    
    // If still invalid, return a fallback
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return 'Invalid date';
  }
};

/**
 * Safely formats a date string for form input (YYYY-MM-DD format)
 * Handles various date formats and invalid dates gracefully
 */
export const formatDateForInput = (dateString?: string): string => {
  if (!dateString) {
    return format(new Date(), "yyyy-MM-dd");
  }
  
  try {
    // Try parsing as ISO string first
    let date = parseISO(dateString);
    
    // If that fails, try creating a new Date
    if (!isValid(date)) {
      date = new Date(dateString);
    }
    
    // If still invalid, use current date
    if (!isValid(date)) {
      return format(new Date(), "yyyy-MM-dd");
    }
    
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    console.warn("Error formatting date for input:", dateString, error);
    return format(new Date(), "yyyy-MM-dd");
  }
};

/**
 * Test function to verify date formatting works correctly
 */
export const testDateFormatting = () => {
  const testCases = [
    '2024-01-15',
    '2024-01-15T10:30:00Z',
    '2024-01-15T10:30:00.000Z',
    'invalid-date',
    '',
    null,
    undefined
  ];

  console.log('Testing date formatting:');
  testCases.forEach(testCase => {
    const result = formatTransactionDate(testCase as string);
    console.log(`Input: ${testCase} -> Output: ${result}`);
  });
};
