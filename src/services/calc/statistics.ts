// Statistical calculations for financial data
// Exact reproduction of original statistical logic

export interface DataPoint {
  x: number;
  y: number;
}

// Calculate basic statistics for a dataset
export function calculateBasicStats(data: DataPoint[]): {
  min: number;
  max: number;
  average: number;
  total: number;
  count: number;
} {
  if (!data || data.length === 0) {
    return { min: 0, max: 0, average: 0, total: 0, count: 0 };
  }

  const values = data.map(point => point.y || 0);
  const total = values.reduce((sum, val) => sum + val, 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = total / values.length;
  const count = values.length;

  return { min, max, average, total, count };
}

// Calculate percentage change between two values
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100; // Round to 2 decimals
}

// Calculate moving average for a dataset
export function calculateMovingAverage(data: DataPoint[], windowSize: number = 7): DataPoint[] {
  if (!data || data.length === 0 || windowSize <= 0) return [];

  const result: DataPoint[] = [];
  
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const average = window.reduce((sum, point) => sum + (point.y || 0), 0) / window.length;
    
    result.push({
      x: data[i].x,
      y: Math.round(average * 100) / 100 // Round to 2 decimals
    });
  }

  return result;
}

// Calculate volatility (standard deviation) for a dataset
export function calculateVolatility(data: DataPoint[]): number {
  if (!data || data.length < 2) return 0;

  const values = data.map(point => point.y || 0);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const variance = values.reduce((sum, val) => {
    return sum + Math.pow(val - average, 2);
  }, 0) / (values.length - 1);

  return Math.round(Math.sqrt(variance) * 100) / 100; // Round to 2 decimals
}

// Calculate Sharpe ratio (risk-adjusted return)
export function calculateSharpeRatio(
  returns: DataPoint[], 
  riskFreeRate: number = 0.02
): number {
  if (!returns || returns.length < 2) return 0;

  const values = returns.map(point => point.y || 0);
  const averageReturn = values.reduce((sum, val) => sum + val, 0) / values.length;
  const volatility = calculateVolatility(returns);
  
  if (volatility === 0) return 0;
  
  return Math.round(((averageReturn - riskFreeRate) / volatility) * 100) / 100;
}

// Calculate correlation between two datasets
export function calculateCorrelation(data1: DataPoint[], data2: DataPoint[]): number {
  if (!data1 || !data2 || data1.length !== data2.length || data1.length < 2) return 0;

  const values1 = data1.map(point => point.y || 0);
  const values2 = data2.map(point => point.y || 0);
  
  const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
  
  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;
  
  for (let i = 0; i < values1.length; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2);
  
  if (denominator === 0) return 0;
  
  return Math.round((numerator / denominator) * 100) / 100; // Round to 2 decimals
}

// Calculate growth rate (CAGR - Compound Annual Growth Rate)
export function calculateGrowthRate(
  initialValue: number, 
  finalValue: number, 
  timePeriodYears: number
): number {
  if (initialValue <= 0 || timePeriodYears <= 0) return 0;
  
  const growthRate = Math.pow(finalValue / initialValue, 1 / timePeriodYears) - 1;
  return Math.round(growthRate * 100 * 100) / 100; // Round to 2 decimals
}

// Calculate value at risk (VaR) - 95% confidence level
export function calculateValueAtRisk(data: DataPoint[], confidenceLevel: number = 0.95): number {
  if (!data || data.length < 2) return 0;

  const returns = data.map(point => point.y || 0);
  const sortedReturns = [...returns].sort((a, b) => a - b);
  
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  return sortedReturns[index] || 0;
}

// Calculate maximum drawdown
export function calculateMaxDrawdown(data: DataPoint[]): number {
  if (!data || data.length < 2) return 0;

  let maxValue = data[0].y || 0;
  let maxDrawdown = 0;
  
  for (let i = 1; i < data.length; i++) {
    const currentValue = data[i].y || 0;
    
    if (currentValue > maxValue) {
      maxValue = currentValue;
    }
    
    const drawdown = (maxValue - currentValue) / maxValue;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return Math.round(maxDrawdown * 100 * 100) / 100; // Round to 2 decimals
}
