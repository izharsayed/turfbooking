export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(d);
}

export function formatTime(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    timeStyle: 'short',
  }).format(d);
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidPhone(phone: string): boolean {
  const re = /^[6-9]\d{9}$/; // Indian mobile numbers
  return re.test(phone);
}
