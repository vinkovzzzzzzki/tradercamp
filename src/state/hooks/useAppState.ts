// Main app state hook
// Exact reproduction of current state logic

import { useState, useEffect, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { storage, STORAGE_KEYS } from '../../services/persist';
import { 
  calculateEmergencyMonths, 
  calculateInvestmentBalance, 
  calculateTotalDebt,
  generateComprehensiveChartData 
} from '../../services/calc/balances';
import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentSession,
  getUserProfile,
  updateUserProfile,
  resetPassword,
  onAuthStateChange
} from '../../services/auth';
import { 
  fetchUserTrades, insertTrade as insertTradeDb, deleteTradeById,
  fetchEmergencyTx, insertEmergencyTx, deleteEmergencyTxById,
  fetchInvestTx, insertInvestTx, deleteInvestTxById,
  fetchDebts, insertDebt, deleteDebtById, updateDebtAmount,
  fetchWorkouts, insertWorkout, deleteWorkoutById,
  fetchEvents, insertEvent, deleteEventById,
  fetchPosts, insertPost, deletePostById, updatePostLikes, updatePostComments
} from '../../services/db';
import type { 
  TabType, 
  ProfileTabType, 
  AuthModeType, 
  FinanceViewType, 
  JournalViewType, 
  CalendarViewType,
  ChartTimePeriodType,
  PlannerViewType,
  PlannerComposeType,
  PostSortType,
  SupaAuth,
  User,
  Toast,
  FinanceForm,
  FinanceData,
  Trade,
  Workout,
  Event,
  PlannerPrefs,
  Recurring,
  Post,
  Achievement,
  ChartVisibility,
  ChartTooltip,
  DataPoint,
  ChartData,
  EmergencyTransaction,
  InvestmentTransaction
} from '../types';

