// Financial calculations - exact reproduction of original logic
// All calculations preserve original behavior and precision

export interface DataPoint {
  x: number;
  y: number;
}

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
export function calculateInvestmentBalance(investmentHistory: DataPoint[]): number {
  if (!investmentHistory || investmentHistory.length === 0) return 0;
  
  // Sum all investment transactions
  return investmentHistory.reduce((total, point) => {
    return total + (point.y || 0);
  }, 0);
}

// Calculate total debt from debts history
export function calculateTotalDebt(debtsHistory: DataPoint[]): number {
  if (!debtsHistory || debtsHistory.length === 0) return 0;
  
  // Sum all debt transactions (debts are typically positive values)
  return debtsHistory.reduce((total, point) => {
    return total + Math.abs(point.y || 0);
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
  cushionHistory: DataPoint[],
  investmentHistory: DataPoint[],
  debtsHistory: DataPoint[],
  timePeriod: '1M' | '3M' | '6M' | '1Y' | 'ALL' = 'ALL'
): ChartData {
  // Filter data based on time period
  const now = Date.now();
  const timeFilter = (point: DataPoint) => {
    if (timePeriod === 'ALL') return true;
    
    const pointTime = point.x;
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

  // Create labels (dates)
  const allDates = new Set([
    ...filteredCushion.map(p => p.x),
    ...filteredInvestment.map(p => p.x),
    ...filteredDebts.map(p => p.x)
  ]);
  
  const sortedDates = Array.from(allDates).sort((a, b) => a - b);
  const labels = sortedDates.map(date => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  // Create datasets
  const datasets = [
    {
      data: sortedDates.map(date => {
        const point = filteredCushion.find(p => p.x === date);
        return point ? point.y : 0;
      }),
      color: (opacity: number) => `rgba(34, 197, 94, ${opacity})`, // Green for emergency fund
      strokeWidth: 2
    },
    {
      data: sortedDates.map(date => {
        const point = filteredInvestment.find(p => p.x === date);
        return point ? point.y : 0;
      }),
      color: (opacity: number) => `rgba(59, 130, 246, ${opacity})`, // Blue for investments
      strokeWidth: 2
    },
    {
      data: sortedDates.map(date => {
        const point = filteredDebts.find(p => p.x === date);
        return point ? Math.abs(point.y) : 0; // Debts as positive values
      }),
      color: (opacity: number) => `rgba(239, 68, 68, ${opacity})`, // Red for debts
      strokeWidth: 2
    }
  ];

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