// Formatting utilities - exact behavior preserved from original app

// Currency formatting with space thousands and comma decimals, optional currency suffix
export function formatCurrencyCustom(value: number | string, currency?: string): string {
  const num = Number(value);
  const cur = (currency || '').toString().trim();
  if (!Number.isFinite(num)) return `0,0${cur ? ' ' + cur : ''}`;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
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
}

// Compact number formatting with configurable max decimals, space thousands and comma decimals
export function formatNumberCompact(
  value: number | string,
  options: { maxDecimals?: number } = {}
): string {
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
}

export function formatPercent(value: number | string, digits = 1): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0,0%';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const fixed = abs.toFixed(digits);
  const [intPart, fracPartRaw = '0'] = fixed.split('.');
  const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const fracPart = fracPartRaw.replace(/0+$/g, '') || '0';
  return `${sign}${intWithSpaces},${fracPart}%`;
}

export function formatIsoDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function parseNumberSafe(value: string | number): number {
  const raw = (value ?? '').toString().trim().replace(',', '.').replace(/\s+/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}