export const useAppState = () => {
  // Navigation state
  const [tab, setTab] = useState<TabType>('finance');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTabType>('overview');
  
  // Animation refs
  const tabAnimation = useRef(new Animated.Value(0)).current;
  const dropdownAnimations = useRef<Record<string, Animated.Value>>({}).current;
  const buttonAnimations = useRef<Record<string, Animated.Value>>({}).current;
  
  // Auth state
  const [supaAuth, setSupaAuth] = useState<SupaAuth | null>(() => 
    storage.get(STORAGE_KEYS.SUPA_AUTH, null)
  );
  const [supaProfiles, setSupaProfiles] = useState<Record<string, User>>(() => 
    storage.get(STORAGE_KEYS.SUPA_PROFILES, {})
  );
  const [authMode, setAuthMode] = useState<AuthModeType>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Theme and UI (force dark theme)
  const appTheme = 'dark';
  const [toast, setToast] = useState<Toast | null>(null);
  
  // Finance state
  const [startCapital, setStartCapital] = useState(10000);
  const [monthlyInvest, setMonthlyInvest] = useState(500);
  const [apr, setApr] = useState(0.12);
  const [years, setYears] = useState(5);
  const [monthlyExpenses, setMonthlyExpenses] = useState(1500);
  const [cashReserve, setCashReserve] = useState(4000);
  const [financeData, setFinanceData] = useState<FinanceData>(() => 
    storage.get(STORAGE_KEYS.FINANCE_DATA, {})
  );
  const [financeEditMode, setFinanceEditMode] = useState(false);
  const [financeForm, setFinanceForm] = useState<FinanceForm>({
    isEmployed: null,
    typicalIncomeAmount: '',
    incomeCurrency: 'USD',
    incomeDays: [],
    emergencyBase: 0,
    notifyEnabled: false
  });
  
  // Views
  const [financeView, setFinanceView] = useState<FinanceViewType>('summary');
  const [journalView, setJournalView] = useState<JournalViewType>(null);
  const [calendarView, setCalendarView] = useState<CalendarViewType>(null);
  const [chartTimePeriod, setChartTimePeriod] = useState<ChartTimePeriodType>('days');
  
  // Chart state
  const [chartVisibility, setChartVisibility] = useState<ChartVisibility>({ 
    cushion: true, 
    investments: true, 
    debts: true, 
    total: true 
  });
  const [chartTooltip, setChartTooltip] = useState<ChartTooltip>({ 
    visible: false, 
    x: 0, 
    y: 0, 
    data: null 
  });
  
  // History data
  const nowIso = new Date().toISOString().slice(0, 10);
  const seedIfEmpty = <T extends DataPoint[]>(key: string, seed: T): T => {
    const stored = storage.get(key, []) as T;
    return (Array.isArray(stored) && (stored as unknown as any[]).length > 0) ? stored : seed;
  };
  // Seed demo history so chart renders without auth/data
  const [cushionHistory, setCushionHistory] = useState<DataPoint[]>(() => 
    seedIfEmpty(STORAGE_KEYS.CUSHION_HISTORY, [
      { date: nowIso, value: 3000, y: 3000 },
      { date: nowIso, value: 3500, y: 3500 }
    ] as any)
  );
  const [investmentHistory, setInvestmentHistory] = useState<DataPoint[]>(() => 
    seedIfEmpty(STORAGE_KEYS.INVESTMENT_HISTORY, [
      { date: nowIso, value: 2000, y: 2000 },
      { date: nowIso, value: 2600, y: 2600 }
    ] as any)
  );
  const [debtsHistory, setDebtsHistory] = useState<DataPoint[]>(() => 
    seedIfEmpty(STORAGE_KEYS.DEBTS_HISTORY, [
      { date: nowIso, value: 1500, y: 1500 },
      { date: nowIso, value: 1400, y: 1400 }
    ] as any)
  );
  
  // Trades
  const [trades, setTrades] = useState<Trade[]>(() => 
    storage.get(STORAGE_KEYS.TRADES, [])
  );

  // Hydrate trades on native where sync localStorage is unavailable
  useEffect(() => {
    let mounted = true;
    (async () => {
      const asyncTrades = await storage.getAsync(STORAGE_KEYS.TRADES, null);
      if (mounted && Array.isArray(asyncTrades) && asyncTrades.length > 0) {
        setTrades(asyncTrades);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
  // Planner
  const [plannerPrefs, setPlannerPrefs] = useState<PlannerPrefs>(() => 
    storage.get(STORAGE_KEYS.PLANNER_PREFS, { enabled: false, time: '22:00', notifId: null })
  );
  const [recurring, setRecurring] = useState<Recurring>({
    startDate: new Date().toISOString().slice(0, 10),
    time: '09:00',
    type: 'Тренировка',
    notes: '',
    remindBefore: 15,
    days: { Sun: false, Mon: true, Wed: true, Fri: true, Tue: false, Thu: false, Sat: false },
    weeks: 4
  });
  const [plannerView, setPlannerView] = useState<PlannerViewType>('month');
  const [plannerDate, setPlannerDate] = useState(new Date());
  const [plannerComposeOpen, setPlannerComposeOpen] = useState(false);
  const [plannerComposeType, setPlannerComposeType] = useState<PlannerComposeType>('event');
  const [plannerEditing, setPlannerEditing] = useState<{ id: string; type: 'event' | 'workout' } | null>(null);
  const [plannerShowNews, setPlannerShowNews] = useState(true);
  
  // Workouts and Events
  const [workouts, setWorkouts] = useState<Workout[]>([
    { id: 1, userId: 'demo', date: '2024-01-15', time: '09:00', type: 'Бег', notes: '5 км', remindBefore: 15 },
    { id: 2, userId: 'demo', date: '2024-01-17', time: '18:00', type: 'Йога', notes: 'Дома', remindBefore: 30 }
  ]);
  const [events, setEvents] = useState<Event[]>([
    { id: 1, userId: 'demo', date: '2024-01-20', time: '14:00', title: 'Встреча с клиентом', notes: 'Обсуждение проекта', remindBefore: 60, category: 'Работа', reminders: [60, 15] }
  ]);
  
  // Community
  const [posts, setPosts] = useState<Post[]>(() => {
    const stored = storage.get(STORAGE_KEYS.POSTS, []);
    const demoPostsSeed = [
      { id: 1, userId: 'demo', title: 'Анализ BTC/USD', content: 'Думаю, что биткоин может достичь $100k к концу года. #BTC #криптовалюта', market: 'Crypto', images: [], date: '2024-01-15T10:00:00Z', likes: ['user1', 'user2'], comments: [] },
      { id: 2, userId: 'demo', title: 'Новости по акциям', content: 'Tesla показала хорошие результаты в Q4. @elonmusk #TSLA', market: 'Stocks', images: [], date: '2024-01-14T15:30:00Z', likes: ['user1'], comments: [] }
    ];
    return (Array.isArray(stored) && stored.length > 0) ? stored : demoPostsSeed;
  });
  const [bookmarks, setBookmarks] = useState<Record<string, number[]>>(() => 
    storage.get(STORAGE_KEYS.BOOKMARKS, {})
  );
  
  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 1, title: '🎯 Первая сделка', description: 'Открыта первая торговая позиция', unlocked: false },
    { id: 2, title: '💰 Инвестор', description: 'Инвестировано $1000', unlocked: false },
    { id: 3, title: '📈 Трейдер', description: '10 успешных сделок', unlocked: false },
    { id: 4, title: '🏆 Чемпион', description: '100 лайков на постах', unlocked: false },
    { id: 5, title: '📚 Ученик', description: 'Прочитано 10 статей', unlocked: false },
    { id: 6, title: '💪 Спортсмен', description: '5 тренировок добавлено', unlocked: false },
    { id: 7, title: '🏃‍♂️ Баланс', description: '10 тренировок добавлено', unlocked: false },
    { id: 8, title: '📰 Инсайдер', description: '50 экономических новостей отслежено', unlocked: false }
  ]);
  
  // Additional states for Dashboard
  const [newEmergencyTx, setNewEmergencyTx] = useState({ type: 'deposit', amount: '', currency: 'USD', location: '', note: '' });
  const [newInvestTx, setNewInvestTx] = useState({ type: 'in', amount: '', currency: 'USD', destination: '', note: '' });
  const [newDebt, setNewDebt] = useState({ name: '', amount: '', currency: 'USD' });
  const [repayDrafts, setRepayDrafts] = useState<Record<number, string>>({});
  const [showEmergencyLocationDropdown, setShowEmergencyLocationDropdown] = useState(false);
  const [showInvestDestinationDropdown, setShowInvestDestinationDropdown] = useState(false);
  const [emergencyLocations, setEmergencyLocations] = useState<string[]>(() => 
    storage.get(STORAGE_KEYS.EMERGENCY_LOCATIONS, [])
  );
  const [investDestinations, setInvestDestinations] = useState<string[]>(() => 
    storage.get(STORAGE_KEYS.INVEST_DESTINATIONS, [])
  );
  const [sortedDebts, setSortedDebts] = useState<any[]>(() => 
    storage.get(STORAGE_KEYS.SORTED_DEBTS, [])
  );
  const [investHoldings, setInvestHoldings] = useState<Array<{ destination: string; currency: string; balance: number }>>([]);
  
  // Additional states for Dashboard  
  const [emergencyTx, setEmergencyTx] = useState<EmergencyTransaction[]>(() => 
    storage.get(STORAGE_KEYS.EMERGENCY_TX, [])
  );
  const [investTx, setInvestTx] = useState<InvestmentTransaction[]>(() => 
    storage.get(STORAGE_KEYS.INVEST_TX, [])
  );
  
  // Computed values (moved to services-calc below)
  
  // Persist state changes
  useEffect(() => storage.set(STORAGE_KEYS.SUPA_AUTH, supaAuth), [supaAuth]);
  useEffect(() => storage.set(STORAGE_KEYS.SUPA_PROFILES, supaProfiles), [supaProfiles]);
  // no-op: appTheme fixed to dark
  useEffect(() => storage.set(STORAGE_KEYS.FINANCE_DATA, financeData), [financeData]);
  useEffect(() => storage.set(STORAGE_KEYS.CUSHION_HISTORY, cushionHistory), [cushionHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.INVESTMENT_HISTORY, investmentHistory), [investmentHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.DEBTS_HISTORY, debtsHistory), [debtsHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.PLANNER_PREFS, plannerPrefs), [plannerPrefs]);
  useEffect(() => storage.set(STORAGE_KEYS.POSTS, posts), [posts]);
  useEffect(() => storage.set(STORAGE_KEYS.BOOKMARKS, bookmarks), [bookmarks]);
  useEffect(() => storage.set(STORAGE_KEYS.EMERGENCY_TX, emergencyTx), [emergencyTx]);
  useEffect(() => storage.set(STORAGE_KEYS.INVEST_TX, investTx), [investTx]);
  useEffect(() => storage.set(STORAGE_KEYS.SORTED_DEBTS, sortedDebts), [sortedDebts]);
  useEffect(() => storage.set(STORAGE_KEYS.EMERGENCY_LOCATIONS, emergencyLocations), [emergencyLocations]);
  useEffect(() => storage.set(STORAGE_KEYS.INVEST_DESTINATIONS, investDestinations), [investDestinations]);
  useEffect(() => {
    storage.set(STORAGE_KEYS.TRADES, trades);
    // Fire-and-forget async persist for native
    storage.setAsync?.(STORAGE_KEYS.TRADES, trades);
  }, [trades]);
  useEffect(() => storage.set(STORAGE_KEYS.WORKOUTS, workouts), [workouts]);
  useEffect(() => storage.set(STORAGE_KEYS.EVENTS, events), [events]);
  
  // Computed values
  const isDark = true;
  const currentSupaUser = supaAuth && supaAuth.user ? supaAuth.user : null;
  const currentUser = currentSupaUser ? (() => {
    const overlay = supaProfiles[currentSupaUser.id] || {};
    return {
      id: currentSupaUser.id,
      nickname: (overlay as any).nickname || (currentSupaUser.email || 'user').split('@')[0],
      bio: (overlay as any).bio || '',
      avatar: (overlay as any).avatar || '',
      friends: Array.isArray((overlay as any).friends) ? (overlay as any).friends : []
    };
  })() : {
    id: 'demo',
    nickname: 'Гость',
    bio: '',
    avatar: '',
    friends: []
  } as any;
  
  const currentFinance = currentUser ? (financeData[currentUser.id] || {}) : null;
  
  const investmentBalance = useMemo(() => {
    return investTx.reduce((sum, it) => sum + (it.type === 'in' ? it.amount : -it.amount), 0);
  }, [investTx]);
  
  // Use services for calculations
  const emergencyMonths = useMemo(() => {
    return calculateEmergencyMonths(cashReserve, monthlyExpenses);
  }, [cashReserve, monthlyExpenses]);
  
  const totalDebt = useMemo(() => {
    return calculateTotalDebt(debtsHistory);
  }, [debtsHistory]);
  
  // Business logic functions
  const addEmergencyTransaction = () => {
    if (!newEmergencyTx.amount || !newEmergencyTx.currency || !newEmergencyTx.location) return;
    
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: newEmergencyTx.type as 'deposit' | 'withdraw',
      amount: Number(newEmergencyTx.amount),
      currency: newEmergencyTx.currency,
      location: newEmergencyTx.location,
      note: newEmergencyTx.note
    };
    
    setEmergencyTx(prev => [...prev, newTx]);
    // Persist to Supabase (optimistic)
    (async () => {
      if (!currentUser?.id) return;
      const saved = await insertEmergencyTx(currentUser.id, {
        date: newTx.date,
        type: newTx.type,
        amount: newTx.amount,
        currency: newTx.currency,
        location: newTx.location,
        note: newTx.note ?? null
      } as any);
      if (saved) {
        setEmergencyTx(prev => prev.map(t => t.id === newTx.id ? { ...t, id: (saved as any).id } : t));
      }
    })();
    
    // Update cashReserve based on transaction type
    const amountChange = newTx.type === 'deposit' ? newTx.amount : -newTx.amount;
    const newCashReserve = cashReserve + amountChange;
    setCashReserve(newCashReserve);
    
      // Update cushion history for chart
      setCushionHistory(prev => [
        ...prev,
        {
          date: newTx.date,
          value: newCashReserve,
          amount: newCashReserve,
          y: newCashReserve
        }
      ]);
    
    setNewEmergencyTx({ type: 'deposit', amount: '', currency: 'USD', location: '', note: '' });
    
    // Update locations
    if (!emergencyLocations.includes(newEmergencyTx.location)) {
      setEmergencyLocations(prev => [...prev, newEmergencyTx.location]);
    }
  };
  
  const addInvestmentTransaction = () => {
    if (!newInvestTx.amount || !newInvestTx.currency || !newInvestTx.destination) return;
    
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: newInvestTx.type as 'in' | 'out',
      amount: Number(newInvestTx.amount),
      currency: newInvestTx.currency,
      destination: newInvestTx.destination,
      note: newInvestTx.note
    };
    
    setInvestTx(prev => {
      const updated = [...prev, newTx];
      // Calculate new investment balance
      const newBalance = updated.reduce((sum, it) => sum + (it.type === 'in' ? it.amount : -it.amount), 0);
      
      // Update investment history for chart
      setInvestmentHistory(prev => [
        ...prev,
        {
          date: newTx.date,
          value: newBalance,
          amount: newBalance,
          y: newBalance
        }
      ]);
      
      return updated;
    });
    // Persist to Supabase (optimistic)
    (async () => {
      if (!currentUser?.id) return;
      const saved = await insertInvestTx(currentUser.id, {
        date: newTx.date,
        type: newTx.type,
        amount: newTx.amount,
        currency: newTx.currency,
        destination: newTx.destination,
        note: newTx.note ?? null
      } as any);
      if (saved) {
        setInvestTx(prev => prev.map(t => t.id === newTx.id ? { ...t, id: (saved as any).id } : t));
      }
    })();
    
    setNewInvestTx({ type: 'in', amount: '', currency: 'USD', destination: '', note: '' });
    
    // Update destinations
    if (!investDestinations.includes(newInvestTx.destination)) {
      setInvestDestinations(prev => [...prev, newInvestTx.destination]);
    }
  };
  
  const addDebt = () => {
    if (!newDebt.name || !newDebt.amount || !newDebt.currency) return;
    
    const newDebtObj = {
      id: Date.now(),
      name: newDebt.name,
      amount: Number(newDebt.amount),
      currency: newDebt.currency,
      history: [{
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: 'add' as const,
        amount: Number(newDebt.amount),
        note: 'Initial debt'
      }]
    };
    
    setSortedDebts(prev => {
      const updated = [...prev, newDebtObj];
      // Calculate total debt
      const totalDebt = updated.reduce((s, d) => s + (d.amount || 0), 0);
      
      // Update debts history for chart
      setDebtsHistory(prev => [
        ...prev,
        {
          date: newDebtObj.history[0].date,
          value: totalDebt,
          amount: totalDebt,
          y: totalDebt
        }
      ]);
      
      return updated;
    });
    // Persist to Supabase (optimistic)
    (async () => {
      if (!currentUser?.id) return;
      const saved = await insertDebt(currentUser.id, {
        name: newDebtObj.name,
        amount: newDebtObj.amount,
        currency: newDebtObj.currency
      } as any);
      if (saved) {
        setSortedDebts(prev => prev.map(d => d.id === newDebtObj.id ? { ...d, id: (saved as any).id } : d));
      }
    })();
    
    setNewDebt({ name: '', amount: '', currency: 'USD' });
  };
  
  const deleteEmergencyTx = (id: number) => {
    setEmergencyTx(prev => {
      const removed = prev.find(tx => tx.id === id);
      const updated = prev.filter(tx => tx.id !== id);
      // Recalculate cash reserve
      const newCashReserve = updated.reduce((sum, tx) => 
        sum + (tx.type === 'deposit' ? tx.amount : -tx.amount), 0);
      setCashReserve(newCashReserve);
      
      // Update cushion history
      setCushionHistory(prev => [
        ...prev,
        {
          date: new Date().toISOString().slice(0, 10),
          value: newCashReserve,
          amount: newCashReserve,
          y: newCashReserve
        }
      ]);
      if (removed) {
        setToast({
          msg: 'Операция подушки удалена',
          kind: 'info',
          actionLabel: 'Отменить',
          onAction: () => {
            setEmergencyTx(v => [...v, removed]);
            const reverted = updated.reduce((sum, tx) => sum + (tx.type === 'deposit' ? tx.amount : -tx.amount), 0) + (removed.type === 'deposit' ? removed.amount : -removed.amount);
            setCashReserve(reverted);
          }
        } as any);
      }
      return updated;
    });
    // Persist delete
    (async () => { await deleteEmergencyTxById(id); })();
  };
  
  const deleteInvestTx = (id: number) => {
    setInvestTx(prev => {
      const removed = prev.find(tx => tx.id === id);
      const updated = prev.filter(tx => tx.id !== id);
      // Recalculate investment balance
      const newBalance = updated.reduce((sum, it) => sum + (it.type === 'in' ? it.amount : -it.amount), 0);
      
      // Update investment history
      setInvestmentHistory(prev => [
        ...prev,
        {
          date: new Date().toISOString().slice(0, 10),
          value: newBalance,
          amount: newBalance,
          y: newBalance
        }
      ]);
      if (removed) {
        setToast({ msg: 'Инвест-транзакция удалена', kind: 'info', actionLabel: 'Отменить', onAction: () => setInvestTx(v => [...v, removed]) } as any);
      }
      return updated;
    });
    // Persist delete
    (async () => { await deleteInvestTxById(id); })();
  };
  
  const deleteDebt = (id: number) => {
    setSortedDebts(prev => {
      const removed = prev.find(debt => debt.id === id);
      const updated = prev.filter(debt => debt.id !== id);
      // Recalculate total debt
      const totalDebt = updated.reduce((s, d) => s + (d.amount || 0), 0);
      
      // Update debts history
      setDebtsHistory(prev => [
        ...prev,
        {
          date: new Date().toISOString().slice(0, 10),
          value: totalDebt,
          amount: totalDebt,
          y: totalDebt
        }
      ]);
      if (removed) {
        setToast({ msg: 'Долг удалён', kind: 'info', actionLabel: 'Отменить', onAction: () => setSortedDebts(v => [...v, removed]) } as any);
      }
      return updated;
    });
    // Persist delete
    (async () => { await deleteDebtById(id); })();
  };
  
  const repayDebt = (debtId: number, amount: number) => {
    if (!amount || amount <= 0) return;
    
    setSortedDebts(prev => {
      const updated = prev.map(debt => {
        if (debt.id === debtId) {
          const newTx = {
            id: Date.now(),
            date: new Date().toISOString().slice(0, 10),
            type: 'repay' as const,
            amount: amount,
            note: 'Debt repayment'
          };
          return {
            ...debt,
            amount: Math.max(0, debt.amount - amount),
            history: [...(debt.history || []), newTx]
          };
        }
        return debt;
      });
      
      // Calculate new total debt
      const totalDebt = updated.reduce((s, d) => s + (d.amount || 0), 0);
      
      // Update debts history for chart
      setDebtsHistory(prev => [
        ...prev,
        {
          date: new Date().toISOString().slice(0, 10),
          value: totalDebt,
          amount: totalDebt,
          y: totalDebt
        }
      ]);
      
      return updated;
    });
    // Persist update
    (async () => { await updateDebtAmount(debtId, Math.max(0, (sortedDebts.find(d => d.id === debtId)?.amount || 0) - amount)); })();
    
    setRepayDrafts(prev => ({ ...prev, [debtId]: '' }));
  };
  
  const resetAllFinancialData = () => {
    // Generate random demo data for quick testing
    const makeSeries = (start: number) => {
      const today = new Date();
      const arr: DataPoint[] = [] as any;
      let cur = start;
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i * 5);
        cur = Math.max(0, Math.round(cur + (Math.random() * 600 - 300)));
        const iso = d.toISOString().slice(0, 10);
        arr.push({ date: iso, value: cur, y: cur } as any);
      }
      return arr;
    };
    setCushionHistory(makeSeries(3000));
    setInvestmentHistory(makeSeries(2500));
    setDebtsHistory(makeSeries(1800));
    setEmergencyTx([]);
    setInvestTx([]);
    setSortedDebts([]);
  };
  
  const addTrade = (trade: Omit<Trade, 'id' | 'userId'>) => {
    if (!currentUser) return;
    // optimistic update
    const optimistic = {
      id: Date.now(),
      userId: currentUser.id,
      ...trade
    };
    setTrades(prev => [optimistic, ...prev]);
    (async () => {
      const saved = await insertTradeDb(currentUser.id, trade);
      if (saved) {
        setTrades(prev => [saved, ...prev.filter(t => t.id !== optimistic.id)]);
      }
    })();
  };
  
  const deleteTrade = (id: number) => {
    setTrades(prev => {
      const removed = prev.find(t => t.id === id);
      const updated = prev.filter(t => t.id !== id);
      if (removed) setToast({ msg: 'Сделка удалена', kind: 'info', actionLabel: 'Отменить', onAction: () => setTrades(v => [removed, ...v]) } as any);
      return updated;
    });
    (async () => { await deleteTradeById(id); })();
  };
  
  const addWorkout = (workout: Omit<Workout, 'id' | 'userId'>) => {
    
    const newWorkout = {
      id: Date.now(),
      userId: currentUser?.id || 'demo',
      ...workout
    };
    
    setWorkouts(prev => [...prev, newWorkout]);
    // Persist to Supabase
    (async () => {
      if (!currentUser?.id) return;
      const saved = await insertWorkout(currentUser.id, {
        date: newWorkout.date,
        time: (newWorkout as any).time ?? null,
        type: newWorkout.type,
        notes: newWorkout.notes ?? '',
        remind_before: newWorkout.remindBefore
      } as any);
      if (saved) {
        setWorkouts(prev => prev.map(w => w.id === newWorkout.id ? { ...w, id: (saved as any).id } : w));
      }
    })();
  };
  
  const deleteWorkout = (id: number) => {
    setWorkouts(prev => {
      const removed = prev.find(w => w.id === id);
      const updated = prev.filter(w => w.id !== id);
      if (removed) setToast({ msg: 'Тренировка удалена', kind: 'info', actionLabel: 'Отменить', onAction: () => setWorkouts(v => [...v, removed]) } as any);
      return updated;
    });
    (async () => { await deleteWorkoutById(id); })();
  };
  
  const addEvent = (event: Omit<Event, 'id' | 'userId'>) => {
    
    const newEvent = {
      id: Date.now(),
      userId: currentUser?.id || 'demo',
      ...event
    };
    
    setEvents(prev => [...prev, newEvent]);
    // Persist to Supabase
    (async () => {
      if (!currentUser?.id) return;
      const saved = await insertEvent(currentUser.id, {
        date: newEvent.date,
        time: (newEvent as any).time ?? null,
        title: newEvent.title,
        notes: newEvent.notes ?? '',
        remind_before: newEvent.remindBefore
      } as any);
      if (saved) {
        setEvents(prev => prev.map(e => e.id === newEvent.id ? { ...e, id: (saved as any).id } : e));
      }
    })();
  };
  
  const deleteEvent = (id: number) => {
    setEvents(prev => {
      const removed = prev.find(e => e.id === id);
      const updated = prev.filter(e => e.id !== id);
      if (removed) setToast({ msg: 'Событие удалено', kind: 'info', actionLabel: 'Отменить', onAction: () => setEvents(v => [...v, removed]) } as any);
      return updated;
    });
    (async () => { await deleteEventById(id); })();
  };
  
  const addPost = (post: Omit<Post, 'id' | 'userId' | 'date' | 'likes' | 'comments'>) => {
    
    const newPost = {
      id: Date.now(),
      userId: currentUser?.id || 'demo',
      date: new Date().toISOString(),
      likes: [],
      comments: [],
      ...post
    };
    
    setPosts(prev => [newPost, ...prev]);
    // Persist to Supabase
    (async () => {
      if (!currentUser?.id) return;
      const saved = await insertPost(currentUser.id, {
        title: newPost.title,
        content: newPost.content,
        market: newPost.market,
        images: newPost.images ?? []
      } as any);
      if (saved) {
        setPosts(prev => prev.map(p => p.id === newPost.id ? { ...p, id: (saved as any).id, date: (saved as any).created_at } : p));
      }
    })();
  };
  
  const deletePost = (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    (async () => { await deletePostById(id); })();
  };
  
  const toggleLike = (postId: number) => {
    if (!currentUser) return;
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const isLiked = likes.includes(currentUser.id);
        const updatedLikes = isLiked ? likes.filter(id => id !== currentUser.id) : [...likes, currentUser.id];
        // persist
        (async () => { await updatePostLikes(postId, updatedLikes as any); })();
        return { ...post, likes: updatedLikes };
      }
      return post;
    }));
  };
  
  const addComment = (postId: number, text: string) => {
    if (!currentUser) return;
    
    const newComment = {
      id: Date.now(),
      userId: currentUser.id,
      text,
      date: new Date().toISOString().slice(0, 10)
    };
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updated = [...(post.comments || []), newComment];
        // persist
        (async () => { await updatePostComments(postId, updated as any); })();
        return { ...post, comments: updated };
      }
      return post;
    }));
  };
  
  const toggleBookmark = (postId: number) => {
    if (!currentUser) return;
    
    setBookmarks(prev => {
      const userBookmarks = prev[currentUser.id] || [];
      const isBookmarked = userBookmarks.includes(postId);
      
      return {
        ...prev,
        [currentUser.id]: isBookmarked
          ? userBookmarks.filter(id => id !== postId)
          : [...userBookmarks, postId]
      };
    });
  };
  
  const getComprehensiveChartData = (timePeriod: '1M' | '3M' | '6M' | '1Y' | 'ALL' = 'ALL') => {
    return generateComprehensiveChartData(
      cushionHistory,
      investmentHistory,
      debtsHistory,
      timePeriod
    );
  };
  
  // Auth helpers
  const logout = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        setSupaAuth(null);
        setToast({ msg: 'Вы вышли из аккаунта', kind: 'info' } as any);
        setTab('finance');
        setOpenDropdown(null);
      } else {
        setToast({ msg: result.error || 'Ошибка выхода', kind: 'error' } as any);
      }
    } catch (error) {
      setToast({ msg: 'Ошибка выхода', kind: 'error' } as any);
    }
  };

  const addFriend = async (friendId: string) => {
    if (!currentUser?.id) return;
    try {
      const currentOverlay = supaProfiles[currentUser.id] || { friends: [] } as any;
      const existing: any[] = Array.isArray((currentOverlay as any).friends) ? (currentOverlay as any).friends : [];
      if (existing.includes(friendId)) {
        setToast({ msg: 'Пользователь уже в друзьях', kind: 'info' } as any);
        return;
      }
      const updatedFriends = [...existing, friendId];
      const res = await updateUserProfile(currentUser.id, { friends: updatedFriends } as any);
      if (res.success) {
        setSupaProfiles(prev => ({
          ...prev,
          [currentUser.id]: {
            ...(prev[currentUser.id] || {} as any),
            friends: updatedFriends,
          } as any
        }));
        setToast({ msg: 'Друг добавлен', kind: 'success' } as any);
      } else {
        setToast({ msg: res.error || 'Не удалось добавить друга', kind: 'error' } as any);
      }
    } catch {
      setToast({ msg: 'Не удалось добавить друга', kind: 'error' } as any);
    }
  };

  const handleSignIn = async () => {
    if (!authEmail || !authPassword) {
      setToast({ msg: 'Заполните все поля', kind: 'error' } as any);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(authEmail, authPassword);
      if (result.success && result.auth) {
        setSupaAuth(result.auth);
        setToast({ msg: 'Успешный вход', kind: 'success' } as any);
        setAuthEmail('');
        setAuthPassword('');
      } else {
        setToast({ msg: result.error || 'Ошибка входа', kind: 'error' } as any);
      }
    } catch (error) {
      setToast({ msg: 'Ошибка входа', kind: 'error' } as any);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!authEmail || !authPassword) {
      setToast({ msg: 'Заполните все поля', kind: 'error' } as any);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(authEmail, authPassword);
      if (result.success) {
        setToast({ msg: 'Регистрация успешна. Проверьте email для подтверждения.', kind: 'success' } as any);
        setAuthEmail('');
        setAuthPassword('');
        setAuthMode('login');
      } else {
        setToast({ msg: result.error || 'Ошибка регистрации', kind: 'error' } as any);
      }
    } catch (error) {
      setToast({ msg: 'Ошибка регистрации', kind: 'error' } as any);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!authEmail) {
      setToast({ msg: 'Введите email', kind: 'error' } as any);
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(authEmail);
      if (result.success) {
        setToast({ msg: 'Ссылка для сброса пароля отправлена на email', kind: 'success' } as any);
      } else {
        setToast({ msg: result.error || 'Ошибка сброса пароля', kind: 'error' } as any);
      }
    } catch (error) {
      setToast({ msg: 'Ошибка сброса пароля', kind: 'error' } as any);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const result = await getCurrentSession();
      if (result.success && result.auth) {
        setSupaAuth(result.auth);
        // Load trades from Supabase for current user
        try {
          const list = await fetchUserTrades(result.auth.user.id);
          if (Array.isArray(list)) setTrades(list);
        } catch {}
        // Load finance tx
        try { const em = await fetchEmergencyTx(result.auth.user.id); if (Array.isArray(em)) setEmergencyTx(em as any); } catch {}
        try { const inv = await fetchInvestTx(result.auth.user.id); if (Array.isArray(inv)) setInvestTx(inv as any); } catch {}
        // Load planner
        try { const ws = await fetchWorkouts(result.auth.user.id); if (Array.isArray(ws)) setWorkouts(ws as any); } catch {}
        try { const es = await fetchEvents(result.auth.user.id); if (Array.isArray(es)) setEvents(es as any); } catch {}
        // Load posts (user's own)
        try { const ps = await fetchPosts(result.auth.user.id); if (Array.isArray(ps)) setPosts(ps as any); } catch {}
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange((auth) => {
      setSupaAuth(auth);
      // Reload trades on login/logout
      (async () => {
        if (auth?.user?.id) {
          try { const list = await fetchUserTrades(auth.user.id); if (Array.isArray(list)) setTrades(list); } catch {}
          try { const em = await fetchEmergencyTx(auth.user.id); if (Array.isArray(em)) setEmergencyTx(em as any); } catch {}
          try { const inv = await fetchInvestTx(auth.user.id); if (Array.isArray(inv)) setInvestTx(inv as any); } catch {}
          try { const ws = await fetchWorkouts(auth.user.id); if (Array.isArray(ws)) setWorkouts(ws as any); } catch {}
          try { const es = await fetchEvents(auth.user.id); if (Array.isArray(es)) setEvents(es as any); } catch {}
          try { const ps = await fetchPosts(auth.user.id); if (Array.isArray(ps)) setPosts(ps as any); } catch {}
        } else {
          // On logout keep local demo or clear
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return {
    // Navigation
    tab, setTab,
    openDropdown, setOpenDropdown,
    profileTab, setProfileTab,
    
    // Auth
    supaAuth, setSupaAuth,
    supaProfiles, setSupaProfiles,
    authMode, setAuthMode,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    isLoading, setIsLoading,
    passwordStrength, setPasswordStrength,
    handleSignIn,
    handleSignUp,
    handleResetPassword,
    
    // Theme and UI
    appTheme,
    toast, setToast,
    isDark,
    
    // Animation refs
    tabAnimation,
    dropdownAnimations,
    buttonAnimations,
    
    // Finance
    startCapital, setStartCapital,
    monthlyInvest, setMonthlyInvest,
    apr, setApr,
    years, setYears,
    monthlyExpenses, setMonthlyExpenses,
    cashReserve, setCashReserve,
    financeData, setFinanceData,
    financeEditMode, setFinanceEditMode,
    financeForm, setFinanceForm,
    
    // Views
    financeView, setFinanceView,
    journalView, setJournalView,
    calendarView, setCalendarView,
    chartTimePeriod, setChartTimePeriod,
    
    // Chart
    chartVisibility, setChartVisibility,
    chartTooltip, setChartTooltip,
    
    // History
    cushionHistory, setCushionHistory,
    investmentHistory, setInvestmentHistory,
    debtsHistory, setDebtsHistory,
    
    // Trades
    trades, setTrades,
    
    // Planner
    plannerPrefs, setPlannerPrefs,
    recurring, setRecurring,
    plannerView, setPlannerView,
    plannerDate, setPlannerDate,
    plannerComposeOpen, setPlannerComposeOpen,
    plannerComposeType, setPlannerComposeType,
    plannerEditing, setPlannerEditing,
    plannerShowNews, setPlannerShowNews,
    
    // Workouts and Events
    workouts, setWorkouts,
    events, setEvents,
    
    // Community
    posts, setPosts,
    bookmarks, setBookmarks,
    
    // Achievements
    achievements, setAchievements,
    
  // Computed
  currentUser,
  currentFinance,
  emergencyMonths,
  investmentBalance,
  totalDebt,
  
    // Additional states for Dashboard
    newEmergencyTx, setNewEmergencyTx,
    newInvestTx, setNewInvestTx,
    newDebt, setNewDebt,
    repayDrafts, setRepayDrafts,
    showEmergencyLocationDropdown, setShowEmergencyLocationDropdown,
    showInvestDestinationDropdown, setShowInvestDestinationDropdown,
    emergencyLocations, setEmergencyLocations,
    investDestinations, setInvestDestinations,
    sortedDebts, setSortedDebts,
    investHoldings, setInvestHoldings,
    emergencyTx, setEmergencyTx,
    investTx, setInvestTx,
    
    // Business logic functions
    addEmergencyTransaction,
    addInvestmentTransaction,
    addDebt,
    deleteEmergencyTx,
    deleteInvestTx,
    deleteDebt,
    repayDebt,
    resetAllFinancialData,
    getComprehensiveChartData,
    addTrade,
    deleteTrade,
    addWorkout,
    deleteWorkout,
    addEvent,
    deleteEvent,
    addPost,
    deletePost,
    toggleLike,
    addComment,
    toggleBookmark,
    logout,
    addFriend
  };
};
