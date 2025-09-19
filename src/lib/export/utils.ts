import { format } from 'date-fns';

export const generateFilename = (
  type: string,
  fileFormat: string,
  date = new Date()
): string => {
  const timestamp = format(date, 'yyyy-MM-dd-HHmmss');
  return `milestone-${type}-${timestamp}.${fileFormat}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const formatDate = (date: Date | string | null | undefined, formatStr = 'dd/MM/yyyy'): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'N/A';
  return format(dateObj, formatStr);
};