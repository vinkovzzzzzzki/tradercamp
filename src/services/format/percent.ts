// Percentage formatting utilities
// Exact reproduction of current formatting rules

export const formatPercent = (value: number, options: { 
  showSign?: boolean;
  decimals?: number;
  showBrackets?: boolean;
} = {}): string => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  
  const sign = options.showSign && num > 0 ? '+' : '';
  const decimals = options.decimals ?? 1;
  const formatted = Math.abs(num).toFixed(decimals);
  
  let result = `${sign}${formatted}%`;
  
  if (options.showBrackets) {
    result = `(${result})`;
  }
  
  return result;
};

export const formatPercentChange = (current: number, previous: number): string => {
  if (previous === 0) return '0%';
  const change = ((current - previous) / previous) * 100;
  return formatPercent(change, { showSign: true });
};

export const parsePercentSafe = (value: any): number => {
  const raw = (value ?? '').toString().trim().replace('%', '').replace(',', '.').replace(/\s+/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
};
