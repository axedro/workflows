export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString();
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
} 