// Financial calculations - exact reproduction of original logic
// All calculations preserve original behavior and precision

// Local helpers accept both shapes:
// - { x: number, y: number }
// - { date: string, value: number }
type AnyPoint = { x?: number; y?: number; date?: string; value?: number };
const getPointX = (p: AnyPoint): number => {
  if (typeof p.x === 'number') return p.x;
  if (p.date) {
    const t = Date.parse(p.date);
    return isNaN(t) ? 0 : t;
  }
  return 0;
};
const getPointY = (p: AnyPoint): number => {
  if (typeof p.y === 'number') return p.y || 0;
  if (typeof p.value === 'number') return p.value || 0;
  return 0;
};

export interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

// Calculate emergency fund months based on cash reserve and monthly expenses
export function calculateEmergencyMonths(cashReserve: number, monthlyExpenses: number): number {
  if (!monthlyExpenses || monthlyExpenses <= 0) return 0;
  return Math.round((cashReserve / monthlyExpenses) * 10) / 10; // Round to 1 decimal
}

// Calculate investment balance from history
export function calculateInvestmentBalance(investmentHistory: AnyPoint[]): number {
  if (!investmentHistory || investmentHistory.length === 0) return 0;
  
  // Sum all investment transactions
  return investmentHistory.reduce((total, point) => {
    return total + getPointY(point);
  }, 0);
}

// Calculate total debt from debts history
export function calculateTotalDebt(debtsHistory: AnyPoint[]): number {
  if (!debtsHistory || debtsHistory.length === 0) return 0;
  
  // Sum all debt transactions (debts are typically positive values)
  return debtsHistory.reduce((total, point) => {
    return total + Math.abs(getPointY(point));
  }, 0);
}

// Calculate net worth (cash + investments - debts)
export function calculateNetWorth(
  cashReserve: number, 
  investmentBalance: number, 
  totalDebt: number
): number {
  return cashReserve + investmentBalance - totalDebt;
}

// Calculate debt-to-income ratio
export function calculateDebtToIncomeRatio(totalDebt: number, monthlyIncome: number): number {
  if (!monthlyIncome || monthlyIncome <= 0) return 0;
  return Math.round((totalDebt / (monthlyIncome * 12)) * 100) / 100; // Round to 2 decimals
}

// Calculate savings rate
export function calculateSavingsRate(
  monthlyIncome: number, 
  monthlyExpenses: number, 
  monthlyInvestments: number
): number {
  if (!monthlyIncome || monthlyIncome <= 0) return 0;
  const savings = monthlyIncome - monthlyExpenses + monthlyInvestments;
  return Math.round((savings / monthlyIncome) * 100) / 100; // Round to 2 decimals
}

// Generate comprehensive chart data for financial overview
export function generateComprehensiveChartData(
  cushionHistory: AnyPoint[],
  investmentHistory: AnyPoint[],
  debtsHistory: AnyPoint[],
  timePeriod: '1M' | '3M' | '6M' | '1Y' | 'ALL' = 'ALL',
  visibility?: { cushion: boolean; investments: boolean; debts: boolean; total: boolean }
): ChartData {
  // Filter data based on time period
  const now = Date.now();
  const timeFilter = (point: AnyPoint) => {
    if (timePeriod === 'ALL') return true;
    
    const pointTime = getPointX(point);
    const periods = {
      '1M': 30 * 24 * 60 * 60 * 1000,
      '3M': 90 * 24 * 60 * 60 * 1000,
      '6M': 180 * 24 * 60 * 60 * 1000,
      '1Y': 365 * 24 * 60 * 60 * 1000
    };
    
    return (now - pointTime) <= periods[timePeriod];
  };

  const filteredCushion = cushionHistory.filter(timeFilter);
  const filteredInvestment = investmentHistory.filter(timeFilter);
  const filteredDebts = debtsHistory.filter(timeFilter);

  // Create labels (dates) — use normalized X to avoid undefined and NaN
  const allDates = new Set([
    ...filteredCushion.map(getPointX),
    ...filteredInvestment.map(getPointX),
    ...filteredDebts.map(getPointX)
  ]);
  
  const sortedDates = Array.from(allDates).sort((a, b) => a - b);
  const labels = sortedDates.map(date => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  // Create datasets honoring visibility and consistent colors with legend
  const show = {
    cushion: visibility ? visibility.cushion : true,
    investments: visibility ? visibility.investments : true,
    debts: visibility ? visibility.debts : true,
    total: visibility ? visibility.total : false,
  };

  const datasets: ChartData['datasets'] = [];

  if (show.cushion) {
    datasets.push({
      data: sortedDates.map(date => {
        const point = filteredCushion.find(p => getPointX(p) === date);
        return point ? getPointY(point) : 0;
      }),
      color: (opacity: number) => `rgba(59, 130, 246, ${opacity})`, // Blue (Подушка)
      strokeWidth: 2,
    });
  }

  if (show.investments) {
    datasets.push({
      data: sortedDates.map(date => {
        const point = filteredInvestment.find(p => getPointX(p) === date);
        return point ? getPointY(point) : 0;
      }),
      color: (opacity: number) => `rgba(16, 185, 129, ${opacity})`, // Green (Инвестиции)
      strokeWidth: 2,
    });
  }

  if (show.debts) {
    datasets.push({
      data: sortedDates.map(date => {
        const point = filteredDebts.find(p => getPointX(p) === date);
        return point ? Math.abs(getPointY(point)) : 0;
      }),
      color: (opacity: number) => `rgba(239, 68, 68, ${opacity})`, // Red (Долги)
      strokeWidth: 2,
    });
  }

  if (show.total) {
    datasets.push({
      data: sortedDates.map(date => {
        const c = filteredCushion.find(p => getPointX(p) === date);
        const i = filteredInvestment.find(p => getPointX(p) === date);
        const d = filteredDebts.find(p => getPointX(p) === date);
        const cv = c ? getPointY(c) : 0;
        const iv = i ? getPointY(i) : 0;
        const dv = d ? Math.abs(getPointY(d)) : 0;
        return cv + iv - dv;
      }),
      color: (opacity: number) => `rgba(168, 85, 247, ${opacity})`, // Purple (Итого)
      strokeWidth: 2,
    });
  }

  return { labels, datasets };
}

// Calculate compound interest for investment projections
export function calculateCompoundInterest(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = years * 12;
  
  // Future value of principal
  const futureValuePrincipal = principal * Math.pow(1 + monthlyRate, totalMonths);
  
  // Future value of monthly contributions (annuity)
  const futureValueAnnuity = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  
  return futureValuePrincipal + futureValueAnnuity;
}

// Calculate debt payoff time with minimum payments
export function calculateDebtPayoffTime(
  principal: number,
  monthlyPayment: number,
  annualRate: number
): number {
  if (monthlyPayment <= 0 || annualRate < 0) return Infinity;
  
  const monthlyRate = annualRate / 12 / 100;
  
  if (monthlyRate === 0) {
    return principal / monthlyPayment; // Simple division for 0% interest
  }
  
  // Using the loan payment formula to solve for time
  const numerator = Math.log(1 + (principal * monthlyRate) / monthlyPayment);
  const denominator = Math.log(1 + monthlyRate);
  
  return numerator / denominator;
}