// Balance calculations
// Exact reproduction of current calculation logic

export interface EmergencyTransaction {
  id: number;
  date: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  location: string;
  currency: string;
  note?: string;
}

export interface InvestmentTransaction {
  id: number;
  date: string;
  type: 'in' | 'out';
  amount: number;
  destination: string;
  currency: string;
  note?: string;
}

export interface Debt {
  id: number;
  name: string;
  amount: number;
  currency: string;
  history: Array<{
    id: number;
    date: string;
    type: 'add' | 'repay' | 'close';
    amount: number;
    note?: string;
  }>;
}

export interface Receivable {
  id: number;
  name: string;
  amount: number;
  currency: string;
  history: Array<{
    id: number;
    date: string;
    type: 'add' | 'receive' | 'close';
    amount: number;
  }>;
}

export const getEmergencyHoldingBalance = (
  location: string,
  currency: string,
  emergencyTx: EmergencyTransaction[]
): number => {
  const loc = (location || '').toString();
  const cur = (currency || 'USD').toString();
  let sum = 0;
  for (const tx of emergencyTx) {
    if (((tx.location || '').toString() === loc) && ((tx.currency || 'USD').toString() === cur)) {
      sum += (tx.type === 'deposit' ? 1 : -1) * (Number(tx.amount) || 0);
    }
  }
  return sum;
};

export const getInvestHoldingBalance = (
  destination: string,
  currency: string,
  investTx: InvestmentTransaction[]
): number => {
  const dest = (destination || '').toString();
  const cur = (currency || 'USD').toString();
  let sum = 0;
  for (const tx of investTx) {
    if (((tx.destination || '').toString() === dest) && ((tx.currency || 'USD').toString() === cur)) {
      sum += (tx.type === 'in' ? 1 : -1) * (Number(tx.amount) || 0);
    }
  }
  return sum;
};

export const calculateInvestmentBalance = (investTx: InvestmentTransaction[]): number => {
  return investTx.reduce((sum, it) => sum + (it.type === 'in' ? it.amount : -it.amount), 0);
};

export const calculateTotalDebt = (debts: Debt[]): number => {
  return debts.reduce((sum, d) => sum + (d.amount || 0), 0);
};

export const calculateTotalReceivable = (receivables: Receivable[]): number => {
  return receivables.reduce((sum, r) => sum + (r.amount || 0), 0);
};

export const calculateEmergencyMonths = (cashReserve: number, monthlyExpenses: number): number => {
  return monthlyExpenses > 0 ? (cashReserve / monthlyExpenses) : 0;
};

export const calculateNetWorth = (
  cashReserve: number,
  investmentBalance: number,
  totalDebt: number,
  totalReceivable: number
): number => {
  return cashReserve + investmentBalance + totalReceivable - totalDebt;
};

export const calculateFutureValue = (
  startCapital: number,
  monthlyInvest: number,
  apr: number,
  years: number
): number => {
  const monthlyRate = apr / 12;
  const months = years * 12;
  const futureValue = startCapital * Math.pow(1 + monthlyRate, months) +
    monthlyInvest * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return futureValue;
};

export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return strength;
};
