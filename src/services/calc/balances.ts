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
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Determine start date based on period
  const periodStart = (() => {
    const d = new Date(end);
    if (timePeriod === '1M') { d.setMonth(d.getMonth() - 1); return d; }
    if (timePeriod === '3M') { d.setMonth(d.getMonth() - 3); return d; }
    if (timePeriod === '6M') { d.setMonth(d.getMonth() - 6); return d; }
    if (timePeriod === '1Y') { d.setFullYear(d.getFullYear() - 1); return d; }
    // ALL: from earliest data point
    const minX = Math.min(
      ...[...cushionHistory, ...investmentHistory, ...debtsHistory]
        .map(getPointX)
        .filter(v => Number.isFinite(v) && v > 0)
    );
    return Number.isFinite(minX) ? new Date(minX) : new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
  })();

  // Select granularity by period
  type Granularity = 'day' | 'week' | 'month' | 'year';
  // For ALL, fallback to 'month' if the range is short to ensure at least 2 points
  const monthsDiff = (end.getFullYear() - periodStart.getFullYear()) * 12 + (end.getMonth() - periodStart.getMonth());
  const granularity: Granularity =
    timePeriod === '1M' ? 'day' :
    (timePeriod === '3M' || timePeriod === '6M') ? 'week' :
    (timePeriod === '1Y' ? 'month' :
      (monthsDiff <= 18 ? 'month' : 'year'));

  // Build uniform date grid
  const gridDates: Date[] = [];
  if (granularity === 'day' || granularity === 'week') {
    const stepDays = granularity === 'day' ? 1 : 7;
    for (let d = new Date(periodStart); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + stepDays)) {
      gridDates.push(new Date(d));
    }
  } else if (granularity === 'month') {
    for (let d = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      gridDates.push(new Date(d));
    }
  } else { // year
    for (let d = new Date(periodStart.getFullYear(), 0, 1); d <= end; d = new Date(d.getFullYear() + 1, 0, 1)) {
      gridDates.push(new Date(d));
    }
  }

  const sortedDates = gridDates.map(d => d.getTime());
  const labels = gridDates.map(d => d.toISOString().slice(0, 10));

  // Helper: build continuous series using last-known value at or before each grid date
  const buildSeries = (points: AnyPoint[], abs = false): number[] => {
    const sortedPts = [...points]
      .map(p => ({ t: getPointX(p), v: getPointY(p) }))
      .filter(p => Number.isFinite(p.t))
      .sort((a, b) => a.t - b.t);
    let lastVal = sortedPts.length ? (abs ? Math.abs(sortedPts[0].v) : sortedPts[0].v) : 0;
    let idx = 0;
    return sortedDates.map(ts => {
      while (idx < sortedPts.length && sortedPts[idx].t <= ts) {
        lastVal = abs ? Math.abs(sortedPts[idx].v) : sortedPts[idx].v;
        idx += 1;
      }
      return lastVal || 0;
    });
  };

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
      data: buildSeries(cushionHistory, false),
      color: (opacity: number) => `rgba(59, 130, 246, ${opacity})`, // Blue (Подушка)
      strokeWidth: 2,
    });
  }

  if (show.investments) {
    datasets.push({
      data: buildSeries(investmentHistory, false),
      color: (opacity: number) => `rgba(16, 185, 129, ${opacity})`, // Green (Инвестиции)
      strokeWidth: 2,
    });
  }

  if (show.debts) {
    datasets.push({
      data: buildSeries(debtsHistory, true),
      color: (opacity: number) => `rgba(239, 68, 68, ${opacity})`, // Red (Долги)
      strokeWidth: 2,
    });
  }

  if (show.total) {
    const cSeries = buildSeries(cushionHistory, false);
    const iSeries = buildSeries(investmentHistory, false);
    const dSeries = buildSeries(debtsHistory, true);
    datasets.push({
      data: sortedDates.map((_, idx) => {
        const cv = cSeries[idx] || 0;
        const iv = iSeries[idx] || 0;
        const dv = dSeries[idx] || 0;
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