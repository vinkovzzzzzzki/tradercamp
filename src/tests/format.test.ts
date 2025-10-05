// Format utilities tests - exact reproduction of current formatting behavior
import { formatCurrency, formatCurrencyCustom, formatNumberCompact, parseNumberSafe } from '../services/format/currency';
import { formatPercent, formatPercentChange, parsePercentSafe } from '../services/format/percent';
import { formatDate, formatDateDisplay, formatTime, parseDateSafe } from '../services/format/date';

describe('Currency Formatting', () => {
  test('formatCurrency formats USD correctly', () => {
    expect(formatCurrency(1234.56)).toBe('1 234,56 USD');
    expect(formatCurrency(0)).toBe('0,0 USD');
    expect(formatCurrency(-1234.56)).toBe('-1 234,56 USD');
  });

  test('formatCurrencyCustom formats different currencies', () => {
    expect(formatCurrencyCustom(1234.56, 'EUR')).toBe('1 234,56 EUR');
    expect(formatCurrencyCustom(0, 'RUB')).toBe('0,0 RUB');
    expect(formatCurrencyCustom(-1234.56, 'USD')).toBe('-1 234,56 USD');
  });

  test('formatNumberCompact formats numbers correctly', () => {
    expect(formatNumberCompact(1234.56)).toBe('1 234,56');
    expect(formatNumberCompact(0)).toBe('0,0');
    expect(formatNumberCompact(-1234.56)).toBe('-1 234,56');
  });

  test('parseNumberSafe parses numbers correctly', () => {
    expect(parseNumberSafe('1234.56')).toBe(1234.56);
    expect(parseNumberSafe('1 234,56')).toBe(1234.56);
    expect(parseNumberSafe('invalid')).toBe(NaN);
    expect(parseNumberSafe('')).toBe(NaN);
  });
});

describe('Percentage Formatting', () => {
  test('formatPercent formats percentages correctly', () => {
    expect(formatPercent(12.34)).toBe('12.3%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(-12.34)).toBe('-12.3%');
  });

  test('formatPercent with options', () => {
    expect(formatPercent(12.34, { showSign: true })).toBe('+12.3%');
    expect(formatPercent(12.34, { decimals: 2 })).toBe('12.34%');
    expect(formatPercent(12.34, { showBrackets: true })).toBe('(12.3%)');
  });

  test('formatPercentChange calculates change correctly', () => {
    expect(formatPercentChange(110, 100)).toBe('+10.0%');
    expect(formatPercentChange(90, 100)).toBe('-10.0%');
    expect(formatPercentChange(100, 0)).toBe('0%');
  });

  test('parsePercentSafe parses percentages correctly', () => {
    expect(parsePercentSafe('12.34%')).toBe(12.34);
    expect(parsePercentSafe('12,34%')).toBe(12.34);
    expect(parsePercentSafe('invalid')).toBe(NaN);
  });
});

describe('Date Formatting', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');

  test('formatDate formats dates correctly', () => {
    expect(formatDate(testDate)).toBe('2024-01-15');
  });

  test('formatDateDisplay formats dates for display', () => {
    expect(formatDateDisplay(testDate)).toBe('15 января 2024 г.');
  });

  test('formatTime formats time correctly', () => {
    expect(formatTime(testDate)).toBe('10:30');
  });

  test('parseDateSafe parses dates correctly', () => {
    expect(parseDateSafe('2024-01-15')).toEqual(new Date('2024-01-15'));
    expect(parseDateSafe('invalid')).toBe(null);
    expect(parseDateSafe('')).toBe(null);
  });
});
