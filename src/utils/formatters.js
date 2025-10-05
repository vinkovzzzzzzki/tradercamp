// Currency and number formatting utilities
export const formatCurrency = (value) => `${formatCurrencyCustom(value, 'USD')}`;

export const formatCurrencyCustom = (value, currency) => {
  const num = Number(value);
  const cur = (currency || '').toString().trim();
  if (!Number.isFinite(num)) return `0,0${cur ? ' ' + cur : ''}`;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const fixed = abs.toFixed(6);
  const [int, dec] = fixed.split('.');
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decFormatted = dec.replace(/0+$/, '');
  const result = `${sign}${intFormatted}${decFormatted ? '.' + decFormatted : ''}${cur ? ' ' + cur : ''}`;
  return result;
};

export const formatNumberCompact = (value, options = {}) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0,0';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const fixed = abs.toFixed(options.maxDecimals ?? 6);
  const [int, dec] = fixed.split('.');
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decFormatted = dec.replace(/0+$/, '');
  return `${sign}${intFormatted}${decFormatted ? '.' + decFormatted : ''}`;
};

export const formatDate = (d) => d.toISOString().slice(0, 10);

export const normalizeString = (s) => (s == null ? '' : String(s)).trim().toLowerCase().replace(/\s+/g, ' ');
