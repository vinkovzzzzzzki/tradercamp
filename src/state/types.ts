// State types
// Exact reproduction of current state structure

export interface User {
  id: string;
  nickname: string;
  bio: string;
  avatar: string;
  friends: number[];
}

export interface SupaAuth {
  user: {
    id: string;
    email: string;
  };
  session: any;
}

export interface Toast {
  msg: string;
  kind: 'info' | 'warning' | 'error';
}

export interface FinanceForm {
  isEmployed: boolean | null;
  typicalIncomeAmount: string;
  incomeCurrency: string;
  incomeDays: number[];
  emergencyBase: number;
  notifyEnabled: boolean;
}

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

export interface FinanceData {
  [userId: string]: {
    emergencyTx: EmergencyTransaction[];
    investTx: InvestmentTransaction[];
    debts: Debt[];
    receivableTx: Receivable[];
    notifyEnabled: boolean;
    notifIds: string[];
  };
}

export interface Trade {
  id: number;
  userId: string;
  market: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  currentPrice?: number;
  remainingQty?: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingEnabled?: boolean;
  trailingType?: 'percent' | 'amount';
  trailingValue?: number;
  date: string;
  note?: string;
  closures?: Array<{
    id: number;
    qty: number;
    price: number;
    date: string;
  }>;
}

export interface Workout {
  id: number;
  userId: string;
  date: string;
  time: string;
  type: string;
  notes: string;
  remindBefore: number;
}

export interface Event {
  id: number;
  userId: string;
  date: string;
  time: string;
  title: string;
  notes: string;
  remindBefore: number;
  category: string;
  reminders: number[];
}

export interface PlannerPrefs {
  enabled: boolean;
  time: string;
  notifId: string | null;
}

export interface Recurring {
  startDate: string;
  time: string;
  type: string;
  notes: string;
  remindBefore: number;
  days: {
    Sun: boolean;
    Mon: boolean;
    Tue: boolean;
    Wed: boolean;
    Thu: boolean;
    Fri: boolean;
    Sat: boolean;
  };
  weeks: number;
}

export interface Post {
  id: number;
  userId: string | number;  // Может быть и string и number
  title: string;
  content: string;
  market: string;
  images: string[];
  date: string;
  likes: (string | number)[];  // Может быть и string и number
  comments: Array<{
    id: number;
    userId: string | number;
    text: string;
    date: string;
  }>;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface ChartVisibility {
  cushion: boolean;
  investments: boolean;
  debts: boolean;
  total: boolean;
}

export interface ChartTooltip {
  visible: boolean;
  x: number;
  y: number;
  data: any;
}

export interface DataPoint {
  date: string;
  value: number;
  amount?: number;  // Alias для совместимости
  y?: number;        // Для графиков
}

export interface ChartData {
  cushion: DataPoint[];
  investments: DataPoint[];
  debts: DataPoint[];
  total: DataPoint[];
}

export type TabType = 'finance' | 'journal' | 'planner' | 'community' | 'profile';
export type ProfileTabType = 'overview' | 'friends' | 'achievements' | 'settings';
export type AuthModeType = 'login' | 'register';
export type FinanceViewType = 'summary' | 'fund' | 'invest' | 'debts' | 'transactions' | null;
export type JournalViewType = 'new' | 'list' | null;
export type CalendarViewType = 'news' | 'workouts' | 'events' | null;
export type ChartTimePeriodType = 'days' | 'weeks' | 'months';
export type PlannerViewType = 'month' | 'week' | 'day';
export type PlannerComposeType = 'event' | 'workout';
export type PostSortType = 'date_desc' | 'likes_desc';
