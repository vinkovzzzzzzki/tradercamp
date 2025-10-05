// Statistics calculations
// Exact reproduction of current calculation logic

export interface DataPoint {
  date: string;
  value: number;
}

export interface ChartData {
  cushion: DataPoint[];
  investments: DataPoint[];
  debts: DataPoint[];
  total: DataPoint[];
}

export const calculateStats = (data: DataPoint[]) => {
  if (data.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      change: 0,
      changePercent: 0,
      firstAmount: 0,
      lastAmount: 0
    };
  }

  const amounts = data.map(d => d.value);
  const firstAmount = amounts[0];
  const lastAmount = amounts[amounts.length - 1];
  const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const change = lastAmount - firstAmount;
  const changePercent = firstAmount > 0 ? ((change / firstAmount) * 100) : 0;

  return {
    average,
    min,
    max,
    change,
    changePercent,
    firstAmount,
    lastAmount
  };
};

export const calculateChartBounds = (data: DataPoint[]) => {
  if (data.length === 0) {
    return { yMin: 0, yMax: 1000 };
  }

  const allValues = data.map(d => d.value);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = Math.max(range * 0.15, Math.abs(maxValue) * 0.1, 200);
  const yMin = Math.min(0, minValue - padding * 1.5);
  const yMax = maxValue + padding;

  return { yMin, yMax };
};

export const calculateTradeStats = (trades: any[]) => {
  let realized = 0;
  let unrealized = 0;
  let totalVolume = 0;

  for (const t of trades) {
    const tradeRealized = (t.closures || []).reduce((sum: number, c: any) => {
      const sign = t.side === 'BUY' ? 1 : -1;
      return sum + sign * (c.price - t.price) * c.qty;
    }, 0);
    realized += tradeRealized;
    
    const rem = (t.remainingQty ?? t.qty);
    if (rem > 0) {
      const currentPrice = t.currentPrice || t.price;
      const sign = t.side === 'BUY' ? 1 : -1;
      unrealized += sign * (currentPrice - t.price) * rem;
    }
    
    totalVolume += t.price * t.qty;
  }

  return {
    realized,
    unrealized,
    total: realized + unrealized,
    totalVolume
  };
};

export const calculateRiskAmount = (
  account: number,
  riskPercent: number,
  stopLossPrice: number,
  entryPrice: number
): number => {
  if (!account || !riskPercent || !stopLossPrice || !entryPrice) return 0;
  
  const riskAmount = account * (riskPercent / 100);
  const priceDiff = Math.abs(entryPrice - stopLossPrice);
  if (priceDiff === 0) return 0;
  
  return riskAmount / priceDiff;
};

export const getImportanceStars = (importance: number): string => {
  return '★'.repeat(importance);
};
