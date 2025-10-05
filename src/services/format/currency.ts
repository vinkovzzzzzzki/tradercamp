// Currency formatting utilities
// Exact reproduction of current formatting rules

export const formatCurrency = (value: number): string => {
  return formatCurrencyCustom(value, 'USD');
};

export const formatCurrencyCustom = (value: number, currency: string): string => {
  const num = Number(value);
  const cur = (currency || '').toString().trim();
  if (!Number.isFinite(num)) return `0,0${cur ? ' ' + cur : ''}`;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  // Start with high precision, then trim
  const fixed = abs.toFixed(10);
  const parts = fixed.split('.');
  const intPart = parts[0] || '0';
  let fracPart = parts[1] || '';
  // Remove trailing zeros fully
  while (fracPart.endsWith('0')) fracPart = fracPart.slice(0, -1);
  // Ensure at least one decimal digit is shown
  if (fracPart.length === 0) fracPart = '0';
  // Thousands separator for integer part (space), decimal comma
  const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${intWithSpaces},${fracPart}${cur ? ' ' + cur : ''}`;
};

export const formatNumberCompact = (value: number, options: { maxDecimals?: number } = {}): string => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0,0';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const fixed = abs.toFixed(options.maxDecimals ?? 6);
  let [intPart, fracPart = ''] = fixed.split('.');
  while (fracPart.endsWith('0')) fracPart = fracPart.slice(0, -1);
  if (fracPart.length === 0) fracPart = '0';
  const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${intWithSpaces},${fracPart}`;
};

export const parseNumberSafe = (value: any): number => {
  const raw = (value ?? '').toString().trim().replace(',', '.').replace(/\s+/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
};
