// Calculation utilities tests - exact reproduction of current calculation behavior
import { 
  getEmergencyHoldingBalance, 
  getInvestHoldingBalance, 
  calculateInvestmentBalance, 
  calculateTotalDebt, 
  calculateTotalReceivable,
  calculateEmergencyMonths,
  calculateNetWorth,
  calculateFutureValue,
  calculatePasswordStrength
} from '../services/calc/balances';
import { calculateStats, calculateChartBounds, calculateTradeStats, calculateRiskAmount } from '../services/calc/stats';
import type { EmergencyTransaction, InvestmentTransaction, Debt, Receivable, DataPoint } from '../services/calc/balances';

describe('Balance Calculations', () => {
  const emergencyTx: EmergencyTransaction[] = [
    { id: 1, date: '2024-01-01', type: 'deposit', amount: 1000, location: 'Bank', currency: 'USD', note: 'Initial deposit' },
    { id: 2, date: '2024-01-02', type: 'withdraw', amount: 200, location: 'Bank', currency: 'USD', note: 'Withdrawal' },
    { id: 3, date: '2024-01-03', type: 'deposit', amount: 500, location: 'Cash', currency: 'USD', note: 'Cash deposit' }
  ];

  const investTx: InvestmentTransaction[] = [
    { id: 1, date: '2024-01-01', type: 'in', amount: 2000, destination: 'Stocks', currency: 'USD', note: 'Stock investment' },
    { id: 2, date: '2024-01-02', type: 'out', amount: 300, destination: 'Stocks', currency: 'USD', note: 'Stock withdrawal' },
    { id: 3, date: '2024-01-03', type: 'in', amount: 1000, destination: 'Crypto', currency: 'USD', note: 'Crypto investment' }
  ];

  const debts: Debt[] = [
    { id: 1, name: 'Credit Card', amount: 1500, currency: 'USD', history: [] },
    { id: 2, name: 'Loan', amount: 5000, currency: 'USD', history: [] }
  ];

  const receivables: Receivable[] = [
    { id: 1, name: 'Invoice', amount: 2000, currency: 'USD', history: [] },
    { id: 2, name: 'Refund', amount: 500, currency: 'USD', history: [] }
  ];

  test('getEmergencyHoldingBalance calculates correctly', () => {
    expect(getEmergencyHoldingBalance('Bank', 'USD', emergencyTx)).toBe(800); // 1000 - 200
    expect(getEmergencyHoldingBalance('Cash', 'USD', emergencyTx)).toBe(500);
    expect(getEmergencyHoldingBalance('Nonexistent', 'USD', emergencyTx)).toBe(0);
  });

  test('getInvestHoldingBalance calculates correctly', () => {
    expect(getInvestHoldingBalance('Stocks', 'USD', investTx)).toBe(1700); // 2000 - 300
    expect(getInvestHoldingBalance('Crypto', 'USD', investTx)).toBe(1000);
    expect(getInvestHoldingBalance('Nonexistent', 'USD', investTx)).toBe(0);
  });

  test('calculateInvestmentBalance calculates correctly', () => {
    expect(calculateInvestmentBalance(investTx)).toBe(2700); // 2000 - 300 + 1000
  });

  test('calculateTotalDebt calculates correctly', () => {
    expect(calculateTotalDebt(debts)).toBe(6500); // 1500 + 5000
  });

  test('calculateTotalReceivable calculates correctly', () => {
    expect(calculateTotalReceivable(receivables)).toBe(2500); // 2000 + 500
  });

  test('calculateEmergencyMonths calculates correctly', () => {
    expect(calculateEmergencyMonths(6000, 2000)).toBe(3); // 6000 / 2000
    expect(calculateEmergencyMonths(0, 2000)).toBe(0);
    expect(calculateEmergencyMonths(6000, 0)).toBe(0);
  });

  test('calculateNetWorth calculates correctly', () => {
    expect(calculateNetWorth(6000, 2700, 6500, 2500)).toBe(4700); // 6000 + 2700 + 2500 - 6500
  });

  test('calculateFutureValue calculates correctly', () => {
    const result = calculateFutureValue(10000, 500, 0.12, 5);
    expect(result).toBeCloseTo(50000, -2); // Approximate calculation
  });

  test('calculatePasswordStrength calculates correctly', () => {
    expect(calculatePasswordStrength('password')).toBe(2); // length + lowercase
    expect(calculatePasswordStrength('Password123!')).toBe(5); // all criteria
    expect(calculatePasswordStrength('')).toBe(0);
  });
});

describe('Statistics Calculations', () => {
  const data: DataPoint[] = [
    { date: '2024-01-01', value: 1000 },
    { date: '2024-01-02', value: 1200 },
    { date: '2024-01-03', value: 800 },
    { date: '2024-01-04', value: 1500 },
    { date: '2024-01-05', value: 1100 }
  ];

  test('calculateStats calculates correctly', () => {
    const stats = calculateStats(data);
    expect(stats.average).toBe(1120); // (1000 + 1200 + 800 + 1500 + 1100) / 5
    expect(stats.min).toBe(800);
    expect(stats.max).toBe(1500);
    expect(stats.change).toBe(100); // 1100 - 1000
    expect(stats.changePercent).toBe(10); // (100 / 1000) * 100
    expect(stats.firstAmount).toBe(1000);
    expect(stats.lastAmount).toBe(1100);
  });

  test('calculateStats handles empty data', () => {
    const stats = calculateStats([]);
    expect(stats.average).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.change).toBe(0);
    expect(stats.changePercent).toBe(0);
    expect(stats.firstAmount).toBe(0);
    expect(stats.lastAmount).toBe(0);
  });

  test('calculateChartBounds calculates correctly', () => {
    const bounds = calculateChartBounds(data);
    expect(bounds.yMin).toBeLessThan(800);
    expect(bounds.yMax).toBeGreaterThan(1500);
  });

  test('calculateChartBounds handles empty data', () => {
    const bounds = calculateChartBounds([]);
    expect(bounds.yMin).toBe(0);
    expect(bounds.yMax).toBe(1000);
  });

  test('calculateTradeStats calculates correctly', () => {
    const trades = [
      {
        side: 'BUY',
        price: 100,
        qty: 10,
        currentPrice: 110,
        remainingQty: 5,
        closures: [
          { id: 1, qty: 5, price: 105, date: '2024-01-01' }
        ]
      }
    ];

    const stats = calculateTradeStats(trades);
    expect(stats.realized).toBe(25); // (105 - 100) * 5
    expect(stats.unrealized).toBe(50); // (110 - 100) * 5
    expect(stats.total).toBe(75); // 25 + 50
    expect(stats.totalVolume).toBe(1000); // 100 * 10
  });

  test('calculateRiskAmount calculates correctly', () => {
    expect(calculateRiskAmount(10000, 2, 95, 100)).toBe(4); // (10000 * 0.02) / (100 - 95)
    expect(calculateRiskAmount(0, 2, 95, 100)).toBe(0);
    expect(calculateRiskAmount(10000, 0, 95, 100)).toBe(0);
  });
});
