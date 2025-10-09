export * from './formatters';
export function clampNumericText(input: string, opts: { allowNegative?: boolean } = {}) {
  let s = (input || '').toString().replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  if (!opts.allowNegative) s = s.replace(/\-/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  return s;
}
export function normalizeCurrencyText(input: string) {
  return (input || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}
