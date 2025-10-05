// Main app state hook
// Exact reproduction of current state logic

import { useState, useEffect, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { storage, STORAGE_KEYS } from '../../services/persist';
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
  
  // Theme and UI
  const [appTheme, setAppTheme] = useState<string>(() => 
    storage.get(STORAGE_KEYS.APP_THEME, 'dark')
  );
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
  const [financeView, setFinanceView] = useState<FinanceViewType>(null);
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
  const [cushionHistory, setCushionHistory] = useState<DataPoint[]>(() => 
    storage.get(STORAGE_KEYS.CUSHION_HISTORY, [])
  );
  const [investmentHistory, setInvestmentHistory] = useState<DataPoint[]>(() => 
    storage.get(STORAGE_KEYS.INVESTMENT_HISTORY, [])
  );
  const [debtsHistory, setDebtsHistory] = useState<DataPoint[]>(() => 
    storage.get(STORAGE_KEYS.DEBTS_HISTORY, [])
  );
  
  // Trades
  const [trades, setTrades] = useState<Trade[]>([]);
  
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
  const [emergencyLocations, setEmergencyLocations] = useState<string[]>([]);
  const [investDestinations, setInvestDestinations] = useState<string[]>([]);
  const [sortedDebts, setSortedDebts] = useState<any[]>([]);
  const [investHoldings, setInvestHoldings] = useState<Array<{ destination: string; currency: string; balance: number }>>([]);
  
  // Additional states for Dashboard
  const [emergencyTx, setEmergencyTx] = useState<EmergencyTransaction[]>([]);
  const [investTx, setInvestTx] = useState<InvestmentTransaction[]>([]);
  
  // Computed values
  const emergencyMonths = useMemo(() => 
    monthlyExpenses > 0 ? (cashReserve / monthlyExpenses) : 0,
    [cashReserve, monthlyExpenses]
  );
  
  // Persist state changes
  useEffect(() => storage.set(STORAGE_KEYS.SUPA_AUTH, supaAuth), [supaAuth]);
  useEffect(() => storage.set(STORAGE_KEYS.SUPA_PROFILES, supaProfiles), [supaProfiles]);
  useEffect(() => storage.set(STORAGE_KEYS.APP_THEME, appTheme), [appTheme]);
  useEffect(() => storage.set(STORAGE_KEYS.FINANCE_DATA, financeData), [financeData]);
  useEffect(() => storage.set(STORAGE_KEYS.CUSHION_HISTORY, cushionHistory), [cushionHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.INVESTMENT_HISTORY, investmentHistory), [investmentHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.DEBTS_HISTORY, debtsHistory), [debtsHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.PLANNER_PREFS, plannerPrefs), [plannerPrefs]);
  useEffect(() => storage.set(STORAGE_KEYS.POSTS, posts), [posts]);
  useEffect(() => storage.set(STORAGE_KEYS.BOOKMARKS, bookmarks), [bookmarks]);
  
  // Computed values
  const isDark = appTheme === 'dark';
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
  })() : null;
  
  const currentFinance = currentUser ? financeData[currentUser.id] : null;
  
  const investmentBalance = useMemo(() => {
    const list = currentFinance?.investTx || [];
    return list.reduce((sum, it) => sum + (it.type === 'in' ? it.amount : -it.amount), 0);
  }, [currentFinance]);
  
  // Business logic functions
  const addEmergencyTransaction = () => {
    if (!currentUser || !newEmergencyTx.amount || !newEmergencyTx.currency || !newEmergencyTx.location) return;
    
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
    setNewEmergencyTx({ type: 'deposit', amount: '', currency: 'USD', location: '', note: '' });
    
    // Update locations
    if (!emergencyLocations.includes(newEmergencyTx.location)) {
      setEmergencyLocations(prev => [...prev, newEmergencyTx.location]);
    }
  };
  
  const addInvestmentTransaction = () => {
    if (!currentUser || !newInvestTx.amount || !newInvestTx.currency || !newInvestTx.destination) return;
    
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: newInvestTx.type as 'in' | 'out',
      amount: Number(newInvestTx.amount),
      currency: newInvestTx.currency,
      destination: newInvestTx.destination,
      note: newInvestTx.note
    };
    
    setInvestTx(prev => [...prev, newTx]);
    setNewInvestTx({ type: 'in', amount: '', currency: 'USD', destination: '', note: '' });
    
    // Update destinations
    if (!investDestinations.includes(newInvestTx.destination)) {
      setInvestDestinations(prev => [...prev, newInvestTx.destination]);
    }
  };
  
  const addDebt = () => {
    if (!currentUser || !newDebt.name || !newDebt.amount || !newDebt.currency) return;
    
    const newDebtObj = {
      id: Date.now(),
      name: newDebt.name,
      amount: Number(newDebt.amount),
      currency: newDebt.currency,
      tx: [{
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: 'add' as const,
        amount: Number(newDebt.amount),
        note: 'Initial debt'
      }]
    };
    
    setSortedDebts(prev => [...prev, newDebtObj]);
    setNewDebt({ name: '', amount: '', currency: 'USD' });
  };
  
  const deleteEmergencyTx = (id: number) => {
    setEmergencyTx(prev => prev.filter(tx => tx.id !== id));
  };
  
  const deleteInvestTx = (id: number) => {
    setInvestTx(prev => prev.filter(tx => tx.id !== id));
  };
  
  const deleteDebt = (id: number) => {
    setSortedDebts(prev => prev.filter(debt => debt.id !== id));
  };
  
  const repayDebt = (debtId: number) => {
    const amount = Number(repayDrafts[debtId]);
    if (!amount) return;
    
    setSortedDebts(prev => prev.map(debt => {
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
          tx: [...debt.tx, newTx]
        };
      }
      return debt;
    }));
    
    setRepayDrafts(prev => ({ ...prev, [debtId]: '' }));
  };
  
  const resetAllFinancialData = () => {
    setEmergencyTx([]);
    setInvestTx([]);
    setSortedDebts([]);
    setCushionHistory([]);
    setInvestmentHistory([]);
    setDebtsHistory([]);
    setCashReserve(0);
    setMonthlyExpenses(0);
  };
  
  const getComprehensiveChartData = () => {
    // Simple chart data for now
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const emergencyData = cushionHistory.length > 0 ? cushionHistory.map(d => d.value) : [0, 0, 0, 0, 0, 0];
    const investmentData = investmentHistory.length > 0 ? investmentHistory.map(d => d.value) : [0, 0, 0, 0, 0, 0];
    const debtData = debtsHistory.length > 0 ? debtsHistory.map(d => d.value) : [0, 0, 0, 0, 0, 0];
    
    return {
      labels,
      datasets: [
        {
          data: emergencyData,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: investmentData,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: debtData,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };
  
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
    
    // Theme and UI
    appTheme, setAppTheme,
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
    getComprehensiveChartData
  };
};
