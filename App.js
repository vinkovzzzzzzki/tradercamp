import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, Image, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Simple local storage helpers (web-only persistence)
const storage = {
  get(key, fallback) {
    try {
      if (typeof window === 'undefined') return fallback;
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

export default function App() {
  const [tab, setTab] = useState('finance');

  // Auth state
  const [users, setUsers] = useState(() => storage.get('users', [
    { id: 1, nickname: 'Trader_Pro', password: 'demo', bio: 'Crypto & Stocks trader', avatar: '', friends: [2] },
    { id: 2, nickname: 'StockMaster', password: 'demo', bio: 'Growth & AI plays', avatar: '', friends: [1,3] },
    { id: 3, nickname: 'DemoUser', password: 'demo', bio: 'Тестовый пользователь: люблю крипту и фитнес', avatar: '', friends: [2] },
  ]));
  useEffect(() => storage.set('users', users), [users]);
  const [currentUserId, setCurrentUserId] = useState(() => storage.get('currentUserId', null));
  // Supabase auth session (email/password)
  const [supaAuth, setSupaAuth] = useState(() => storage.get('supaAuth', null));
  useEffect(() => storage.set('supaAuth', supaAuth), [supaAuth]);
  // Local overlay profiles for Supabase users
  const [supaProfiles, setSupaProfiles] = useState(() => storage.get('supaProfiles', {})); // { [supaUserId]: { nickname, bio, avatar, friends: number[] } }
  useEffect(() => storage.set('supaProfiles', supaProfiles), [supaProfiles]);
  // Theme
  const [appTheme, setAppTheme] = useState(() => storage.get('appTheme', 'dark'));
  useEffect(() => storage.set('appTheme', appTheme), [appTheme]);
  const isDark = appTheme === 'dark';
  // Lightweight in-app toast (reliable on web)
  const [toast, setToast] = useState(null); // { msg, kind: 'info'|'warning'|'error' }
  const notify = (msg, kind = 'info') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };
  // Profile section tabs
  const [profileTab, setProfileTab] = useState('overview'); // 'overview'|'friends'|'achievements'|'settings'

  // Cross-platform confirm helper (Promise<boolean>)
  const confirmAsync = (message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      try { return Promise.resolve(window.confirm(message)); } catch { return Promise.resolve(false); }
    }
    return new Promise((resolve) => {
      try {
        Alert.alert('Подтверждение', message, [
          { text: 'Нет', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Да', onPress: () => resolve(true) },
        ], { cancelable: true });
      } catch {
        resolve(false);
      }
    });
  };
  
  const currentUserLocal = users.find(u => u.id === currentUserId) || null;
  const currentSupaUser = supaAuth && supaAuth.user ? supaAuth.user : null;
  const currentUser = currentSupaUser ? (() => {
    const overlay = supaProfiles[currentSupaUser.id] || {};
    return {
      id: currentSupaUser.id,
      nickname: overlay.nickname || (currentSupaUser.email || 'user').split('@')[0],
      bio: overlay.bio || '',
      avatar: overlay.avatar || '',
      friends: Array.isArray(overlay.friends) ? overlay.friends : [],
      statusText: overlay.statusText || '',
      experienceYears: Number(overlay.experienceYears || 0),
      markets: Array.isArray(overlay.markets) ? overlay.markets : [],
      timezone: overlay.timezone || '',
      links: overlay.links || {},
      location: overlay.location || '',
    };
  })() : currentUserLocal;

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [useSupaAuth, setUseSupaAuth] = useState(false);
  const [authData, setAuthData] = useState({ nickname: '', password: '' });
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const registerUser = () => {
    const nickname = authData.nickname.trim();
    const password = authData.password.trim();
    if (!nickname || !password) {
      Alert.alert('Ошибка', 'Введите никнейм и пароль');
      return;
    }
    if (users.some(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
      Alert.alert('Ошибка', 'Этот ник уже занят');
      return;
    }
    const newUser = { id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1, nickname, password, bio: '', avatar: '', friends: [] };
    const nextUsers = [newUser, ...users];
    setUsers(nextUsers);
    setCurrentUserId(newUser.id);
    setAuthData({ nickname: '', password: '' });
    setAuthMode('login');
  };

  const loginUser = () => {
    const nickname = authData.nickname.trim();
    const password = authData.password.trim();
    const found = users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase() && u.password === password);
    if (!found) {
      Alert.alert('Ошибка', 'Неверный никнейм или пароль');
      return;
    }
    setCurrentUserId(found.id);
    setAuthData({ nickname: '', password: '' });
  };

  const logout = () => {
    setCurrentUserId(null);
    setSupaAuth(null);
  };

  // Supabase email/password auth (REST)
  const supaAuthHeaders = () => ({
    'apikey': supa.anonKey || '',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });
  const supaBase = () => (supa.url || '').replace(/\/$/, '');

  const supaLogin = async () => {
    if (!supaConfigured) {
      Alert.alert('Supabase', 'Заполните URL и Anon Key в профиле');
      return;
    }
    const email = (authEmail || '').trim();
    const password = (authPassword || '').trim();
    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }
    try {
      const res = await fetch(`${supaBase()}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: supaAuthHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = json?.error_description || json?.msg || `HTTP ${res.status}`;
        Alert.alert('Вход', `Не удалось: ${err}`);
        return;
      }
      setSupaAuth(json);
      setCurrentUserId(null);
      setAuthEmail('');
      setAuthPassword('');
      setAuthMode('login');
      Alert.alert('Вход', 'Успешно');
    } catch (e) {
      Alert.alert('Вход', 'Произошла ошибка при обращении к Supabase');
    }
  };

  const supaRegister = async () => {
    if (!supaConfigured) {
      Alert.alert('Supabase', 'Заполните URL и Anon Key в профиле');
      return;
    }
    const email = (authEmail || '').trim();
    const password = (authPassword || '').trim();
    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }
    try {
      const res = await fetch(`${supaBase()}/auth/v1/signup`, {
        method: 'POST',
        headers: supaAuthHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = json?.error_description || json?.msg || `HTTP ${res.status}`;
        Alert.alert('Регистрация', `Не удалось: ${err}`);
        return;
      }
      Alert.alert('Регистрация', 'Успешно. Проверьте почту для подтверждения (если требуется).');
      setAuthMode('login');
    } catch (e) {
      Alert.alert('Регистрация', 'Произошла ошибка при обращении к Supabase');
    }
  };

  const supaRecover = async () => {
    if (!supaConfigured) {
      Alert.alert('Supabase', 'Заполните URL и Anon Key в профиле');
      return;
    }
    const email = (authEmail || '').trim();
    if (!email) return Alert.alert('Ошибка', 'Введите email');
    try {
      const res = await fetch(`${supaBase()}/auth/v1/recover`, {
        method: 'POST',
        headers: supaAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        Alert.alert('Сброс пароля', `Не удалось: ${j?.msg || j?.error_description || res.status}`);
        return;
      }
      Alert.alert('Сброс пароля', 'Письмо отправлено. Проверьте почту.');
    } catch {
      Alert.alert('Сброс пароля', 'Ошибка сети при запросе восстановления');
    }
  };

  // Security: change password
  const [secOld, setSecOld] = useState('');
  const [secNew, setSecNew] = useState('');
  const [secNew2, setSecNew2] = useState('');
  const supaChangePassword = async (newPassword) => {
    try {
      const token = supaAuth?.access_token;
      if (!token) {
        Alert.alert('Ошибка', 'Нет активной сессии Supabase');
        return false;
      }
      const res = await fetch(`${supaBase()}/auth/v1/user`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': supa.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        Alert.alert('Пароль', `Не удалось изменить: ${j?.msg || j?.error_description || res.status}`);
        return false;
      }
      Alert.alert('Пароль', 'Пароль обновлён');
      return true;
    } catch {
      Alert.alert('Пароль', 'Ошибка сети при изменении пароля');
      return false;
    }
  };
  const changePassword = async () => {
    if (!currentUser) return;
    if (!secNew || secNew.length < 6) return Alert.alert('Ошибка', 'Минимум 6 символов');
    if (secNew !== secNew2) return Alert.alert('Ошибка', 'Пароли не совпадают');
    if (currentSupaUser) {
      const ok = await supaChangePassword(secNew);
      if (ok) { setSecOld(''); setSecNew(''); setSecNew2(''); }
      return;
    }
    // Local
    const me = users.find(u => u.id === currentUser.id);
    if (!me) return;
    if (me.password !== secOld) return Alert.alert('Ошибка', 'Текущий пароль неверен');
    const next = users.map(u => u.id === me.id ? { ...u, password: secNew } : u);
    setUsers(next);
    setSecOld(''); setSecNew(''); setSecNew2('');
    Alert.alert('Пароль', 'Пароль обновлён');
  };

  const updateProfile = (patch) => {
    if (!currentUser) return;
    if (currentSupaUser) {
      setSupaProfiles(prev => ({
        ...prev,
        [currentUser.id]: { ...(prev[currentUser.id] || {}), ...patch },
      }));
    } else {
      const nextUsers = users.map(u => u.id === currentUser.id ? { ...u, ...patch } : u);
      setUsers(nextUsers);
    }
    Alert.alert('Готово', 'Профиль обновлён');
  };
  const toggleMarketPref = (m) => {
    if (!currentUser) return;
    const has = (currentUser.markets || []).includes(m);
    const next = has ? (currentUser.markets || []).filter(x => x !== m) : [ ...(currentUser.markets || []), m ];
    updateProfile({ markets: next });
  };

  const addFriend = (userId) => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для добавления друзей');
    if (userId === currentUser.id) return;
    if (currentUser.friends.includes(userId)) return;
    if (currentSupaUser) {
      setSupaProfiles(prev => ({
        ...prev,
        [currentUser.id]: { ...(prev[currentUser.id] || {}), friends: [...(currentUser.friends || []), userId] },
      }));
      // mirror on local user if exists
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, friends: [...u.friends, currentUser.id] } : u));
    } else {
      const nextUsers = users.map(u => {
        if (u.id === currentUser.id) return { ...u, friends: [...u.friends, userId] };
        if (u.id === userId) return { ...u, friends: [...u.friends, currentUser.id] };
        return u;
      });
      setUsers(nextUsers);
    }
  };

  const removeFriend = (userId) => {
    if (!currentUser) return;
    if (currentSupaUser) {
      setSupaProfiles(prev => ({
        ...prev,
        [currentUser.id]: { ...(prev[currentUser.id] || {}), friends: (currentUser.friends || []).filter(id => id !== userId) },
      }));
      setUsers(prev => prev.map(u => {
        if (u.id === userId) return { ...u, friends: u.friends.filter(id => id !== currentUser.id) };
        return u;
      }));
    } else {
      const nextUsers = users.map(u => {
        if (u.id === currentUser.id) return { ...u, friends: u.friends.filter(id => id !== userId) };
        if (u.id === userId) return { ...u, friends: u.friends.filter(id => id !== currentUser.id) };
        return u;
      });
      setUsers(nextUsers);
    }
  };

  // Finance state
  const [startCapital, setStartCapital] = useState(10000);
  const [monthlyInvest, setMonthlyInvest] = useState(500);
  const [apr, setApr] = useState(0.12);
  const [years, setYears] = useState(5);
  const [monthlyExpenses, setMonthlyExpenses] = useState(1500);
  const [cashReserve, setCashReserve] = useState(4000);
  // Finance per-user data (debts, transactions, preferences)
  const [financeData, setFinanceData] = useState(() => storage.get('financeData', {}));
  const [financeEditMode, setFinanceEditMode] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    isEmployed: null, // true/false
    hasExtraIncome: null, // true/false
    incomeDaysText: '', // e.g. "1, 15, 28"
    typicalIncomeAmount: '',
    incomeCurrency: 'USD',
    hasDebts: null,
    hasEmergencyCash: null,
    emergencyCashAmount: '',
    hasInvestments: null,
    notifyEnabled: false,
  });
  // Debts
  const [newDebt, setNewDebt] = useState({ name: '', amount: '', currency: 'USD' });
  const [repayDrafts, setRepayDrafts] = useState({}); // debtId -> amount string
  // Emergency fund transactions
  const [newEmergencyTx, setNewEmergencyTx] = useState({ type: 'deposit', amount: '', currency: 'USD', location: '', note: '' });
  // Investment transactions
  const [newInvestTx, setNewInvestTx] = useState({ type: 'in', amount: '', currency: 'USD', destination: '', note: '' });
  const [showInvestAdvanced, setShowInvestAdvanced] = useState(false);
  const [showJournalAdvanced, setShowJournalAdvanced] = useState(false);
  // UI: collapse advanced actions by default
  const [showFundAdvanced, setShowFundAdvanced] = useState(false);
  // Finance filters
  const [emFilter, setEmFilter] = useState({ type: 'All', currency: 'All', q: '' });
  const [invFilter, setInvFilter] = useState({ type: 'All', currency: 'All', q: '' });
  // Transfers between holdings
  const [newEmergencyTransfer, setNewEmergencyTransfer] = useState({ fromLocation: '', toLocation: '', currency: 'USD', amount: '' });
  const [newInvestTransfer, setNewInvestTransfer] = useState({ fromDestination: '', toDestination: '', currency: 'USD', amount: '' });
  // Rename/Merge holdings
  const [renameEmergency, setRenameEmergency] = useState({ sourceLocation: '', currency: 'USD', newLocation: '' });
  const [mergeEmergency, setMergeEmergency] = useState({ fromLocation: '', toLocation: '', currency: 'USD' });
  const [renameInvest, setRenameInvest] = useState({ sourceDestination: '', currency: 'USD', newDestination: '' });
  const [mergeInvest, setMergeInvest] = useState({ fromDestination: '', toDestination: '', currency: 'USD' });

  // Journal state
  const [trades, setTrades] = useState([]);
  const [filterMarket, setFilterMarket] = useState('All');
  const [filterStyle, setFilterStyle] = useState('All');

  // New trade form
  const [newTrade, setNewTrade] = useState({
    asset: '',
    side: 'BUY',
    qty: '',
    price: '',
    market: 'Crypto',
    style: 'Скальпинг',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    stopLoss: '',
    takeProfit: '',
    trailingEnabled: false,
    trailingType: 'percent', // 'percent' | 'amount'
    trailingValue: ''
  });
  const [riskCalc, setRiskCalc] = useState({ account: '', riskPct: '1', slPrice: '' });
  const [rrTarget, setRrTarget] = useState('2');

  const applyRiskPositionSize = () => {
    // Use provided SL field if not overridden in calc
    const priceN = parseNumberSafe(newTrade.price);
    const isBuy = newTrade.side === 'BUY';
    const slPrice = riskCalc.slPrice ? parseNumberSafe(riskCalc.slPrice) : (newTrade.stopLoss ? parseNumberSafe(newTrade.stopLoss) : NaN);
    const account = parseNumberSafe(riskCalc.account);
    const riskPct = parseNumberSafe(riskCalc.riskPct);
    if (!Number.isFinite(priceN) || priceN <= 0) return Alert.alert('Риск', 'Сначала укажите цену входа');
    if (!Number.isFinite(slPrice) || slPrice <= 0) return Alert.alert('Риск', 'Укажите корректный Stop Loss');
    if (!Number.isFinite(account) || account <= 0) return Alert.alert('Риск', 'Укажите размер счёта');
    if (!Number.isFinite(riskPct) || riskPct <= 0) return Alert.alert('Риск', 'Процент риска должен быть > 0');
    // distance per unit
    const perUnitRisk = isBuy ? (priceN - slPrice) : (slPrice - priceN);
    if (!(perUnitRisk > 0)) return Alert.alert('Риск', 'SL должен быть по правильную сторону от цены входа');
    const riskMoney = account * (riskPct / 100);
    const qty = riskMoney / perUnitRisk;
    if (!(qty > 0)) return Alert.alert('Риск', 'Не удалось рассчитать размер позиции');
    setNewTrade(v => ({ ...v, qty: String(qty.toFixed(6)), stopLoss: String(Number.isFinite(parseFloat(v.stopLoss)) ? v.stopLoss : slPrice) }));
  };

  const applyAutoTakeProfit = () => {
    const priceN = parseNumberSafe(newTrade.price);
    const slN = newTrade.stopLoss ? parseNumberSafe(newTrade.stopLoss) : NaN;
    const rr = parseNumberSafe(rrTarget);
    if (!Number.isFinite(priceN) || priceN <= 0) return Alert.alert('TP', 'Сначала укажите цену входа');
    if (!Number.isFinite(slN) || slN <= 0) return Alert.alert('TP', 'Сначала укажите Stop Loss');
    if (!Number.isFinite(rr) || rr <= 0) return Alert.alert('TP', 'Целевой R:R должен быть > 0');
    const isBuy = newTrade.side === 'BUY';
    const perUnitRisk = isBuy ? (priceN - slN) : (slN - priceN);
    if (!(perUnitRisk > 0)) return Alert.alert('TP', 'SL должен быть по правильную сторону от цены');
    const tp = isBuy ? (priceN + perUnitRisk * rr) : (priceN - perUnitRisk * rr);
    setNewTrade(v => ({ ...v, takeProfit: String(tp.toFixed(2)) }));
  };
  const [closeDrafts, setCloseDrafts] = useState({}); // tradeId -> { qty, price }

  // Calendar state
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [newsCountry, setNewsCountry] = useState('US,EU,CN');
  const [newsBackDays, setNewsBackDays] = useState(7);
  const [newsForwardDays, setNewsForwardDays] = useState(14);
  const [importanceFilters, setImportanceFilters] = useState({ 1: true, 2: true, 3: true });
  const [workouts, setWorkouts] = useState([
    { id: 1, userId: 1, date: '2025-01-19', type: 'Силовая', notes: 'Спина + бицепс' },
    { id: 2, userId: 2, date: '2025-01-21', type: 'Кардио', notes: 'Бег 5 км' },
  ]);
  const [events, setEvents] = useState([
    { id: 1, userId: 1, date: '2025-01-30', title: 'Ревизия портфеля Q1', notes: 'Перебалансировка 60/40' },
  ]);
  // Planner prefs (daily reminder)
  const [plannerPrefs, setPlannerPrefs] = useState(() => storage.get('plannerPrefs', { enabled: false, time: '22:00', notifId: null }));
  // Recurring workouts form
  const [recurring, setRecurring] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    weeks: 4,
    time: '18:00',
    type: 'Кардио',
    notes: '',
    remindBefore: 15,
    days: { Mon: true, Tue: false, Wed: true, Thu: false, Fri: false, Sat: false, Sun: false },
  });
  // Planner (Google Calendar–like) unified state
  const [plannerView, setPlannerView] = useState('month'); // 'month'|'week'|'day'
  const [plannerDate, setPlannerDate] = useState(new Date());
  const [plannerComposeOpen, setPlannerComposeOpen] = useState(false);
  const [plannerComposeType, setPlannerComposeType] = useState('event'); // 'event'|'workout'
  const [plannerEditing, setPlannerEditing] = useState(null); // { id: string, type: 'event'|'workout' } | null
  const [plannerShowNews, setPlannerShowNews] = useState(true);

  const toISODate = (d) => {
    const dt = (d instanceof Date) ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return new Date().toISOString().slice(0,10);
    return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())).toISOString().slice(0,10);
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const parseISODate = (iso) => {
    try {
      const [y,m,day] = (iso || '').split('-').map(Number);
      if (!y || !m || !day) return new Date();
      return new Date(y, m-1, day);
    } catch {
      return new Date();
    }
  };
  const startOfMonthMon = (d) => {
    const dt = new Date(d.getFullYear(), d.getMonth(), 1);
    const day = (dt.getDay() + 6) % 7; // Monday=0
    dt.setDate(dt.getDate() - day);
    return dt;
  };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const monthLabel = (d) => {
    const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const unifiedPlannerEvents = useMemo(() => {
    const list = [];
    // Workouts
    for (const w of (workouts || [])) {
      list.push({ id: `w_${w.id}`, date: w.date, time: w.time || '', title: w.type || 'Тренировка', type: 'workout' });
    }
    // Events
    for (const ev of (events || [])) {
      list.push({ id: `e_${ev.id}`, date: ev.date, time: ev.time || '', endTime: ev.endTime || '', title: ev.title || 'Событие', type: 'event' });
    }
    // Sort by date then time
    return list.sort((a,b) => (a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')));
  }, [workouts, events]);

  const goToday = () => setPlannerDate(new Date());
  const goPrev = () => {
    const d = new Date(plannerDate);
    if (plannerView === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - (plannerView === 'week' ? 7 : 1));
    setPlannerDate(d);
  };
  const goNext = () => {
    const d = new Date(plannerDate);
    if (plannerView === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + (plannerView === 'week' ? 7 : 1));
    setPlannerDate(d);
  };
  const openComposeForDate = (dateISO) => {
    if (!currentUser) return;
    // default 1 hour duration
    const t = '10:00';
    const [hh, mm] = t.split(':').map(Number);
    const end = pad2((hh + 1) % 24) + ':' + pad2(mm || 0);
    setNewEvent(v => ({ ...v, date: dateISO, time: t, endTime: end }));
    setPlannerComposeType('event');
    setPlannerEditing(null);
    setPlannerComposeOpen(true);
  };
  const openComposeForDateTime = (dateISO, timeHHMM) => {
    if (!currentUser) return;
    const t = timeHHMM || '10:00';
    const [hh, mm] = t.split(':').map(Number);
    const end = pad2((hh + 1) % 24) + ':' + pad2(mm || 0);
    setNewEvent(v => ({ ...v, date: dateISO, time: t, endTime: end }));
    setPlannerComposeType('event');
    setPlannerEditing(null);
    setPlannerComposeOpen(true);
  };
  const openComposeForEdit = (item) => {
    if (!currentUser) return;
    // item: { id, date, time, title, type }
    setPlannerComposeType(item.type === 'workout' ? 'workout' : 'event');
    if (item.type === 'event') {
      setNewEvent(v => ({ ...v, date: item.date, time: item.time || '', title: item.title || '', notes: v.notes || '' }));
    } else {
      // workout
      const w = (workouts || []).find(w => `w_${w.id}` === item.id);
      setNewEvent(v => ({ ...v, date: item.date, time: item.time || w?.time || '', title: w?.type || item.title || 'Тренировка', notes: w?.notes || '' }));
    }
    setPlannerEditing({ id: item.id, type: item.type });
    setPlannerComposeOpen(true);
  };
  const savePlannerCompose = async () => {
    if (!currentUser) { setPlannerComposeOpen(false); return; }
    try {
      if (plannerEditing && plannerEditing.type === 'event') {
        const idNum = Number((plannerEditing.id || '').split('_')[1]);
        setEvents(prev => prev.map(ev => ev.id === idNum ? { ...ev, date: newEvent.date, time: newEvent.time, endTime: newEvent.endTime, title: newEvent.title, notes: newEvent.notes } : ev));
      } else if (plannerEditing && plannerEditing.type === 'workout') {
        const idNum = Number((plannerEditing.id || '').split('_')[1]);
        setWorkouts(prev => prev.map(w => w.id === idNum ? { ...w, date: newEvent.date, time: newEvent.time, type: newEvent.title || w.type, notes: newEvent.notes } : w));
      } else {
        // create new based on chosen type
        if (plannerComposeType === 'workout') {
          const newId = (workouts.length ? Math.max(...workouts.map(w => w.id)) + 1 : 1);
          setWorkouts(prev => ([ ...prev, { id: newId, userId: currentUser.id || 0, date: newEvent.date, time: newEvent.time || '', type: newEvent.title || 'Тренировка', notes: newEvent.notes || '' } ]));
        } else {
          // create event inline instead of relying on old addEvent
          const newId = (events.length ? Math.max(...events.map(e => e.id)) + 1 : 1);
          setEvents(prev => ([ ...prev, { id: newId, userId: currentUser.id || 0, date: newEvent.date, time: newEvent.time || '', endTime: newEvent.endTime || '', title: newEvent.title || 'Событие', notes: newEvent.notes || '' } ]));
        }
      }
      // simple per-event reminder (best-effort)
      try {
        const t = (newEvent.time || '00:00');
        const [hh, mm] = t.split(':').map(Number);
        const dt = parseISODate(newEvent.date);
        dt.setHours(hh || 0, mm || 0, 0, 0);
        const when = dt.getTime();
        const beforeMs = (newEvent.remindBefore || 0) * 60000;
        const fireAt = new Date(when - beforeMs);
        if (Number.isFinite(fireAt.getTime()) && fireAt.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: { title: newEvent.title || 'Событие', body: newEvent.notes || '', sound: null },
            trigger: fireAt,
          });
        }
      } catch {}
    } finally {
      setPlannerComposeOpen(false);
      setPlannerEditing(null);
    }
  };
  const deletePlannerCompose = () => {
    if (!plannerEditing) { setPlannerComposeOpen(false); return; }
    if (plannerEditing.type === 'event') {
      const idNum = Number((plannerEditing.id || '').split('_')[1]);
      deleteEvent(idNum);
    } else if (plannerEditing.type === 'workout') {
      const idNum = Number((plannerEditing.id || '').split('_')[1]);
      deleteWorkout(idNum);
    }
    setPlannerComposeOpen(false);
    setPlannerEditing(null);
  };
  // Course schedule import
  const [courseImportText, setCourseImportText] = useState('');

  // New forms
  const [newWorkout, setNewWorkout] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '18:00',
    type: 'Кардио',
    notes: '',
    remindBefore: 15,
  });
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    endTime: '11:00',
    title: '',
    notes: '',
    remindBefore: 30,
  });

  // Community state
  const demoPostsSeed = [
    { id: 1, userId: 1, title: 'BTC: лонг после закрепления', content: 'BTC: лонг после закрепления над ключевым уровнем. Риск 1%.', market: 'Crypto', likes: [2], comments: [{ id: 1, userId: 2, text: 'Согласен!', date: '2025-01-20' }] },
    { id: 2, userId: 2, title: 'NVDA анализ', content: 'NVDA показывает признаки разворота. Рассматриваю вход на откате.', market: 'Stocks', likes: [], comments: [] },
    { id: 3, userId: 3, title: 'ETH краткосрок', content: 'Ожидаю откат к 0,5 Fibo и продолжение тренда. Управление риском 0.5%.', market: 'Crypto', likes: [], comments: [] },
  ];
  const [posts, setPosts] = useState(() => {
    const stored = storage.get('posts', null);
    return (Array.isArray(stored) && stored.length > 0) ? stored : demoPostsSeed;
  });
  useEffect(() => { storage.set('posts', posts); }, [posts]);
  // Bookmarks per userId -> Set of postIds
  const [bookmarks, setBookmarks] = useState(() => storage.get('bookmarks', {}));
  useEffect(() => storage.set('bookmarks', bookmarks), [bookmarks]);
  const isBookmarked = (pid) => {
    const uid = currentUser?.id;
    if (!uid) return false;
    const list = bookmarks[uid] || [];
    return list.includes(pid);
  };
  const toggleBookmark = (pid) => {
    const uid = currentUser?.id;
    if (!uid) return notify('Войдите, чтобы сохранять посты', 'error');
    setBookmarks(prev => {
      const list = prev[uid] || [];
      const nextList = list.includes(pid) ? list.filter(id => id !== pid) : [...list, pid];
      return { ...prev, [uid]: nextList };
    });
  };
  const [newPost, setNewPost] = useState({ title: '', content: '', market: 'Crypto', images: [] });
  const [commentDrafts, setCommentDrafts] = useState({}); // postId -> text
  // Social: search and profile view
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewUserId, setViewUserId] = useState(null);
  // Community filters
  const [postFilterMarket, setPostFilterMarket] = useState('All');
  const [postSort, setPostSort] = useState('date_desc'); // 'date_desc' | 'likes_desc'
  const [showMine, setShowMine] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState('');
  // Subviews per tab (to reduce cognitive load)
  const [financeView, setFinanceView] = useState(null); // 'fund' | 'invest' | 'debts'
  const [journalView, setJournalView] = useState(null); // 'new' | 'list'
  const [calendarView, setCalendarView] = useState(null); // 'news' | 'workouts' | 'events'

  // Friend requests (local)
  const [friendRequests, setFriendRequests] = useState(() => storage.get('friendRequests', []));
  useEffect(() => storage.set('friendRequests', friendRequests), [friendRequests]);
  const areFriends = (aId, bId) => {
    const a = (users.find(u => u.id === aId) || {});
    return Array.isArray(a.friends) && a.friends.includes(bId);
  };
  const requestBetween = (aId, bId) => friendRequests.find(r => (r.from === aId && r.to === bId && r.status === 'pending') || (r.from === bId && r.to === aId && r.status === 'pending'));
  const sendFriendRequest = (toId) => {
    if (!currentUser || toId === currentUser.id) return;
    if (areFriends(currentUser.id, toId)) return;
    const exists = requestBetween(currentUser.id, toId);
    if (exists) return;
    setFriendRequests(prev => [{ id: Date.now(), from: currentUser.id, to: toId, status: 'pending' }, ...prev]);
    notify('Запрос в друзья отправлен', 'info');
  };
  const acceptFriendRequest = (reqId) => {
    const req = friendRequests.find(r => r.id === reqId);
    if (!req) return;
    // add both sides as friends
    setUsers(prev => prev.map(u => u.id === req.to ? { ...u, friends: [...(u.friends||[]), req.from] } : (u.id === req.from ? { ...u, friends: [...(u.friends||[]), req.to] } : u)));
    setFriendRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'accepted' } : r));
  };
  const rejectFriendRequest = (reqId) => setFriendRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'rejected' } : r));
  const cancelFriendRequest = (reqId) => setFriendRequests(prev => prev.filter(r => r.id !== reqId));
  const myIncomingRequests = () => currentUser ? friendRequests.filter(r => r.to === currentUser.id && r.status === 'pending') : [];
  const myOutgoingRequests = () => currentUser ? friendRequests.filter(r => r.from === currentUser.id && r.status === 'pending') : [];
  const pendingWithUser = (otherId) => {
    if (!currentUser) return null;
    return friendRequests.find(r => r.status === 'pending' && ((r.from === currentUser.id && r.to === otherId) || (r.from === otherId && r.to === currentUser.id))) || null;
  };

  // Friend recommendations
  const getMutualFriendsCount = (otherId) => {
    if (!currentUser) return 0;
    const my = (users.find(u => u.id === currentUser.id) || { friends: [] }).friends || [];
    const other = (users.find(u => u.id === otherId) || { friends: [] }).friends || [];
    const setMy = new Set(my);
    return other.reduce((acc, id) => acc + (setMy.has(id) ? 1 : 0), 0);
  };
  const friendRecommendations = () => {
    const all = getAllKnownUsers();
    return all
      .filter(u => currentUser && u.id !== currentUser.id)
      .filter(u => !(currentUser?.friends || []).includes(u.id))
      .filter(u => !pendingWithUser(u.id))
      .map(u => ({
        u,
        score: getMutualFriendsCount(u.id) + ((u.markets || []).filter(m => (currentUser?.markets || []).includes(m)).length)
      }))
      .sort((a,b) => b.score - a.score)
      .slice(0, 6)
      .map(x => x.u);
  };

  // Mention/hashtag rendering
  const getUserByNickname = (nick) => {
    const all = getAllKnownUsers();
    return all.find(u => (u.nickname || '').toLowerCase() === nick.toLowerCase()) || null;
  };
  const renderPostContent = (text) => {
    const parts = String(text || '').split(/(#[\p{L}0-9_]+|@[A-Za-z0-9_]+)/u);
    return (
      <Text style={styles.postContent}>
        {parts.map((p, idx) => {
          if (!p) return null;
          if (p.startsWith('#')) {
            const tag = p.slice(1);
            return (
              <Text key={idx} style={{ color: '#1f6feb' }} onPress={() => setHashtagFilter(tag)}>#{tag}</Text>
            );
          }
          if (p.startsWith('@')) {
            const nick = p.slice(1);
            return (
              <Text key={idx} style={{ color: '#1f6feb' }} onPress={() => { const u = getUserByNickname(nick); if (u) setViewUserId(u.id); }}>{'@'}{nick}</Text>
            );
          }
          return <Text key={idx}>{p}</Text>;
        })}
      </Text>
    );
  };

  // Backend (Supabase REST) config
  const [supa, setSupa] = useState(() => storage.get('supa', { url: '', anonKey: '', bucket: 'public' }));
  useEffect(() => storage.set('supa', supa), [supa]);
  const supaConfigured = !!(supa.url && supa.anonKey);
  const supaHeaders = () => ({
    'apikey': supa.anonKey,
    'Authorization': `Bearer ${supa.anonKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Prefer': 'return=representation',
  });
  const supaAuthHeadersWithSession = () => {
    const token = supaAuth?.access_token;
    return token ? {
      'apikey': supa.anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    } : supaHeaders();
  };
  const supaUrl = (path) => `${supa.url.replace(/\/$/, '')}/rest/v1${path}`;
  const supaStorageUrl = (path) => `${supa.url.replace(/\/$/, '')}/storage/v1${path}`;
  const supaPublicUrl = (objectPath) => `${supa.url.replace(/\/$/, '')}/storage/v1/object/public/${(supa.bucket || 'public').replace(/\/$/,'')}/${objectPath.replace(/^\//,'')}`;
  const fetchSupaPosts = async () => {
    if (!supaConfigured) return;
    try {
      const url = supaUrl('/posts?select=*&order=id.desc');
      const res = await fetch(url, { headers: supaHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();
      if (Array.isArray(list)) setPosts(list);
    } catch (e) {
      // fallback: keep local posts
    }
  };

  // Finance sync (Supabase)
  const fetchSupaFinance = async () => {
    if (!supaConfigured || !currentSupaUser || !currentUser) return;
    try {
      const headers = supaAuthHeadersWithSession();
      const [profRes, debtsRes, emRes, invRes] = await Promise.all([
        fetch(supaUrl('/finance_profiles?select=*'), { headers }),
        fetch(supaUrl('/finance_debts?select=*'), { headers }),
        fetch(supaUrl('/finance_emergency_tx?select=*'), { headers }),
        fetch(supaUrl('/finance_invest_tx?select=*'), { headers }),
      ]);
      const profileList = profRes.ok ? await profRes.json() : [];
      const debts = debtsRes.ok ? await debtsRes.json() : [];
      const em = emRes.ok ? await emRes.json() : [];
      const inv = invRes.ok ? await invRes.json() : [];
      const profile = profileList[0] || null;
      const mapped = {
        isEmployed: !!profile?.is_employed,
        hasExtraIncome: !!profile?.has_extra_income,
        incomeDays: Array.isArray(profile?.income_days) ? profile.income_days : [],
        typicalIncomeAmount: profile?.typical_income_amount || '',
        incomeCurrency: profile?.income_currency || 'USD',
        hasDebts: !!profile?.has_debts,
        hasEmergencyCash: !!profile?.has_emergency_cash,
        emergencyBase: Number(profile?.emergency_base || 0),
        hasInvestments: !!profile?.has_investments,
        notifyEnabled: !!profile?.notify_enabled,
        notifIds: [],
        debts: debts.map(d => ({ id: d.id, name: d.name, amount: Number(d.amount || 0), currency: d.currency || 'USD' })),
        emergencyTx: em.map(t => ({ id: t.id, date: t.date, type: t.type, amount: Number(t.amount||0), currency: t.currency||'USD', location: t.location||'', note: t.note||'' })),
        investTx: inv.map(t => ({ id: t.id, date: t.date, type: t.type, amount: Number(t.amount||0), currency: t.currency||'USD', destination: t.destination||'', note: t.note||'' })),
      };
      setFinanceData(prev => ({ ...prev, [currentUser.id]: mapped }));
      setCashReserve(mapped.emergencyBase);
    } catch {}
  };
  useEffect(() => { fetchSupaFinance(); }, [supaConfigured, currentSupaUser]);
  // Sync workouts/events with Supabase
  const fetchSupaWorkouts = async () => {
    if (!supaConfigured || !currentSupaUser) return;
    try {
      const url = supaUrl(`/workouts?select=*&order=id.desc`);
      const res = await fetch(url, { headers: supaAuthHeadersWithSession() });
      if (!res.ok) return;
      const list = await res.json();
      if (Array.isArray(list)) {
        const mapped = list.map(w => ({
          id: w.id,
          userId: currentUser?.id,
          date: w.date,
          time: w.time || '00:00',
          type: w.type || 'Тренировка',
          notes: w.notes || '',
          remindBefore: Number(w.remind_before) || 15,
        }));
        setWorkouts(mapped);
      }
    } catch {}
  };
  const fetchSupaEvents = async () => {
    if (!supaConfigured || !currentSupaUser) return;
    try {
      const url = supaUrl(`/events?select=*&order=id.desc`);
      const res = await fetch(url, { headers: supaAuthHeadersWithSession() });
      if (!res.ok) return;
      const list = await res.json();
      if (Array.isArray(list)) {
        const mapped = list.map(ev => ({
          id: ev.id,
          userId: currentUser?.id,
          date: ev.date,
          time: ev.time || '00:00',
          title: ev.title || 'Событие',
          notes: ev.notes || '',
          remindBefore: Number(ev.remind_before) || 30,
        }));
        setEvents(mapped);
      }
    } catch {}
  };
  useEffect(() => { fetchSupaWorkouts(); fetchSupaEvents(); }, [supaConfigured, currentSupaUser]);

  // Persist critical slices
  useEffect(() => storage.set('users', users), [users]);
  useEffect(() => storage.set('currentUserId', currentUserId), [currentUserId]);
  useEffect(() => storage.set('posts', posts), [posts]);
  useEffect(() => storage.set('financeData', financeData), [financeData]);
  useEffect(() => { fetchSupaPosts(); }, []);
  useEffect(() => storage.set('plannerPrefs', plannerPrefs), [plannerPrefs]);

  // Achievements state
  const [achievements, setAchievements] = useState([
    { id: 1, title: '🎯 Первая сделка', description: 'Выполните вашу первую торговую операцию', unlocked: true, date: '2025-01-15' },
    { id: 2, title: '📈 10% прибыль', description: 'Достигните 10% прибыли на портфеле', unlocked: false },
    { id: 3, title: '💪 Дисциплина', description: 'Ведите дневник сделок 30 дней подряд', unlocked: false },
    { id: 4, title: '💰 Подушка безопасности', description: 'Накопите 6 месяцев расходов', unlocked: false },
    { id: 5, title: '📊 Аналитик', description: 'Запишите 10 сделок с полным разбором', unlocked: false },
    { id: 6, title: '🏆 Мастер', description: '70% успешных сделок за месяц', unlocked: false },
    { id: 7, title: '🏃‍♂️ Баланс', description: '10 тренировок добавлено', unlocked: false },
    { id: 8, title: '📰 Инсайдер', description: '50 экономических новостей отслежено', unlocked: false },
  ]);

  // Calculations
  const emergencyMonths = useMemo(() =>
    monthlyExpenses > 0 ? (cashReserve / monthlyExpenses) : 0,
    [cashReserve, monthlyExpenses]
  );

  const calculateFutureValue = () => {
    const monthlyRate = apr / 12;
    const months = years * 12;
    let balance = startCapital;
    for (let i = 0; i < months; i++) {
      balance = balance * (1 + monthlyRate) + monthlyInvest;
    }
    return Math.round(balance * 100) / 100;
  };

  const futureValue = calculateFutureValue();

  const filteredTrades = useMemo(() => {
    return trades.filter(t =>
      (filterMarket === 'All' || t.market === filterMarket) &&
      (filterStyle === 'All' || t.style === filterStyle)
    );
  }, [trades, filterMarket, filterStyle]);

  const pnlStats = useMemo(() => {
    let realized = 0;
    let closedTrades = 0;
    let wins = 0;
    trades.forEach(t => {
      const tradeRealized = (t.closures || []).reduce((sum, c) => {
        const sign = t.side === 'BUY' ? 1 : -1;
        return sum + sign * (c.price - t.price) * c.qty;
      }, 0);
      realized += tradeRealized;
      const rem = (t.remainingQty ?? t.qty);
      if ((rem || 0) === 0 && (t.closures || []).length > 0) {
        closedTrades += 1;
        if (tradeRealized > 0) wins += 1;
      }
    });
    const winRate = closedTrades ? wins / closedTrades : 0;
    return { realized, winRate, closedTrades };
  }, [trades]);

  // Functions
  const addTrade = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для добавления сделок');
    if (!newTrade.asset || !newTrade.qty || !newTrade.price) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }
    const qtyN = parseNumberSafe(newTrade.qty);
    const priceN = parseNumberSafe(newTrade.price);
    if (!Number.isFinite(qtyN) || qtyN <= 0) return Alert.alert('Ошибка', 'Количество должно быть числом > 0');
    if (!Number.isFinite(priceN) || priceN <= 0) return Alert.alert('Ошибка', 'Цена должна быть числом > 0');
    // Optional SL/TP validation relative to side
    const slN = newTrade.stopLoss ? parseNumberSafe(newTrade.stopLoss) : null;
    const tpN = newTrade.takeProfit ? parseNumberSafe(newTrade.takeProfit) : null;
    if (slN != null && (!Number.isFinite(slN) || slN <= 0)) return Alert.alert('Ошибка', 'Stop Loss: введите корректное число');
    if (tpN != null && (!Number.isFinite(tpN) || tpN <= 0)) return Alert.alert('Ошибка', 'Take Profit: введите корректное число');
    if (slN != null) {
      if (newTrade.side === 'BUY' && slN >= priceN) return Alert.alert('Ошибка', 'Для BUY Stop Loss должен быть ниже цены входа');
      if (newTrade.side === 'SELL' && slN <= priceN) return Alert.alert('Ошибка', 'Для SELL Stop Loss должен быть выше цены входа');
    }
    if (tpN != null) {
      if (newTrade.side === 'BUY' && tpN <= priceN) return Alert.alert('Ошибка', 'Для BUY Take Profit должен быть выше цены входа');
      if (newTrade.side === 'SELL' && tpN >= priceN) return Alert.alert('Ошибка', 'Для SELL Take Profit должен быть ниже цены входа');
    }
    const trade = {
      id: trades.length ? Math.max(...trades.map(t => t.id)) + 1 : 1,
      userId: currentUser.id,
      ...newTrade,
      qty: qtyN,
      price: priceN,
      stopLoss: slN,
      takeProfit: tpN,
      trailingEnabled: !!newTrade.trailingEnabled,
      trailingType: newTrade.trailingType,
      trailingValue: newTrade.trailingValue ? parseNumberSafe(newTrade.trailingValue) : null,
      remainingQty: qtyN,
      closures: []
    };
    setTrades(prev => [trade, ...prev]);
    // Ensure the new trade is visible in the list regardless of current filters
    setFilterMarket('All');
    setFilterStyle('All');
    Alert.alert('Готово', 'Сделка добавлена');
    setNewTrade({ asset: '', side: 'BUY', qty: '', price: '', market: 'Crypto', style: 'Скальпинг', date: new Date().toISOString().slice(0,10), notes: '', stopLoss: '', takeProfit: '', trailingEnabled: false, trailingType: 'percent', trailingValue: '' });
  };

  // Upgrade existing trades to ensure remainingQty/closures exist
  useEffect(() => {
    setTrades(prev => prev.map(t => (
      t.remainingQty == null || !Array.isArray(t.closures)
        ? { ...t, remainingQty: t.remainingQty == null ? t.qty : t.remainingQty, closures: Array.isArray(t.closures) ? t.closures : [] }
        : t
    )));
  }, []);

  const closeTradePartial = (tradeId) => {
    const draft = closeDrafts[tradeId] || { qty: '', price: '' };
    const qty = parseNumberSafe(draft.qty);
    const price = parseNumberSafe(draft.price);
    if (!Number.isFinite(qty) || qty <= 0) return Alert.alert('Ошибка', 'Введите количество > 0');
    if (!Number.isFinite(price) || price <= 0) return Alert.alert('Ошибка', 'Введите цену > 0');
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      if ((t.remainingQty || 0) < qty) {
        Alert.alert('Ошибка', 'Количество превышает остаток');
        return t;
      }
      const closure = { id: Date.now(), date: new Date().toISOString().slice(0,10), qty, price };
      return { ...t, remainingQty: (t.remainingQty || 0) - qty, closures: [closure, ...(t.closures || [])] };
    }));
    setCloseDrafts(prev => ({ ...prev, [tradeId]: { qty: '', price: '' } }));
  };

  const closeTradeFull = (tradeId) => {
    const draft = closeDrafts[tradeId] || { qty: '', price: '' };
    const price = parseNumberSafe(draft.price);
    if (!Number.isFinite(price) || price <= 0) return Alert.alert('Ошибка', 'Введите цену > 0');
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      const qty = t.remainingQty || 0;
      if (qty <= 0) return t;
      const closure = { id: Date.now(), date: new Date().toISOString().slice(0,10), qty, price };
      return { ...t, remainingQty: 0, closures: [closure, ...(t.closures || [])] };
    }));
    setCloseDrafts(prev => ({ ...prev, [tradeId]: { qty: '', price: '' } }));
  };

  const addWorkout = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для добавления тренировок');
    const workout = { id: workouts.length ? Math.max(...workouts.map(w => w.id)) + 1 : 1, userId: currentUser.id, ...newWorkout };
    setWorkouts(prev => [workout, ...prev]);
    tryScheduleReminder(`${newWorkout.date}T${(newWorkout.time||'00:00')}:00`, newWorkout.remindBefore, 'Тренировка скоро', `${newWorkout.type} в ${newWorkout.time}`);
    setNewWorkout({ date: new Date().toISOString().slice(0,10), time: '18:00', type: 'Кардио', notes: '', remindBefore: 15 });
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          const body = [{ user_id: currentUser.id, date: workout.date, time: workout.time, type: workout.type, notes: workout.notes, remind_before: workout.remindBefore }];
          await fetch(supaUrl('/workouts'), { method: 'POST', headers: supaAuthHeadersWithSession(), body: JSON.stringify(body) });
          fetchSupaWorkouts();
        } catch {}
      })();
    }
  };

  const deleteWorkout = (id) => {
    if (!currentUser) return;
    setWorkouts(prev => prev.filter(w => w.id !== id));
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          await fetch(supaUrl(`/workouts?id=eq.${encodeURIComponent(id)}`), { method: 'DELETE', headers: supaAuthHeadersWithSession() });
        } catch {}
      })();
    }
  };

  const addEvent = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для добавления событий');
    if (!newEvent.title) {
      Alert.alert('Ошибка', 'Введите заголовок');
      return;
    }
    const event = { id: events.length ? Math.max(...events.map(e => e.id)) + 1 : 1, userId: currentUser.id, ...newEvent };
    setEvents(prev => [event, ...prev]);
    tryScheduleReminder(`${newEvent.date}T${(newEvent.time||'00:00')}:00`, newEvent.remindBefore, 'Событие скоро', `${newEvent.title} в ${newEvent.time}`);
    setNewEvent({ date: new Date().toISOString().slice(0,10), time: '10:00', title: '', notes: '', remindBefore: 30 });
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          const body = [{ user_id: currentUser.id, date: event.date, time: event.time, title: event.title, notes: event.notes, remind_before: event.remindBefore }];
          await fetch(supaUrl('/events'), { method: 'POST', headers: supaAuthHeadersWithSession(), body: JSON.stringify(body) });
          fetchSupaEvents();
        } catch {}
      })();
    }
  };

  const deleteEvent = (id) => {
    if (!currentUser) return;
    setEvents(prev => prev.filter(e => e.id !== id));
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          await fetch(supaUrl(`/events?id=eq.${encodeURIComponent(id)}`), { method: 'DELETE', headers: supaAuthHeadersWithSession() });
        } catch {}
      })();
    }
  };

  const deleteTrade = (id) => setTrades(prev => prev.filter(t => t.id !== id));

  // Finance: delete emergency/invest/debt transactions
  const deleteEmergencyTx = (txId) => {
    if (!currentUser) return;
    let removed = null;
    withFinance(cur => {
      const list = cur.emergencyTx || [];
      removed = list.find(t => t.id === txId) || null;
      const next = list.filter(t => t.id !== txId);
      return { ...cur, emergencyTx: next };
    });
    if (removed) {
      const delta = (removed.type === 'deposit' ? -1 : 1) * (Number(removed.amount) || 0);
      setCashReserve(prev => Math.max(0, (Number(prev) || 0) + delta));
    }
  };

  const deleteInvestTx = (txId) => {
    if (!currentUser) return;
    withFinance(cur => {
      const list = cur.investTx || [];
      const next = list.filter(t => t.id !== txId);
      return { ...cur, investTx: next };
    });
  };

  const deleteDebtTx = (txId) => {
    if (!currentUser) return;
    withFinance(cur => {
      const list = cur.debtTx || [];
      const next = list.filter(t => t.id !== txId);
      return { ...cur, debtTx: next };
    });
  };

  const formatCurrency = (value) => `${formatCurrencyCustom(value, 'USD')}`;
  const formatCurrencyCustom = (value, currency) => {
    const num = Number(value);
    const cur = (currency || '').toString().trim();
    if (!Number.isFinite(num)) return `0,0${cur ? ' ' + cur : ''}`;
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    // Start with high precision, then trim
    const fixed = abs.toFixed(10);
    const parts = fixed.split('.');
    const intPart = parts[0] || '0';
    let fracPart = parts[1] || '';
    // Remove trailing zeros fully
    while (fracPart.endsWith('0')) fracPart = fracPart.slice(0, -1);
    // Ensure at least one decimal digit is shown
    if (fracPart.length === 0) fracPart = '0';
    // Thousands separator for integer part (space), decimal comma
    const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${sign}${intWithSpaces},${fracPart}${cur ? ' ' + cur : ''}`;
  };
  const formatNumberCompact = (value, options = {}) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0,0';
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    const fixed = abs.toFixed(options.maxDecimals ?? 6);
    let [intPart, fracPart = ''] = fixed.split('.');
    while (fracPart.endsWith('0')) fracPart = fracPart.slice(0, -1);
    if (fracPart.length === 0) fracPart = '0';
    const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${sign}${intWithSpaces},${fracPart}`;
  };
  const getImportanceStars = (importance) => '★'.repeat(importance);
  const parseNumberSafe = (value) => {
    const raw = (value ?? '').toString().trim().replace(',', '.').replace(/\s+/g, '');
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  };

  // Notifications: foreground handler (show alerts)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  // Helper to schedule a one-off reminder X minutes before a given ISO datetime (local)
  const tryScheduleReminder = async (isoDateTime, minutesBefore, title, body) => {
    try {
      if (!isoDateTime || !minutesBefore) return;
      const ok = await ensureNotificationPermissions();
      if (!ok) return;
      const when = new Date(isoDateTime);
      if (Number.isNaN(when.getTime())) return;
      const triggerDate = new Date(when.getTime() - minutesBefore * 60 * 1000);
      if (triggerDate.getTime() <= Date.now()) return; // skip past times
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: triggerDate,
      });
    } catch {}
  };

  // Daily planner reminder toggle
  const schedulePlannerDaily = async () => {
    const ok = await ensureNotificationPermissions();
    if (!ok) return;
    const [h, m] = (plannerPrefs.time || '22:00').split(':').map(t => Number(t));
    try {
      if (plannerPrefs.notifId) {
        try { await Notifications.cancelScheduledNotificationAsync(plannerPrefs.notifId); } catch {}
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: 'Планер', body: 'Завтра тренировки/события. Хотите запланировать что-то ещё?' },
        trigger: { hour: h || 22, minute: m || 0, repeats: true },
      });
      setPlannerPrefs(p => ({ ...p, enabled: true, notifId: id }));
      Alert.alert('Уведомления', 'Ежедневное напоминание включено');
    } catch {}
  };
  const cancelPlannerDaily = async () => {
    try {
      if (plannerPrefs.notifId) await Notifications.cancelScheduledNotificationAsync(plannerPrefs.notifId);
    } catch {}
    setPlannerPrefs(p => ({ ...p, enabled: false, notifId: null }));
    Alert.alert('Уведомления', 'Ежедневное напоминание отключено');
  };

  // Recurring workouts generation
  const generateRecurringWorkouts = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для добавления');
    const start = new Date(recurring.startDate);
    if (Number.isNaN(start.getTime())) return Alert.alert('Ошибка', 'Неверная стартовая дата');
    const mapIdx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const chosen = Object.entries(recurring.days).filter(([, v]) => v).map(([k]) => mapIdx[k]);
    if (chosen.length === 0) return Alert.alert('Ошибка', 'Выберите дни недели');
    const weeks = Math.max(1, Math.min(52, Number(recurring.weeks) || 1));
    const created = [];
    for (let w = 0; w < weeks; w++) {
      for (const dow of chosen) {
        const d = new Date(start);
        // move to the week w and set to desired weekday
        d.setDate(start.getDate() + w * 7 + ((dow - d.getDay() + 7) % 7));
        const dateStr = d.toISOString().slice(0, 10);
        const workout = {
          id: Date.now() + created.length + w,
          userId: currentUser.id,
          date: dateStr,
          time: recurring.time,
          type: recurring.type,
          notes: recurring.notes,
          remindBefore: recurring.remindBefore,
        };
        created.push(workout);
      }
    }
    setWorkouts(prev => [...created, ...prev]);
    created.forEach(wk => tryScheduleReminder(`${wk.date}T${(wk.time||'00:00')}:00`, wk.remindBefore, 'Тренировка скоро', `${wk.type} в ${wk.time}`));
    Alert.alert('Готово', `Создано тренировок: ${created.length}`);
  };

  // Import course schedule JSON
  const importCourseSchedule = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для импорта');
    try {
      const arr = JSON.parse(courseImportText);
      if (!Array.isArray(arr)) throw new Error('not array');
      const newW = [];
      const newE = [];
      arr.forEach((it, idx) => {
        const date = it.date || '';
        const time = it.time || '00:00';
        const remind = Number(it.remindBefore) || 15;
        if ((it.type || '').toLowerCase() === 'workout') {
          const wk = { id: Date.now() + idx, userId: currentUser.id, date, time, type: it.title || 'Тренировка', notes: it.notes || '', remindBefore: remind };
          newW.push(wk);
        } else {
          const ev = { id: Date.now() + 100000 + idx, userId: currentUser.id, date, time, title: it.title || 'Событие', notes: it.notes || '', remindBefore: remind };
          newE.push(ev);
        }
      });
      if (newW.length) setWorkouts(prev => [...newW, ...prev]);
      if (newE.length) setEvents(prev => [...newE, ...prev]);
      [...newW, ...newE].forEach(item => {
        const title = item.type ? 'Тренировка скоро' : 'Событие скоро';
        const body = item.type ? `${item.type} в ${item.time || ''}` : `${item.title} в ${item.time || ''}`;
        tryScheduleReminder(`${item.date}T${(item.time||'00:00')}:00`, item.remindBefore, title, body);
      });
      Alert.alert('Импорт', `Добавлено: тренировки ${newW.length}, события ${newE.length}`);
      setCourseImportText('');
    } catch (e) {
      Alert.alert('Ошибка импорта', 'Ожидается JSON-массив объектов { type, title, date, time, remindBefore, notes }');
    }
  };

  // TradingEconomics integration (public demo credentials)
  const countryCodeMap = {
    US: 'United States', EU: 'Euro Area', CN: 'China', RU: 'Russia', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
    JP: 'Japan', CA: 'Canada', AU: 'Australia', NZ: 'New Zealand', CH: 'Switzerland', IT: 'Italy', ES: 'Spain'
  };
  const normalizeCountries = (input) => {
    if (!input) return '';
    return input.split(',').map(t => t.trim()).filter(Boolean).map(tok => {
      const up = tok.toUpperCase();
      return countryCodeMap[up] || tok; // allow full names
    }).join(',');
  };
  const selectedImportanceList = () => Object.entries(importanceFilters).filter(([k, v]) => v).map(([k]) => k).join(',');
  const formatDate = (d) => d.toISOString().slice(0, 10);
  const mapImportanceLabelToLevel = (label) => {
    const l = (label || '').toString().toLowerCase();
    if (l.includes('high') || l.includes('выс')) return 3;
    if (l.includes('medium') || l.includes('сред')) return 2;
    if (l.includes('low') || l.includes('низ')) return 1;
    const n = Number(label);
    return Number.isFinite(n) && n >= 1 && n <= 3 ? n : 1;
  };
  const parseTEDateRaw = (raw) => {
    if (!raw && raw !== 0) return null;
    try {
      if (typeof raw === 'number') {
        const ms = raw < 1e12 ? raw * 1000 : raw;
        return new Date(ms);
      }
      const s = String(raw);
      const m = /\/Date\((\d+)\)\//.exec(s);
      if (m) return new Date(Number(m[1]));
      const t = Date.parse(s);
      if (!Number.isNaN(t)) return new Date(t);
      return null;
    } catch { return null; }
  };
  const refreshNews = async () => {
    setNewsLoading(true);
    setNewsError('');
    try {
      const now = new Date();
      const d1 = formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * newsBackDays));
      const d2 = formatDate(new Date(now.getTime() + 1000 * 60 * 60 * 24 * newsForwardDays));
      const countries = normalizeCountries(newsCountry);
      const importance = selectedImportanceList();
      // Use your TE key:secret provided by the user (fallback to guest:guest)
      const primaryCred = 'e4cd3fef8e944b6:fjav7sp40q39exh';
      const guestCred = 'guest:guest';
      const buildParams = (cred, withFilters) => {
        const p = new URLSearchParams({ c: cred, format: 'json', d1, d2 });
        if (withFilters) {
          if (countries) p.set('country', countries);
          if (importance) p.set('importance', importance);
        }
        return p;
      };
      const teUrl = (p) => `https://api.tradingeconomics.com/calendar?${p.toString()}`;
      const corsWrap = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      let res;
      let lastErr;
      const attempts = [
        teUrl(buildParams(primaryCred, true)),
        teUrl(buildParams(guestCred, true)),
        teUrl(buildParams(guestCred, false)),
      ];
      for (let i = 0; i < attempts.length; i++) {
        try {
          res = await fetch(attempts[i], { headers: { 'Accept': 'application/json' } });
          if (res.ok) break;
          // try CORS proxy if running on web and CORS blocks
          const corsRes = await fetch(corsWrap(attempts[i]), { headers: { 'Accept': 'application/json' } });
          if (corsRes.ok) { res = corsRes; break; }
          lastErr = new Error(`HTTP ${res.status}`);
        } catch (e) {
          // network/CORS – try proxy
          try {
            const corsRes = await fetch(corsWrap(attempts[i]), { headers: { 'Accept': 'application/json' } });
            if (corsRes.ok) { res = corsRes; break; }
            lastErr = new Error('network/cors');
          } catch (e2) {
            lastErr = e2;
          }
        }
      }
      if (!res || !res.ok) throw (lastErr || new Error('fetch failed'));
      let json = await res.json().catch(async () => {
        // some proxies return text/json
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { return []; }
      });
      let items = Array.isArray(json) ? json : (Array.isArray(json?.calendar) ? json.calendar : []);
      // If still empty, try a last-chance high-importance only
      if (!items || items.length === 0) {
        const lastParams = new URLSearchParams({ c: guestCred, format: 'json', d1, d2, importance: '3' });
        const lastUrl = teUrl(lastParams);
        try {
          const r2 = await fetch(lastUrl, { headers: { 'Accept': 'application/json' } });
          if (r2.ok) {
            json = await r2.json().catch(async () => { const t2 = await r2.text(); try { return JSON.parse(t2); } catch { return []; } });
            items = Array.isArray(json) ? json : (Array.isArray(json?.calendar) ? json.calendar : []);
          }
        } catch {}
      }
      const mapped = items.map((it, idx) => {
        const dt = it.Date || it.DateUtc || it.DateISO || it.date;
        const dObj = parseTEDateRaw(dt);
        const dateStr = dObj ? `${dObj.getFullYear()}-${pad2(dObj.getMonth()+1)}-${pad2(dObj.getDate())}` : (it.Date || '').slice(0, 10);
        const timeStr = dObj ? `${pad2(dObj.getHours())}:${pad2(dObj.getMinutes())}` : (it.Time || '').slice(0, 5);
        const level = mapImportanceLabelToLevel(it.Importance || it.importance);
        return {
          id: `${it.EventId || it.Id || idx}-${dateStr}`,
          date: dateStr,
          time: timeStr,
          country: it.Country || it.CountryName || '—',
          title: it.Event || it.Category || it.Title || it.EventName || 'Событие',
          Actual: it.Actual || it.ActualValue || it.ActualPrevious || null,
          Previous: it.Previous || it.PreviousValue || null,
          Forecast: it.Forecast || it.ForecastValue || null,
          importance: level,
        };
      }).filter(it => importanceFilters[it.importance]);
      if (mapped.length === 0) {
        // As a last resort, show demo items so UI is not empty
        const today = new Date().toISOString().slice(0,10);
        const demo = [
          { id: `demo1-${today}`, date: today, time: '10:00', country: 'United States', title: 'Demo CPI YoY', importance: 3 },
          { id: `demo2-${today}`, date: today, time: '12:00', country: 'Euro Area', title: 'Demo GDP QoQ', importance: 2 },
        ];
        setNews(demo);
        setNewsError('Отображаются демо-данные TradingEconomics (API вернуло 0 записей для текущих фильтров/диапазона).');
      } else {
      setNews(mapped);
      }
    } catch (e) {
      const msg = (e && e.message) ? `Ошибка загрузки новостей (${e.message}).` : 'Ошибка загрузки новостей.';
      setNewsError(`${msg} Проверьте подключение/VPN и попробуйте позже.`);
    } finally {
      setNewsLoading(false);
    }
  };
  useEffect(() => { refreshNews(); }, []);
  useEffect(() => {
    const id = setInterval(refreshNews, 5 * 60 * 1000); // автообновление каждые 5 минут
    return () => clearInterval(id);
  }, [newsCountry, importanceFilters, newsBackDays, newsForwardDays]);

  const expandNewsRange = () => {
    setNewsBackDays(v => v + 30);
    setNewsForwardDays(v => v + 30);
    setTimeout(() => refreshNews(), 0);
  };
  const resetNewsRange = () => {
    setNewsBackDays(7);
    setNewsForwardDays(14);
    setTimeout(() => refreshNews(), 0);
  };

  // Community functions
  const uploadPostImages = async (uris) => {
    if (!supaConfigured || !uris || uris.length === 0) return uris || [];
    const out = [];
    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      try {
        let sourceUri = uri;
        try {
          const m = await manipulateAsync(uri, [{ resize: { width: 1600 } }], { compress: 0.7, format: SaveFormat.JPEG });
          if (m?.uri) sourceUri = m.uri;
        } catch {}
        const resp = await fetch(sourceUri);
        const blob = await resp.blob();
        const ext = 'jpg';
        const key = `posts/${currentUser?.id || 'anon'}/${Date.now()}_${i}.${ext}`;
        const upRes = await fetch(supaStorageUrl(`/object/${encodeURIComponent(supa.bucket || 'public')}/${encodeURIComponent(key)}`), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supa.anonKey}`, 'apikey': supa.anonKey, 'x-upsert': 'true' },
          body: blob,
        });
        if (!upRes.ok) throw new Error(`upload ${upRes.status}`);
        out.push(supaPublicUrl(key));
      } catch {
        out.push(uri);
      }
    }
    return out;
  };

  const addPost = async () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для публикации');
    const title = newPost.title.trim();
    const content = newPost.content.trim();
    if (!title || !content) return Alert.alert('Ошибка', 'Введите заголовок и текст');
    const uploadedImages = await uploadPostImages(newPost.images || []);
    const post = {
      id: posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1,
      userId: currentUser.id,
      title,
      content,
      market: newPost.market,
      images: uploadedImages,
      likes: [],
      comments: [],
      date: new Date().toISOString().slice(0,10),
    };
    setPosts(prev => [post, ...prev]);
    setNewPost({ title: '', content: '', market: 'Crypto', images: [] });
    // Try to send to Supabase if configured
    if (supaConfigured) {
      (async () => {
        try {
          const res = await fetch(supaUrl('/posts'), {
            method: 'POST',
            headers: currentSupaUser ? supaAuthHeadersWithSession() : supaHeaders(),
            body: JSON.stringify(currentSupaUser ? [{ user_id: currentUser.id, title: post.title, content: post.content, market: post.market, images: post.images, likes: post.likes, comments: post.comments }] : post),
          });
          if (!res.ok) throw new Error('post insert failed');
          await fetchSupaPosts();
        } catch {}
      })();
    }
  };

  const pickImagesForPost = async () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для публикации');
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Доступ к галерее', 'Разрешите доступ к фотографиям');
          return;
        }
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (res.canceled) return;
      const uris = (res.assets || []).map(a => a.uri).filter(Boolean);
      setNewPost(v => ({ ...v, images: [...(v.images||[]), ...uris] }));
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображения');
    }
  };

  const pickAvatarImage = async () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для изменения аватара');
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Доступ к галерее', 'Разрешите доступ к фотографиям');
          return;
        }
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 0.9,
      });
      if (res.canceled) return;
      const uri = (res.assets && res.assets[0] && res.assets[0].uri) || '';
      if (!uri) return;
      let finalUri = uri;
      if (supaConfigured) {
        try {
          let sourceUri = uri;
          try {
            const m = await manipulateAsync(uri, [{ resize: { width: 800 } }], { compress: 0.8, format: SaveFormat.JPEG });
            if (m?.uri) sourceUri = m.uri;
          } catch {}
          const resp = await fetch(sourceUri);
          const blob = await resp.blob();
          const ext = 'jpg';
          const key = `avatars/${currentUser.id}.${ext}`;
          const upRes = await fetch(supaStorageUrl(`/object/${encodeURIComponent(supa.bucket || 'public')}/${encodeURIComponent(key)}`), {
            method: 'POST', headers: { 'Authorization': `Bearer ${supa.anonKey}`, 'apikey': supa.anonKey, 'x-upsert': 'true' }, body: blob,
          });
          if (upRes.ok) finalUri = supaPublicUrl(key);
        } catch {}
      }
      updateProfile({ avatar: finalUri });
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const toggleLike = (postId) => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для лайков');
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(currentUser.id);
      return { ...p, likes: liked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id] };
    }));
  };

  const addComment = (postId) => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для комментариев');
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const comment = { id: p.comments.length ? Math.max(...p.comments.map(c => c.id)) + 1 : 1, userId: currentUser.id, text, date: new Date().toISOString().slice(0,10) };
      return { ...p, comments: [...p.comments, comment] };
    }));
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
  };

  // Allow users to delete their own posts and comments
  const deletePost = (postId) => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для удаления');
    setPosts(prev => prev.filter(p => !(p.id === postId && p.userId === currentUser.id)));
  };

  const deleteComment = (postId, commentId) => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для удаления');
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const target = p.comments.find(c => c.id === commentId);
      if (!target || target.userId !== currentUser.id) return p;
      return { ...p, comments: p.comments.filter(c => c.id !== commentId) };
    }));
  };

  // Derived helpers
  const userById = (id) => {
    const local = users.find(u => u.id === id);
    if (local) return local;
    if (currentUser && currentUser.id === id) return currentUser;
    return { nickname: 'Unknown' };
  };
  const friendsOfCurrent = currentUser ? currentUser.friends.map(id => userById(id)) : [];
  const suggestedUsers = currentUser ? users.filter(u => u.id !== currentUser.id && !currentUser.friends.includes(u.id)) : users;

  // Finance: current profile, computed values and actions
  const currentFinance = useMemo(() => (currentUser ? financeData[currentUser.id] : null), [financeData, currentUser]);

  const parseIncomeDays = (text) => Array.from(new Set((text || '')
    .split(',')
    .map(t => Number(t.trim()))
    .filter(n => Number.isFinite(n) && n >= 1 && n <= 31)
  )).sort((a,b) => a - b);

  const saveFinanceForm = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для сохранения');
    const profile = {
      isEmployed: !!financeForm.isEmployed,
      hasExtraIncome: !!financeForm.hasExtraIncome,
      incomeDays: parseIncomeDays(financeForm.incomeDaysText),
      typicalIncomeAmount: financeForm.typicalIncomeAmount,
      incomeCurrency: financeForm.incomeCurrency || 'USD',
      hasDebts: !!financeForm.hasDebts,
      hasEmergencyCash: !!financeForm.hasEmergencyCash,
      emergencyBase: Number(financeForm.emergencyCashAmount) || 0,
      hasInvestments: !!financeForm.hasInvestments,
      debts: (currentFinance && Array.isArray(currentFinance.debts)) ? currentFinance.debts : [],
      emergencyTx: (currentFinance && Array.isArray(currentFinance.emergencyTx)) ? currentFinance.emergencyTx : [],
      investTx: (currentFinance && Array.isArray(currentFinance.investTx)) ? currentFinance.investTx : [],
      debtTx: (currentFinance && Array.isArray(currentFinance.debtTx)) ? currentFinance.debtTx : [],
      notifyEnabled: !!financeForm.notifyEnabled,
      notifIds: currentFinance?.notifIds || [],
    };
    setFinanceData(prev => ({ ...prev, [currentUser.id]: profile }));
    // Sync emergency cash to existing cashReserve state for compatibility
    setCashReserve(profile.emergencyBase);
    setFinanceEditMode(false);
    Alert.alert('Готово', 'Финансовый профиль сохранён');
    if (profile.notifyEnabled) {
      rescheduleIncomeReminders(profile);
    } else if ((currentFinance?.notifIds || []).length) {
      cancelIncomeReminders();
    }
  };

  const sortedDebts = useMemo(() => {
    const list = currentFinance?.debts || [];
    return [...list].sort((a, b) => (a.amount || 0) - (b.amount || 0));
  }, [currentFinance]);

  const withFinance = (updater) => {
    if (!currentUser) return;
    setFinanceData(prev => {
      const cur = prev[currentUser.id] || { debts: [], emergencyTx: [], investTx: [], debtTx: [], incomeDays: [] };
      const next = updater(cur);
      return { ...prev, [currentUser.id]: next };
    });
  };

  const addDebt = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для добавления');
    const name = newDebt.name.trim();
    const amount = Number(newDebt.amount) || 0;
    if (!name || amount <= 0) return Alert.alert('Ошибка', 'Введите название и сумму > 0');
    withFinance(cur => {
      const id = (cur.debts?.length ? Math.max(...cur.debts.map(d => d.id || 0)) + 1 : 1);
      const debts = [...(cur.debts || []), { id, name, amount, currency: newDebt.currency || 'USD' }];
      const tx = { id: Date.now(), date: new Date().toISOString().slice(0,10), debtId: id, type: 'add', amount, currency: newDebt.currency || 'USD', note: 'Создание долга' };
      const debtTx = [tx, ...(cur.debtTx || [])];
      return { ...cur, debts, debtTx };
    });
    setNewDebt({ name: '', amount: '', currency: newDebt.currency || 'USD' });
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          const body = [{ user_id: currentUser.id, name, amount, currency: newDebt.currency || 'USD' }];
          await fetch(supaUrl('/finance_debts'), { method: 'POST', headers: supaAuthHeadersWithSession(), body: JSON.stringify(body) });
          fetchSupaFinance();
        } catch {}
      })();
    }
  };

  const repayDebtPartial = (debtId) => {
    const draft = Number(repayDrafts[debtId]) || 0;
    if (draft <= 0) return;
    withFinance(cur => {
      const target = (cur.debts || []).find(d => d.id === debtId);
      if (!target) return cur;
      const newAmount = Math.max(0, (target.amount || 0) - draft);
      const debts = (cur.debts || []).map(d => d.id === debtId ? { ...d, amount: newAmount } : d).filter(d => (d.amount || 0) > 0);
      const tx = { id: Date.now(), date: new Date().toISOString().slice(0,10), debtId, type: 'repay', amount: draft, currency: target.currency || 'USD', note: '' };
      const debtTx = [tx, ...(cur.debtTx || [])];
      return { ...cur, debts, debtTx };
    });
    setRepayDrafts(prev => ({ ...prev, [debtId]: '' }));
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          const target = (currentFinance?.debts || []).find(d => d.id === debtId);
          if (!target) return;
          const newAmount = Math.max(0, (target.amount || 0) - draft);
          await fetch(supaUrl(`/finance_debts?id=eq.${encodeURIComponent(debtId)}`), { method: 'PATCH', headers: supaAuthHeadersWithSession(), body: JSON.stringify({ amount: newAmount }) });
          fetchSupaFinance();
        } catch {}
      })();
    }
  };

  const repayDebtFull = (debtId) => {
    withFinance(cur => {
      const target = (cur.debts || []).find(d => d.id === debtId);
      const debts = (cur.debts || []).filter(d => d.id !== debtId);
      const tx = target ? { id: Date.now(), date: new Date().toISOString().slice(0,10), debtId, type: 'close', amount: target.amount || 0, currency: target.currency || 'USD', note: 'Полное погашение' } : null;
      const debtTx = tx ? [tx, ...(cur.debtTx || [])] : (cur.debtTx || []);
      return { ...cur, debts, debtTx };
    });
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          await fetch(supaUrl(`/finance_debts?id=eq.${encodeURIComponent(debtId)}`), { method: 'DELETE', headers: supaAuthHeadersWithSession() });
        } catch {}
      })();
    }
  };

  // Emergency holdings helper: current balance for a specific destination (location + currency)
  const getEmergencyHoldingBalance = (location, currency) => {
    const list = currentFinance?.emergencyTx || [];
    const loc = (location || '').toString();
    const cur = (currency || 'USD').toString();
    let sum = 0;
    for (const tx of list) {
      if (((tx.location || '').toString() === loc) && ((tx.currency || 'USD').toString() === cur)) {
        sum += (tx.type === 'deposit' ? 1 : -1) * (Number(tx.amount) || 0);
      }
    }
    return sum;
  };

  // Investment holdings helper: current balance for a specific destination (destination + currency)
  const getInvestHoldingBalance = (destination, currency) => {
    const list = currentFinance?.investTx || [];
    const dest = (destination || '').toString();
    const cur = (currency || 'USD').toString();
    let sum = 0;
    for (const tx of list) {
      if (((tx.destination || '').toString() === dest) && ((tx.currency || 'USD').toString() === cur)) {
        sum += (tx.type === 'in' ? 1 : -1) * (Number(tx.amount) || 0);
      }
    }
    return sum;
  };

  const emergencyHoldings = useMemo(() => {
    const list = currentFinance?.emergencyTx || [];
    const map = {};
    for (const tx of list) {
      const currency = (tx.currency || 'USD').toString();
      const location = (tx.location || '').toString();
      const key = `${currency}::${location}`;
      const delta = (tx.type === 'deposit' ? 1 : -1) * (Number(tx.amount) || 0);
      map[key] = (map[key] || 0) + delta;
    }
    return Object.entries(map)
      .map(([key, amount]) => {
        const [currency, location] = key.split('::');
        return { currency, location, amount };
      })
      .filter(h => (h.amount || 0) > 0)
      .sort((a, b) => (b.amount - a.amount));
  }, [currentFinance]);

  const investHoldings = useMemo(() => {
    const list = currentFinance?.investTx || [];
    const map = {};
    for (const tx of list) {
      const currency = (tx.currency || 'USD').toString();
      const destination = (tx.destination || '').toString();
      const key = `${currency}::${destination}`;
      const delta = (tx.type === 'in' ? 1 : -1) * (Number(tx.amount) || 0);
      map[key] = (map[key] || 0) + delta;
    }
    return Object.entries(map)
      .map(([key, amount]) => {
        const [currency, destination] = key.split('::');
        return { currency, destination, amount };
      })
      .filter(h => (h.amount || 0) > 0)
      .sort((a, b) => (b.amount - a.amount));
  }, [currentFinance]);

  const addEmergencyTransaction = async () => {
    const amount = Number(newEmergencyTx.amount) || 0;
    if (amount <= 0) return Alert.alert('Ошибка', 'Введите сумму > 0');
    // Disallow withdrawing more than available reserve and require selecting holding
    if (newEmergencyTx.type === 'withdraw') {
      const prevReserve = Number(cashReserve) || 0;
      if (amount > prevReserve) {
        notify('Недостаточно средств в подушке безопасности для этой суммы', 'error');
        return;
      }
      const selLoc = (newEmergencyTx.location || '').trim();
      if (!selLoc) {
        notify('Выберите вклад для списания', 'error');
        return;
      }
      const holdBal = getEmergencyHoldingBalance(selLoc, newEmergencyTx.currency);
      if (amount > holdBal) {
        notify('Недостаточно средств в выбранном вкладе', 'error');
        return;
      }
      // Immediate warning before state updates to ensure it shows on web
      if (prevReserve > 0) {
        const withdrawnRatio = amount / prevReserve;
        if (withdrawnRatio >= 0.8) {
          // Ask for confirmation with explicit info
          const ok = await confirmAsync('Эта операция спишет более 80% подушки безопасности. Продолжить?');
          if (!ok) return;
        }
      }
    }
    const entry = { id: Date.now(), date: new Date().toISOString().slice(0,10), ...newEmergencyTx, amount };
    withFinance(cur => ({ ...cur, emergencyTx: [entry, ...(cur.emergencyTx || [])] }));
    // Update reserve and warn if withdrawal >= 80% of current reserve
    if (newEmergencyTx.type === 'deposit') {
      const newReserve = (Number(cashReserve) || 0) + amount;
      setCashReserve(newReserve);
    } else {
      const prevReserve = Number(cashReserve) || 0;
      const newReserve = Math.max(0, prevReserve - amount);
      setCashReserve(newReserve);
      if (prevReserve > 0 && (amount / prevReserve) >= 0.8) {
        notify('Вы сняли больше 80% подушки безопасности', 'error');
      }
    }
    setNewEmergencyTx(tx => ({ ...tx, amount: '', note: '' }));
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          const body = [{ user_id: currentUser.id, date: entry.date, type: entry.type, amount: entry.amount, currency: entry.currency, location: entry.location, note: entry.note }];
          await fetch(supaUrl('/finance_emergency_tx'), { method: 'POST', headers: supaAuthHeadersWithSession(), body: JSON.stringify(body) });
          fetchSupaFinance();
        } catch {}
      })();
    }
  };

  const transferEmergencyBetweenHoldings = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для перевода');
    const amount = Number(newEmergencyTransfer.amount) || 0;
    if (amount <= 0) return Alert.alert('Ошибка', 'Введите сумму > 0');
    const from = (newEmergencyTransfer.fromLocation || '').trim();
    const to = (newEmergencyTransfer.toLocation || '').trim();
    const cur = (newEmergencyTransfer.currency || 'USD').trim();
    if (!from || !to) return Alert.alert('Ошибка', 'Выберите откуда и куда');
    if (from === to) return Alert.alert('Ошибка', 'Места должны отличаться');
    const bal = getEmergencyHoldingBalance(from, cur);
    if (amount > bal) return Alert.alert('Ошибка', 'Недостаточно средств на исходном вкладе');
    const date = new Date().toISOString().slice(0,10);
    withFinance(curState => {
      const list = curState.emergencyTx || [];
      const outTx = { id: Date.now(), date, type: 'withdraw', amount, currency: cur, location: from, note: `Перевод → ${to}` };
      const inTx = { id: Date.now() + 1, date, type: 'deposit', amount, currency: cur, location: to, note: `Перевод из ${from}` };
      return { ...curState, emergencyTx: [inTx, outTx, ...list] };
    });
    // total reserve unchanged
    setNewEmergencyTransfer({ fromLocation: '', toLocation: '', currency: cur, amount: '' });
  };

  const renameEmergencyHolding = () => {
    if (!currentUser) return;
    const src = (renameEmergency.sourceLocation || '').trim();
    const dst = (renameEmergency.newLocation || '').trim();
    const cur = (renameEmergency.currency || 'USD').trim();
    if (!src || !dst) return Alert.alert('Ошибка', 'Укажите исходное и новое название');
    if (src === dst) return Alert.alert('Ошибка', 'Названия совпадают');
    withFinance(state => {
      const list = state.emergencyTx || [];
      const next = list.map(t => ((t.location||'') === src && (t.currency||'USD') === cur) ? { ...t, location: dst } : t);
      return { ...state, emergencyTx: next };
    });
    setRenameEmergency({ sourceLocation: '', currency: cur, newLocation: '' });
  };

  const mergeEmergencyHoldings = () => {
    if (!currentUser) return;
    const from = (mergeEmergency.fromLocation || '').trim();
    const to = (mergeEmergency.toLocation || '').trim();
    const cur = (mergeEmergency.currency || 'USD').trim();
    if (!from || !to) return Alert.alert('Ошибка', 'Укажите оба названия');
    if (from === to) return Alert.alert('Ошибка', 'Названия совпадают');
    withFinance(state => {
      const list = state.emergencyTx || [];
      const next = list.map(t => ((t.location||'') === from && (t.currency||'USD') === cur) ? { ...t, location: to } : t);
      return { ...state, emergencyTx: next };
    });
    setMergeEmergency({ fromLocation: '', toLocation: '', currency: cur });
  };

  const addInvestTransaction = () => {
    const amount = Number(newInvestTx.amount) || 0;
    if (amount <= 0) return Alert.alert('Ошибка', 'Введите сумму > 0');
    // For withdrawals, require destination selection and ensure enough balance
    if (newInvestTx.type === 'out') {
      const dest = (newInvestTx.destination || '').trim();
      if (!dest) { notify('Выберите направление/вклад для вывода', 'error'); return; }
      const bal = getInvestHoldingBalance(dest, newInvestTx.currency);
      if (amount > bal) { notify('Недостаточно средств на выбранном направлении', 'error'); return; }
    }
    const entry = { id: Date.now(), date: new Date().toISOString().slice(0,10), ...newInvestTx, amount };
    withFinance(cur => ({ ...cur, investTx: [entry, ...(cur.investTx || [])] }));
    setNewInvestTx(tx => ({ ...tx, amount: '', note: '' }));
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          const body = [{ user_id: currentUser.id, date: entry.date, type: entry.type, amount: entry.amount, currency: entry.currency, destination: entry.destination, note: entry.note }];
          await fetch(supaUrl('/finance_invest_tx'), { method: 'POST', headers: supaAuthHeadersWithSession(), body: JSON.stringify(body) });
          fetchSupaFinance();
        } catch {}
      })();
    }
  };

  const transferInvestBetweenDestinations = () => {
    if (!currentUser) return Alert.alert('Войдите', 'Авторизуйтесь для перевода');
    const amount = Number(newInvestTransfer.amount) || 0;
    if (amount <= 0) return Alert.alert('Ошибка', 'Введите сумму > 0');
    const from = (newInvestTransfer.fromDestination || '').trim();
    const to = (newInvestTransfer.toDestination || '').trim();
    const cur = (newInvestTransfer.currency || 'USD').trim();
    if (!from || !to) return Alert.alert('Ошибка', 'Выберите откуда и куда');
    if (from === to) return Alert.alert('Ошибка', 'Направления должны отличаться');
    const bal = getInvestHoldingBalance(from, cur);
    if (amount > bal) return Alert.alert('Ошибка', 'Недостаточно средств на исходном направлении');
    const date = new Date().toISOString().slice(0,10);
    withFinance(curState => {
      const list = curState.investTx || [];
      const outTx = { id: Date.now(), date, type: 'out', amount, currency: cur, destination: from, note: `Перевод → ${to}` };
      const inTx = { id: Date.now() + 1, date, type: 'in', amount, currency: cur, destination: to, note: `Перевод из ${from}` };
      return { ...curState, investTx: [inTx, outTx, ...list] };
    });
    setNewInvestTransfer({ fromDestination: '', toDestination: '', currency: cur, amount: '' });
  };

  const renameInvestDestination = () => {
    if (!currentUser) return;
    const src = (renameInvest.sourceDestination || '').trim();
    const dst = (renameInvest.newDestination || '').trim();
    const cur = (renameInvest.currency || 'USD').trim();
    if (!src || !dst) return Alert.alert('Ошибка', 'Укажите исходное и новое название');
    if (src === dst) return Alert.alert('Ошибка', 'Названия совпадают');
    withFinance(state => {
      const list = state.investTx || [];
      const next = list.map(t => ((t.destination||'') === src && (t.currency||'USD') === cur) ? { ...t, destination: dst } : t);
      return { ...state, investTx: next };
    });
    setRenameInvest({ sourceDestination: '', currency: cur, newDestination: '' });
  };

  const mergeInvestDestinations = () => {
    if (!currentUser) return;
    const from = (mergeInvest.fromDestination || '').trim();
    const to = (mergeInvest.toDestination || '').trim();
    const cur = (mergeInvest.currency || 'USD').trim();
    if (!from || !to) return Alert.alert('Ошибка', 'Укажите оба названия');
    if (from === to) return Alert.alert('Ошибка', 'Названия совпадают');
    withFinance(state => {
      const list = state.investTx || [];
      const next = list.map(t => ((t.destination||'') === from && (t.currency||'USD') === cur) ? { ...t, destination: to } : t);
      return { ...state, investTx: next };
    });
    setMergeInvest({ fromDestination: '', toDestination: '', currency: cur });
  };

  const investmentBalance = useMemo(() => {
    const list = currentFinance?.investTx || [];
    return list.reduce((sum, it) => sum + (it.type === 'in' ? it.amount : -it.amount), 0);
  }, [currentFinance]);

  // Reminders on income days: "Pay yourself first"
  useEffect(() => {
    if (!currentUser || !currentFinance) return;
    const today = new Date();
    const day = today.getDate();
    if ((currentFinance.incomeDays || []).includes(day)) {
      const cushionFull = emergencyMonths >= 6;
      const percentCushion = cushionFull ? 0 : 10;
      const percentInvest = cushionFull ? 20 : 10;
      const income = Number(currentFinance.typicalIncomeAmount) || null;
      const cur = currentFinance.incomeCurrency || 'USD';
      const partC = income ? ` (${formatCurrencyCustom(income * (percentCushion/100), cur)})` : '';
      const partI = income ? ` (${formatCurrencyCustom(income * (percentInvest/100), cur)})` : '';
      const msg = `Сперва заплатить себе: ${percentCushion}%${!cushionFull ? ' на подушку безопасности' : ''}${partC}${!cushionFull ? ', ' : '. '}И ${percentInvest}%${partI} в инвестиционный капитал.`;
      Alert.alert('Напоминание', msg);
    }
  }, [currentUser, currentFinance, emergencyMonths]);

  // Notifications: permissions and scheduling
  const ensureNotificationPermissions = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Уведомления', 'Фоновые уведомления на вебе ограничены. Для надёжной работы используйте мобильное приложение.');
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  };

  const cancelIncomeReminders = async () => {
    if (!currentUser || !currentFinance) return;
    const ids = currentFinance.notifIds || [];
    for (const id of ids) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
    }
    setFinanceData(prev => ({
      ...prev,
      [currentUser.id]: { ...prev[currentUser.id], notifIds: [], notifyEnabled: false },
    }));
    Alert.alert('Уведомления', 'Напоминания отключены');
  };

  const rescheduleIncomeReminders = async (profileOpt) => {
    const profile = profileOpt || currentFinance;
    if (!currentUser || !profile) return;
    const ok = await ensureNotificationPermissions();
    if (!ok) return;
    // cancel existing
    const old = profile.notifIds || [];
    for (const id of old) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
    }
    const hour = 9; const minute = 0;
    const ids = [];
    const days = profile.incomeDays || [];
    for (const day of days) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Напоминание: сперва заплатить себе',
            body: '10% в подушку (если не полна) и 10% в инвестиции, иначе 20% в инвестиции.',
            sound: null,
          },
          trigger: { day, hour, minute, repeats: true },
        });
        ids.push(id);
      } catch {}
    }
    setFinanceData(prev => ({
      ...prev,
      [currentUser.id]: { ...prev[currentUser.id], notifIds: ids, notifyEnabled: true },
    }));
    Alert.alert('Уведомления', ids.length ? 'Напоминания настроены' : 'Нет указанных дат для напоминаний');
  };

  // Social: search and profile view
  const getAllKnownUsers = () => {
    const base = [...users];
    if (currentSupaUser) {
      const overlayIds = Object.keys(supaProfiles || {});
      for (const sid of overlayIds) {
        const u = supaProfiles[sid];
        if (u) base.push({ id: sid, nickname: u.nickname || `user_${sid.slice(0,4)}`, bio: u.bio || '', avatar: u.avatar || '', friends: Array.isArray(u.friends) ? u.friends : [] });
      }
    }
    // Ensure uniqueness by id
    const seen = new Set();
    return base.filter(u => (u && !seen.has(u.id) && seen.add(u.id)));
  };
  const runUserSearch = (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) { setSearchResults([]); return; }
    const all = getAllKnownUsers();
    const res = all.filter(u => (u.nickname || '').toLowerCase().includes(q));
    setSearchResults(res.slice(0, 20));
  };

  return (
    <View style={[styles.container, isDark ? { backgroundColor: '#0b0f14' } : null]}>
      <StatusBar style="dark" />

      {toast && (
        <View style={[styles.toast, toast.kind === 'warning' ? styles.toastWarn : null, toast.kind === 'error' ? styles.toastError : null]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, isDark ? { backgroundColor: '#121820', borderBottomColor: '#1f2a36' } : null]}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <View style={styles.authStatus}>
            <Text style={[styles.authStatusText, isDark ? { color: '#9fb0c0' } : null]}>{currentUser ? `@${currentUser.nickname}` : 'Гость'}</Text>
            {currentUser && (
              <Pressable style={styles.logoutBtn} onPress={logout}><Text style={styles.logoutText}>Выйти</Text></Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Auth Gate (inline) */}
      {!currentUser && (
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>{authMode === 'login' ? 'Вход' : 'Регистрация'}</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Режим</Text>
              <View style={styles.pickerContainer}>
                {[{k:false,l:'Локально'},{k:true,l:'Supabase'}].map(o => (
                  <Pressable key={String(o.k)} style={[styles.pickerOption, useSupaAuth === o.k ? styles.pickerOptionActive : null]} onPress={() => setUseSupaAuth(o.k)}>
                    <Text style={[styles.pickerText, useSupaAuth === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {!useSupaAuth ? (
            <>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Никнейм</Text>
                  <TextInput style={styles.input} value={authData.nickname} onChangeText={(t) => setAuthData(d => ({ ...d, nickname: t }))} placeholder="nickname" />
                </View>
                <Text style={[styles.cardTitle, { marginTop: 12 }]}>Тема</Text>
                <View style={styles.inputRow}>
                  <View style={styles.pickerContainer}>
                    {[{k:'light',l:'Светлая'},{k:'dark',l:'Тёмная'}].map(o => (
                      <Pressable key={o.k} style={[styles.pickerOption, appTheme === o.k ? styles.pickerOptionActive : null]} onPress={() => setAppTheme(o.k)}>
                        <Text style={[styles.pickerText, appTheme === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Text style={[styles.cardTitle, { marginTop: 12 }]}>Безопасность</Text>
                <View style={styles.inputRow}>
                  {!currentSupaUser && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Текущий пароль</Text>
                      <TextInput style={[styles.input, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={secOld} onChangeText={setSecOld} placeholder="current" secureTextEntry />
                    </View>
                  )}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Новый пароль</Text>
                    <TextInput style={[styles.input, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={secNew} onChangeText={setSecNew} placeholder="new" secureTextEntry />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Повторите пароль</Text>
                    <TextInput style={[styles.input, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={secNew2} onChangeText={setSecNew2} placeholder="repeat" secureTextEntry />
                  </View>
                </View>
                <Pressable style={[styles.addButton, { backgroundColor: '#10b981' }]} onPress={changePassword}><Text style={styles.addButtonText}>Сменить пароль</Text></Pressable>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Пароль</Text>
                  <TextInput style={styles.input} value={authData.password} onChangeText={(t) => setAuthData(d => ({ ...d, password: t }))} placeholder="password" secureTextEntry />
                </View>
              </View>
              {authMode === 'login' ? (
                <Pressable style={styles.addButton} onPress={loginUser}><Text style={styles.addButtonText}>Войти</Text></Pressable>
              ) : (
                <Pressable style={styles.addButton} onPress={registerUser}><Text style={styles.addButtonText}>Зарегистрироваться</Text></Pressable>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput style={styles.input} value={authEmail} onChangeText={setAuthEmail} placeholder="email@example.com" autoCapitalize="none" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Пароль</Text>
                  <TextInput style={styles.input} value={authPassword} onChangeText={setAuthPassword} placeholder="password" secureTextEntry />
                </View>
              </View>
              {authMode === 'login' ? (
                <>
                  <Pressable style={styles.addButton} onPress={supaLogin}><Text style={styles.addButtonText}>Войти (Supabase)</Text></Pressable>
                  <Pressable style={styles.switchAuth} onPress={supaRecover}><Text style={styles.switchAuthText}>Забыли пароль?</Text></Pressable>
                </>
              ) : (
                <Pressable style={styles.addButton} onPress={supaRegister}><Text style={styles.addButtonText}>Регистрация (Supabase)</Text></Pressable>
              )}
              {!supaConfigured && (
                <Text style={styles.noteText}>Укажите Supabase URL и Anon Key в профиле</Text>
              )}
            </>
          )}

          <Pressable style={styles.switchAuth} onPress={() => setAuthMode(m => m === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchAuthText}>{authMode === 'login' ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}</Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Brand banner (scrolls with content) */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Image
            source={require('./assets/investcamp-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>
      {/* The rest of the content continues here and the ScrollView is properly closed at the end of the component */}

        {/* Tabs (moved below the logo) */}
        <View style={[styles.tabContainer, isDark ? { backgroundColor: '#1b2430' } : null]}>
          {[
            { key: 'finance', label: 'Финансы' },
            { key: 'journal', label: 'Дневник' },
            { key: 'planner', label: 'Планер' },
            { key: 'community', label: 'Сообщество' },
            { key: 'profile', label: 'Профиль' },
          ].map(({ key, label }) => (
            <Pressable key={key} style={[styles.tab, tab === key ? styles.activeTab : styles.inactiveTab]} onPress={() => setTab(key)}>
              <Text style={[styles.tabText, tab === key ? styles.activeTabText : (isDark ? { color: '#9fb0c0' } : styles.inactiveTabText)]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        
        {tab === 'finance' && (
          <View>
            {/* Finance entry picker */}
            {!financeView && (
              <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
                <Text style={styles.cardTitle}>Куда перейти?</Text>
                <View style={styles.inputRow}>
                  <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => setFinanceView('fund')}><Text style={styles.addButtonText}>Расчёт подушки безопасности</Text></Pressable>
                  <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => setFinanceView('invest')}><Text style={styles.addButtonText}>Инвестиции</Text></Pressable>
                </View>
                <View style={styles.inputRow}>
                  <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => setFinanceView('debts')}><Text style={styles.addButtonText}>Долги</Text></Pressable>
                </View>
              </View>
            )}

            {financeView && (
              <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
                <View style={styles.inputRow}>
                  <Pressable style={[styles.addButton, { backgroundColor: '#1f6feb', flex: 1 }]} onPress={() => setFinanceView(null)}>
                    <Text style={styles.addButtonText}>← Назад к выбору</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Summary chart (moved to top) */}
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>📊 Сводный баланс</Text>
              {currentUser ? (
                <>
                  {(() => {
                    const totalDebt = (sortedDebts || []).reduce((s, d) => s + (d.amount || 0), 0);
                    const cushion = cashReserve;
                    const invest = investmentBalance;
                    const maxVal = Math.max(totalDebt, cushion, invest, 1);
                    const bar = (val, color) => ({ width: `${Math.min(100, (val / maxVal) * 100)}%`, height: 10, backgroundColor: color, borderRadius: 6 });
                    const delta = cushion + invest - totalDebt;
                    return (
                      <View>
                        <View style={styles.barRow}><View style={bar(totalDebt, '#ef4444')} /></View>
                        <Text style={styles.barLabel}>Долги: {formatCurrencyCustom(totalDebt, (sortedDebts[0]?.currency) || 'USD')}</Text>
                        <View style={styles.barRow}><View style={bar(cushion, '#3b82f6')} /></View>
                        <Text style={styles.barLabel}>Подушка: {formatCurrencyCustom(cushion, 'USD')}</Text>
                        <View style={styles.barRow}><View style={bar(invest, '#10b981')} /></View>
                        <Text style={styles.barLabel}>Инвестиции: {formatCurrencyCustom(invest, (currentFinance?.investTx?.[0]?.currency) || 'USD')}</Text>
                        <Text style={[styles.resultTitle, { marginTop: 8 }]}>Итоговая дельта: {formatCurrencyCustom(delta, 'USD')}</Text>
                      </View>
                    );
                  })()}
                </>
              ) : (
                <Text style={styles.noteText}>Войдите, чтобы видеть сводку</Text>
              )}
            </View>
            {/* Finance onboarding / questionnaire */}
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>🧾 Финансовая анкета</Text>
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы заполнить анкету</Text>}
              {currentUser && (!currentFinance || financeEditMode) && (
                <>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Работаете в найме?</Text>
                      <View style={styles.pickerContainer}>
                        {[{k:true, l:'Да'}, {k:false, l:'Нет'}].map(o => (
                          <Pressable key={String(o.k)} style={[styles.pickerOption, financeForm.isEmployed === o.k ? styles.pickerOptionActive : null]} onPress={() => setFinanceForm(f => ({ ...f, isEmployed: o.k }))}>
                            <Text style={[styles.pickerText, financeForm.isEmployed === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Есть доп. регулярные приходы?</Text>
                      <View style={styles.pickerContainer}>
                        {[{k:true, l:'Да'}, {k:false, l:'Нет'}].map(o => (
                          <Pressable key={String(o.k)} style={[styles.pickerOption, financeForm.hasExtraIncome === o.k ? styles.pickerOptionActive : null]} onPress={() => setFinanceForm(f => ({ ...f, hasExtraIncome: o.k }))}>
                            <Text style={[styles.pickerText, financeForm.hasExtraIncome === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Даты регулярных приходов (числа месяца)</Text>
                      <TextInput style={styles.input} value={financeForm.incomeDaysText} onChangeText={(t) => setFinanceForm(f => ({ ...f, incomeDaysText: t }))} placeholder="1, 15, 28" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Типичный доход (сумма)</Text>
                      <TextInput style={styles.input} value={financeForm.typicalIncomeAmount} onChangeText={(t) => setFinanceForm(f => ({ ...f, typicalIncomeAmount: t }))} placeholder="1000" keyboardType="numeric" />
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Валюта дохода</Text>
                      <TextInput style={styles.input} value={financeForm.incomeCurrency} onChangeText={(t) => setFinanceForm(f => ({ ...f, incomeCurrency: t.toUpperCase() }))} placeholder="USD" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Есть ли долги?</Text>
                      <View style={styles.pickerContainer}>
                        {[{k:true, l:'Да'}, {k:false, l:'Нет'}].map(o => (
                          <Pressable key={String(o.k)} style={[styles.pickerOption, financeForm.hasDebts === o.k ? styles.pickerOptionActive : null]} onPress={() => setFinanceForm(f => ({ ...f, hasDebts: o.k }))}>
                            <Text style={[styles.pickerText, financeForm.hasDebts === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Есть ли кеш в подушке?</Text>
                      <View style={styles.pickerContainer}>
                        {[{k:true, l:'Да'}, {k:false, l:'Нет'}].map(o => (
                          <Pressable key={String(o.k)} style={[styles.pickerOption, financeForm.hasEmergencyCash === o.k ? styles.pickerOptionActive : null]} onPress={() => setFinanceForm(f => ({ ...f, hasEmergencyCash: o.k }))}>
                            <Text style={[styles.pickerText, financeForm.hasEmergencyCash === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Сколько в подушке (сумма)</Text>
                      <TextInput style={styles.input} value={financeForm.emergencyCashAmount} onChangeText={(t) => setFinanceForm(f => ({ ...f, emergencyCashAmount: t }))} placeholder="4000" keyboardType="numeric" />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Есть ли инвестиции?</Text>
                    <View style={styles.pickerContainer}>
                      {[{k:true, l:'Да'}, {k:false, l:'Нет'}].map(o => (
                        <Pressable key={String(o.k)} style={[styles.pickerOption, financeForm.hasInvestments === o.k ? styles.pickerOptionActive : null]} onPress={() => setFinanceForm(f => ({ ...f, hasInvestments: o.k }))}>
                          <Text style={[styles.pickerText, financeForm.hasInvestments === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <Pressable style={styles.addButton} onPress={saveFinanceForm}><Text style={styles.addButtonText}>Сохранить анкету</Text></Pressable>
                </>
              )}
              {currentUser && currentFinance && !financeEditMode && (
                <>
                  <Text style={styles.cardDescription}>Регулярные приходы: {(currentFinance.incomeDays || []).join(', ') || '—'} • Валюта: {currentFinance.incomeCurrency}
                  {currentFinance.typicalIncomeAmount ? ` • Доход: ${currentFinance.typicalIncomeAmount}` : ''}</Text>
                  <View style={styles.inputRow}>
                    <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => setFinanceEditMode(true)}><Text style={styles.addButtonText}>Редактировать анкету</Text></Pressable>
                    {!currentFinance.notifyEnabled ? (
                      <Pressable style={[styles.addButton, { flex: 1, backgroundColor: '#10b981' }]} onPress={() => rescheduleIncomeReminders()}><Text style={styles.addButtonText}>Включить напоминания</Text></Pressable>
                    ) : (
                      <Pressable style={[styles.addButton, { flex: 1, backgroundColor: '#ef4444' }]} onPress={cancelIncomeReminders}><Text style={styles.addButtonText}>Отключить напоминания</Text></Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
            {/* Investment Planning */}
            {financeView === 'invest' && (
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>📈 Планирование инвестиций</Text>
              <Text style={styles.cardDescription}>Рассчитайте рост вашего капитала с учетом сложного процента</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Стартовый капитал ($)</Text>
                  <TextInput style={styles.input} value={String(startCapital)} onChangeText={(t) => setStartCapital(Number(t) || 0)} keyboardType="numeric" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Месячные инвестиции ($)</Text>
                  <TextInput style={styles.input} value={String(monthlyInvest)} onChangeText={(t) => setMonthlyInvest(Number(t) || 0)} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Годовая доходность (%)</Text>
                  <TextInput style={styles.input} value={String(apr * 100)} onChangeText={(t) => setApr((Number(t) || 0) / 100)} keyboardType="numeric" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Период (лет)</Text>
                  <TextInput style={styles.input} value={String(years)} onChangeText={(t) => setYears(Number(t) || 0)} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Результат через {years} лет:</Text>
                <Text style={styles.resultValue}>{formatCurrency(futureValue)}</Text>
                <Text style={styles.resultSubtitle}>Общий рост: {(((futureValue - startCapital) / startCapital) * 100).toFixed(1)}%</Text>
              </View>
            </View>
            )}

            {/* Emergency Fund */}
            {financeView === 'fund' && (
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>🛡️ Расчёт подушки безопасности</Text>
              <Text style={styles.cardDescription}>Резерв на непредвиденные расходы</Text>
              {/* Holdings summary */}
              {currentUser && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.filterLabel}>Ваши вклады (по местам/валютам)</Text>
                  {emergencyHoldings.length === 0 ? (
                    <Text style={styles.noteText}>Пока нет вкладов</Text>
                  ) : (
                    <View style={styles.chipsRow}>
                      {emergencyHoldings.map(h => (
                        <Pressable key={`${h.currency}:${h.location}`}
                          style={[styles.chip, (newEmergencyTx.location || '') === h.location && (newEmergencyTx.currency || 'USD') === h.currency ? styles.chipActive : null]}
                          onPress={() => setNewEmergencyTx(v => ({ ...v, location: h.location, currency: h.currency }))}>
                          <Text style={[styles.chipText, (newEmergencyTx.location || '') === h.location && (newEmergencyTx.currency || 'USD') === h.currency ? styles.chipTextActive : null]}>
                            {(h.location || '—')} • {formatCurrencyCustom(h.amount, h.currency)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
              {/* Transfer between holdings (toggle) */}
              {currentUser && emergencyHoldings.length >= 1 && (
                <View style={[styles.resultCard, { alignItems: 'stretch' }]}>
                  <Text style={styles.resultTitle}>Перевод между вкладами</Text>
                  <Pressable style={[styles.addButton, { backgroundColor: '#0f1520', marginTop: 8 }]} onPress={() => setShowFundAdvanced(v => !v)}><Text style={styles.addButtonText}>{showFundAdvanced ? 'Скрыть' : 'Показать'}</Text></Pressable>
                  {showFundAdvanced && (
                    <>
                    <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Откуда</Text>
                      <View style={styles.chipsRow}>
                        {emergencyHoldings.map(h => (
                          <Pressable key={`trf-from-${h.currency}:${h.location}`}
                            style={[styles.chip, newEmergencyTransfer.fromLocation === h.location && (newEmergencyTransfer.currency||'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setNewEmergencyTransfer(v => ({ ...v, fromLocation: h.location, currency: h.currency }))}>
                            <Text style={[styles.chipText, newEmergencyTransfer.fromLocation === h.location && (newEmergencyTransfer.currency||'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.location || '—')} • {formatCurrencyCustom(h.amount, h.currency)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Куда</Text>
                      <TextInput style={styles.input} value={newEmergencyTransfer.toLocation} onChangeText={(t) => setNewEmergencyTransfer(v => ({ ...v, toLocation: t }))} placeholder="Название вклада-получателя" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Сумма</Text>
                      <TextInput style={styles.input} value={newEmergencyTransfer.amount} onChangeText={(t) => setNewEmergencyTransfer(v => ({ ...v, amount: t }))} keyboardType="numeric" placeholder="100" />
                    </View>
                  </View>
                  <Pressable style={[styles.addButton, { backgroundColor: '#1f6feb' }]} onPress={transferEmergencyBetweenHoldings}><Text style={styles.addButtonText}>Перевести</Text></Pressable>
                  </>
                  )}
                </View>
              )}

              {/* Rename / Merge holdings (toggle) */}
              {currentUser && (
                <View style={[styles.resultCard, { alignItems: 'stretch', marginTop: 8 }]}>
                  <Text style={styles.resultTitle}>Переименование/слияние вкладов</Text>
                  <Pressable style={[styles.addButton, { backgroundColor: '#0f1520', marginTop: 8 }]} onPress={() => setShowFundAdvanced(v => !v)}><Text style={styles.addButtonText}>{showFundAdvanced ? 'Скрыть' : 'Показать'}</Text></Pressable>
                  {showFundAdvanced && (
                    <>
                    <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Переименовать: выбрать вклад</Text>
                      <View style={styles.chipsRow}>
                        {emergencyHoldings.map(h => (
                          <Pressable key={`rn-em-${h.currency}:${h.location}`}
                            style={[styles.chip, renameEmergency.sourceLocation === h.location && (renameEmergency.currency||'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setRenameEmergency(v => ({ ...v, sourceLocation: h.location, currency: h.currency }))}>
                            <Text style={[styles.chipText, renameEmergency.sourceLocation === h.location && (renameEmergency.currency||'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.location || '—')} • {h.currency}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Новое название</Text>
                      <TextInput style={styles.input} value={renameEmergency.newLocation} onChangeText={(t) => setRenameEmergency(v => ({ ...v, newLocation: t }))} placeholder="Новое имя" />
                    </View>
                    <Pressable style={[styles.addButton, { flex: 1 }]} onPress={renameEmergencyHolding}><Text style={styles.addButtonText}>Переименовать</Text></Pressable>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Слить: из</Text>
                      <View style={styles.chipsRow}>
                        {emergencyHoldings.map(h => (
                          <Pressable key={`mg-em-from-${h.currency}:${h.location}`}
                            style={[styles.chip, mergeEmergency.fromLocation === h.location && (mergeEmergency.currency||'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setMergeEmergency(v => ({ ...v, fromLocation: h.location, currency: h.currency }))}>
                            <Text style={[styles.chipText, mergeEmergency.fromLocation === h.location && (mergeEmergency.currency||'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.location || '—')} • {h.currency}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>В</Text>
                      <TextInput style={styles.input} value={mergeEmergency.toLocation} onChangeText={(t) => setMergeEmergency(v => ({ ...v, toLocation: t }))} placeholder="Имя получателя" />
                    </View>
                    <Pressable style={[styles.addButton, { flex: 1 }]} onPress={mergeEmergencyHoldings}><Text style={styles.addButtonText}>Слить</Text></Pressable>
                  </View>
                  </>
                  )}
                </View>
              )}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Месячные расходы ($)</Text>
                  <TextInput style={styles.input} value={String(monthlyExpenses)} onChangeText={(t) => setMonthlyExpenses(Number(t) || 0)} keyboardType="numeric" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Текущий резерв ($)</Text>
                  <TextInput style={styles.input} value={String(cashReserve)} onChangeText={(t) => setCashReserve(Number(t) || 0)} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.emergencyStatus}>
                <View style={[styles.emergencyBadge, emergencyMonths >= 6 ? styles.emergencyGood : styles.emergencyWarning]}>
                  <Text style={[styles.emergencyText, emergencyMonths >= 6 ? styles.emergencyTextGood : styles.emergencyTextWarning]}>{emergencyMonths.toFixed(1)} мес.</Text>
                </View>
                <Text style={styles.emergencyGoal}>Цель: 6 месяцев</Text>
              </View>
              {emergencyMonths < 6 && (
                <Text style={styles.emergencyRecommendation}>Рекомендация: доведите резерв до {formatCurrency(monthlyExpenses * 6)} ({(6 - emergencyMonths).toFixed(1)} мес. до цели)</Text>
              )}
            </View>
            )}

            {/* Debts */}
            {financeView === 'debts' && (
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>🔻 Долги</Text>
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы управлять долгами</Text>}
              {currentUser && (
                <>
                  {/* Debts summary chips */}
                  {(() => {
                    const list = currentFinance?.debts || [];
                    if (!list.length) return null;
                    return (
                      <View style={{ marginBottom: 8 }}>
                        <Text style={styles.filterLabel}>Текущие долги</Text>
                        <View style={styles.chipsRow}>
                          {list.map(d => (
                            <View key={`debtchip-${d.id}`} style={styles.chip}>
                              <Text style={styles.chipText}>{d.name} • {formatCurrencyCustom(d.amount, d.currency)}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })()}
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Название</Text>
                      <TextInput style={styles.input} value={newDebt.name} onChangeText={(t) => setNewDebt(v => ({ ...v, name: t }))} placeholder="Кредит карта" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Сумма</Text>
                      <TextInput style={styles.input} value={newDebt.amount} onChangeText={(t) => setNewDebt(v => ({ ...v, amount: t }))} placeholder="500" keyboardType="numeric" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Валюта</Text>
                      <TextInput style={styles.input} value={newDebt.currency} onChangeText={(t) => setNewDebt(v => ({ ...v, currency: t.toUpperCase() }))} placeholder="USD" />
                    </View>
                  </View>
                  <Pressable style={styles.addButton} onPress={addDebt}><Text style={styles.addButtonText}>Добавить долг</Text></Pressable>

                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Название</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Сумма</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Действия</Text>
                  </View>
                  {(sortedDebts || []).map(d => (
                    <View key={d.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{d.name}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{formatCurrencyCustom(d.amount, d.currency)}</Text>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <View style={styles.inputRow}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>Сумма</Text>
                            <TextInput style={styles.input} value={repayDrafts[d.id] || ''} onChangeText={(t) => setRepayDrafts(prev => ({ ...prev, [d.id]: t }))} placeholder="100" keyboardType="numeric" />
                          </View>
                          <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end' }]} onPress={() => repayDebtPartial(d.id)}><Text style={styles.addButtonText}>Погасить частично</Text></Pressable>
                          <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end', backgroundColor: '#10b981' }]} onPress={() => repayDebtFull(d.id)}><Text style={styles.addButtonText}>Погасить полностью</Text></Pressable>
                        </View>
                        {/* Debt history */}
                        {(() => {
                          const history = (currentFinance?.debtTx || []).filter(tx => tx.debtId === d.id);
                          if (history.length === 0) return null;
                          return (
                            <View style={{ marginTop: 6 }}>
                              <Text style={styles.filterLabel}>История</Text>
                              {history.map(tx => (
                                <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Text style={styles.tableCell}>
                                    • {tx.date}: {tx.type === 'add' ? 'Создание' : tx.type === 'repay' ? 'Погашение' : 'Закрытие'} {formatCurrencyCustom(tx.amount, tx.currency)} {tx.note ? `— ${tx.note}` : ''}
                                  </Text>
                                  <Pressable style={styles.deleteButtonSmall} onPress={() => deleteDebtTx(tx.id)}>
                                    <Text style={styles.deleteButtonText}>×</Text>
                                  </Pressable>
                                </View>
                              ))}
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                  ))}
                  {(sortedDebts || []).length === 0 && <Text style={styles.noteText}>Нет долгов</Text>}
                </>
              )}
            </View>
            )}

            {/* Emergency Fund Transactions */}
            {financeView === 'fund' && (
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>💼 Подушка: транзакции</Text>
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы добавлять транзакции</Text>}
              {currentUser && (
                <>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Тип</Text>
                      <View style={styles.pickerContainer}>
                        {[{k:'deposit', l:'Пополнение'}, {k:'withdraw', l:'Изъятие'}].map(o => (
                          <Pressable key={o.k} style={[styles.pickerOption, newEmergencyTx.type === o.k ? styles.pickerOptionActive : null]} onPress={() => setNewEmergencyTx(v => ({ ...v, type: o.k }))}>
                            <Text style={[styles.pickerText, newEmergencyTx.type === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Сумма</Text>
                      <TextInput style={styles.input} value={newEmergencyTx.amount} onChangeText={(t) => setNewEmergencyTx(v => ({ ...v, amount: t }))} keyboardType="numeric" placeholder="200" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Валюта</Text>
                      <TextInput style={styles.input} value={newEmergencyTx.currency} onChangeText={(t) => setNewEmergencyTx(v => ({ ...v, currency: t.toUpperCase() }))} placeholder="USD" />
                    </View>
                  </View>
                  {/* Quick select existing destination (chips only) */}
                  {emergencyHoldings.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={styles.filterLabel}>Выберите вклад</Text>
                      <View style={styles.chipsRow}>
                        {emergencyHoldings.map(h => (
                          <Pressable key={`txpick-${h.currency}:${h.location}`}
                            style={[styles.chip, (newEmergencyTx.location || '') === h.location && (newEmergencyTx.currency || 'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setNewEmergencyTx(v => ({ ...v, location: h.location, currency: h.currency }))}>
                            <Text style={[styles.chipText, (newEmergencyTx.location || '') === h.location && (newEmergencyTx.currency || 'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.location || '—')} • {formatCurrencyCustom(h.amount, h.currency)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Где расположено (название вклада)</Text>
                      <TextInput style={styles.input} value={newEmergencyTx.location} onChangeText={(t) => setNewEmergencyTx(v => ({ ...v, location: t }))} placeholder="Банк, брокер, акция/тикер..." />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Заметка</Text>
                      <TextInput style={styles.input} value={newEmergencyTx.note} onChangeText={(t) => setNewEmergencyTx(v => ({ ...v, note: t }))} placeholder="Комментарий" />
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <Pressable style={[styles.addButton, { flex: 1 }]} onPress={addEmergencyTransaction}><Text style={styles.addButtonText}>Добавить</Text></Pressable>
                    <Pressable style={[styles.addButton, { flex: 1, backgroundColor: '#0f1520' }]} onPress={() => {
                      // CSV export for filtered emergency tx
                      try {
                        const rows = (currentFinance?.emergencyTx || [])
                          .filter(tx => emFilter.type === 'All' ? true : tx.type === emFilter.type)
                          .filter(tx => emFilter.currency === 'All' ? true : (tx.currency || 'USD') === emFilter.currency)
                          .filter(tx => { const q = (emFilter.q || '').toLowerCase(); return !q || ((tx.location||'').toLowerCase().includes(q) || (tx.note||'').toLowerCase().includes(q)); })
                          .map(tx => [tx.date, tx.type, tx.amount, tx.currency, (tx.location||''), (tx.note||'')]);
                        const header = ['date','type','amount','currency','location','note'];
                        const csv = [header, ...rows].map(r => r.map(v => String(v).replace(/"/g,'""')).map(v => /[,"]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
                        if (typeof window !== 'undefined') {
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = 'emergency_transactions.csv'; a.click(); URL.revokeObjectURL(url);
                        } else { Alert.alert('Экспорт', 'CSV доступен только в веб-версии'); }
                      } catch {}
                    }}><Text style={styles.addButtonText}>Экспорт CSV</Text></Pressable>
                  </View>

                  {/* Filters */}
                  <View style={[styles.inputRow, { marginTop: 8 }] }>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Тип</Text>
                      <View style={styles.pickerContainer}>
                        {['All','deposit','withdraw'].map(t => (
                          <Pressable key={t} style={[styles.pickerOption, emFilter.type === t ? styles.pickerOptionActive : null]} onPress={() => setEmFilter(f => ({ ...f, type: t }))}>
                            <Text style={[styles.pickerText, emFilter.type === t ? styles.pickerTextActive : null]}>{t}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Валюта</Text>
                      <View style={styles.pickerContainer}>
                        {['All','USD','EUR','RUB'].map(c => (
                          <Pressable key={c} style={[styles.pickerOption, emFilter.currency === c ? styles.pickerOptionActive : null]} onPress={() => setEmFilter(f => ({ ...f, currency: c }))}>
                            <Text style={[styles.pickerText, emFilter.currency === c ? styles.pickerTextActive : null]}>{c}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Поиск</Text>
                      <TextInput style={styles.input} value={emFilter.q} onChangeText={(t) => setEmFilter(f => ({ ...f, q: t }))} placeholder="место/заметка" />
                    </View>
                  </View>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Дата</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Тип</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Сумма</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Где</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Заметка</Text>
                  </View>
                  {(currentFinance?.emergencyTx || [])
                    .filter(tx => emFilter.type === 'All' ? true : tx.type === emFilter.type)
                    .filter(tx => emFilter.currency === 'All' ? true : (tx.currency || 'USD') === emFilter.currency)
                    .filter(tx => {
                      const q = (emFilter.q || '').toLowerCase();
                      if (!q) return true;
                      return ((tx.location||'').toLowerCase().includes(q) || (tx.note||'').toLowerCase().includes(q));
                    })
                    .map(tx => (
                    <View key={tx.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.type === 'deposit' ? 'Пополнение' : 'Изъятие'}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{formatCurrencyCustom(tx.amount, tx.currency)}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.location || '—'}</Text>
                      <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <Text>{tx.note || '—'}</Text>
                        <Pressable style={styles.deleteButtonSmall} onPress={() => deleteEmergencyTx(tx.id)}>
                          <Text style={styles.deleteButtonText}>×</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  {(currentFinance?.emergencyTx || []).length === 0 && <Text style={styles.noteText}>Пока нет транзакций</Text>}
                </>
              )}
            </View>
            )}

            {/* Investment Capital */}
            {financeView === 'invest' && (
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>💹 Инвестиционный капитал</Text>
              <Text style={styles.cardDescription}>Баланс: {formatCurrencyCustom(investmentBalance, (currentFinance?.investTx?.[0]?.currency) || 'USD')}</Text>
              {/* Holdings summary */}
              {currentUser && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.filterLabel}>Ваши направления/вклады</Text>
                  {investHoldings.length === 0 ? (
                    <Text style={styles.noteText}>Пока нет направлений</Text>
                  ) : (
                    <View style={styles.chipsRow}>
                      {investHoldings.map(h => (
                        <Pressable key={`${h.currency}:${h.destination}`}
                          style={[styles.chip, (newInvestTx.destination || '') === h.destination && (newInvestTx.currency || 'USD') === h.currency ? styles.chipActive : null]}
                          onPress={() => setNewInvestTx(v => ({ ...v, destination: h.destination, currency: h.currency }))}>
                          <Text style={[styles.chipText, (newInvestTx.destination || '') === h.destination && (newInvestTx.currency || 'USD') === h.currency ? styles.chipTextActive : null]}>
                            {(h.destination || '—')} • {formatCurrencyCustom(h.amount, h.currency)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
              {/* Transfer between destinations (toggle) */}
              {currentUser && investHoldings.length >= 1 && (
                <View style={[styles.resultCard, { alignItems: 'stretch' }]}>
                  <Text style={styles.resultTitle}>Перевод между направлениями</Text>
                  <Pressable style={[styles.addButton, { backgroundColor: '#0f1520', marginTop: 8 }]} onPress={() => setShowInvestAdvanced(v => !v)}><Text style={styles.addButtonText}>{showInvestAdvanced ? 'Скрыть' : 'Показать'}</Text></Pressable>
                  {showInvestAdvanced ? (
                  <View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Откуда</Text>
                      <View style={styles.chipsRow}>
                        {investHoldings.map(h => (
                          <Pressable key={`invtrf-from-${h.currency}:${h.destination}`}
                            style={[styles.chip, newInvestTransfer.fromDestination === h.destination && (newInvestTransfer.currency||'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setNewInvestTransfer(v => ({ ...v, fromDestination: h.destination, currency: h.currency }))}>
                            <Text style={[styles.chipText, newInvestTransfer.fromDestination === h.destination && (newInvestTransfer.currency||'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.destination || '—')} • {formatCurrencyCustom(h.amount, h.currency)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Куда</Text>
                      <TextInput style={styles.input} value={newInvestTransfer.toDestination} onChangeText={(t) => setNewInvestTransfer(v => ({ ...v, toDestination: t }))} placeholder="Название направления-получателя" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Сумма</Text>
                      <TextInput style={styles.input} value={newInvestTransfer.amount} onChangeText={(t) => setNewInvestTransfer(v => ({ ...v, amount: t }))} keyboardType="numeric" placeholder="100" />
                    </View>
                  </View>
                  <Pressable style={[styles.addButton, { backgroundColor: '#1f6feb' }]} onPress={transferInvestBetweenDestinations}><Text style={styles.addButtonText}>Перевести</Text></Pressable>
                  </View>
                  ) : null}
                </View>
              )}

              {/* Rename / Merge destinations (toggle) */}
              {currentUser ? (
                <View style={[styles.resultCard, { alignItems: 'stretch', marginTop: 8 }]}>
                  <Text style={styles.resultTitle}>Переименование/слияние направлений</Text>
                  <Pressable style={[styles.addButton, { backgroundColor: '#0f1520', marginTop: 8 }]} onPress={() => setShowInvestAdvanced(v => !v)}><Text style={styles.addButtonText}>{showInvestAdvanced ? 'Скрыть' : 'Показать'}</Text></Pressable>
                  {showInvestAdvanced ? (
                  <View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Переименовать: выбрать направление</Text>
                      <View style={styles.chipsRow}>
                        {investHoldings.map(h => (
                          <Pressable key={`rn-inv-${h.currency}:${h.destination}`}
                            style={[styles.chip, renameInvest.sourceDestination === h.destination && (renameInvest.currency||'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setRenameInvest(v => ({ ...v, sourceDestination: h.destination, currency: h.currency }))}>
                            <Text style={[styles.chipText, renameInvest.sourceDestination === h.destination && (renameInvest.currency||'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.destination || '—')} • {h.currency}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Новое название</Text>
                      <TextInput style={styles.input} value={renameInvest.newDestination} onChangeText={(t) => setRenameInvest(v => ({ ...v, newDestination: t }))} placeholder="Новое имя" />
                    </View>
                    <Pressable style={[styles.addButton, { flex: 1 }]} onPress={renameInvestDestination}><Text style={styles.addButtonText}>Переименовать</Text></Pressable>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Слить: из</Text>
                      <View style={styles.chipsRow}>
                        {investHoldings.map(h => (
                          <Pressable key={`mg-inv-from-${h.currency}:${h.destination}`}
                            style={[styles.chip, mergeInvest.fromDestination === h.destination && (mergeInvest.currency||'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setMergeInvest(v => ({ ...v, fromDestination: h.destination, currency: h.currency }))}>
                            <Text style={[styles.chipText, mergeInvest.fromDestination === h.destination && (mergeInvest.currency||'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.destination || '—')} • {h.currency}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>В</Text>
                      <TextInput style={styles.input} value={mergeInvest.toDestination} onChangeText={(t) => setMergeInvest(v => ({ ...v, toDestination: t }))} placeholder="Имя получателя" />
                    </View>
                    <Pressable style={[styles.addButton, { flex: 1 }]} onPress={mergeInvestDestinations}><Text style={styles.addButtonText}>Слить</Text></Pressable>
                </View>
                  </View>
                  ) : null}
                </View>
              ) : null}
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы добавлять транзакции</Text>}
              {currentUser && (
                <>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Тип</Text>
                      <View style={styles.pickerContainer}>
                        {[{k:'in', l:'Ввод'}, {k:'out', l:'Вывод'}].map(o => (
                          <Pressable key={o.k} style={[styles.pickerOption, newInvestTx.type === o.k ? styles.pickerOptionActive : null]} onPress={() => setNewInvestTx(v => ({ ...v, type: o.k }))}>
                            <Text style={[styles.pickerText, newInvestTx.type === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Сумма</Text>
                      <TextInput style={styles.input} value={newInvestTx.amount} onChangeText={(t) => setNewInvestTx(v => ({ ...v, amount: t }))} keyboardType="numeric" placeholder="300" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Валюта</Text>
                      <TextInput style={styles.input} value={newInvestTx.currency} onChangeText={(t) => setNewInvestTx(v => ({ ...v, currency: t.toUpperCase() }))} placeholder="USD" />
                    </View>
                  </View>
                  {/* Quick select destination: chips only */}
                  {investHoldings.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={styles.filterLabel}>Выберите направление</Text>
                      <View style={styles.chipsRow}>
                        {investHoldings.map(h => (
                          <Pressable key={`invpick-${h.currency}:${h.destination}`}
                            style={[styles.chip, (newInvestTx.destination || '') === h.destination && (newInvestTx.currency || 'USD') === h.currency ? styles.chipActive : null]}
                            onPress={() => setNewInvestTx(v => ({ ...v, destination: h.destination, currency: h.currency }))}>
                            <Text style={[styles.chipText, (newInvestTx.destination || '') === h.destination && (newInvestTx.currency || 'USD') === h.currency ? styles.chipTextActive : null]}>
                              {(h.destination || '—')} • {formatCurrencyCustom(h.amount, h.currency)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Куда конкретно (название направления/вклада)</Text>
                      <TextInput style={styles.input} value={newInvestTx.destination} onChangeText={(t) => setNewInvestTx(v => ({ ...v, destination: t }))} placeholder="Счёт брокера, стратегия, тикер..." />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Заметка</Text>
                      <TextInput style={styles.input} value={newInvestTx.note} onChangeText={(t) => setNewInvestTx(v => ({ ...v, note: t }))} placeholder="Комментарий" />
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <Pressable style={[styles.addButton, { flex: 1 }]} onPress={addInvestTransaction}><Text style={styles.addButtonText}>Добавить</Text></Pressable>
                    <Pressable style={[styles.addButton, { flex: 1, backgroundColor: '#0f1520' }]} onPress={() => {
                      try {
                        const rows = (currentFinance?.investTx || [])
                          .filter(tx => invFilter.type === 'All' ? true : tx.type === invFilter.type)
                          .filter(tx => invFilter.currency === 'All' ? true : (tx.currency || 'USD') === invFilter.currency)
                          .filter(tx => { const q = (invFilter.q || '').toLowerCase(); return !q || ((tx.destination||'').toLowerCase().includes(q) || (tx.note||'').toLowerCase().includes(q)); })
                          .map(tx => [tx.date, tx.type, tx.amount, tx.currency, (tx.destination||''), (tx.note||'')]);
                        const header = ['date','type','amount','currency','destination','note'];
                        const csv = [header, ...rows].map(r => r.map(v => String(v).replace(/"/g,'""')).map(v => /[,"]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
                        if (typeof window !== 'undefined') {
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = 'investment_transactions.csv'; a.click(); URL.revokeObjectURL(url);
                        } else { Alert.alert('Экспорт', 'CSV доступен только в веб-версии'); }
                      } catch {}
                    }}><Text style={styles.addButtonText}>Экспорт CSV</Text></Pressable>
                  </View>

                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Дата</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Тип</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Сумма</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Куда</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Заметка</Text>
                  </View>
                  {/* Filters */}
                  <View style={[styles.inputRow, { marginTop: 8 }] }>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Тип</Text>
                      <View style={styles.pickerContainer}>
                        {['All','in','out'].map(t => (
                          <Pressable key={t} style={[styles.pickerOption, invFilter.type === t ? styles.pickerOptionActive : null]} onPress={() => setInvFilter(f => ({ ...f, type: t }))}>
                            <Text style={[styles.pickerText, invFilter.type === t ? styles.pickerTextActive : null]}>{t}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Валюта</Text>
                      <View style={styles.pickerContainer}>
                        {['All','USD','EUR','RUB'].map(c => (
                          <Pressable key={c} style={[styles.pickerOption, invFilter.currency === c ? styles.pickerOptionActive : null]} onPress={() => setInvFilter(f => ({ ...f, currency: c }))}>
                            <Text style={[styles.pickerText, invFilter.currency === c ? styles.pickerTextActive : null]}>{c}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Поиск</Text>
                      <TextInput style={styles.input} value={invFilter.q} onChangeText={(t) => setInvFilter(f => ({ ...f, q: t }))} placeholder="направление/заметка" />
                    </View>
                  </View>
                  {(currentFinance?.investTx || [])
                    .filter(tx => invFilter.type === 'All' ? true : tx.type === invFilter.type)
                    .filter(tx => invFilter.currency === 'All' ? true : (tx.currency || 'USD') === invFilter.currency)
                    .filter(tx => {
                      const q = (invFilter.q || '').toLowerCase();
                      if (!q) return true;
                      return ((tx.destination||'').toLowerCase().includes(q) || (tx.note||'').toLowerCase().includes(q));
                    })
                    .map(tx => (
                    <View key={tx.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.type === 'in' ? 'Ввод' : 'Вывод'}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{formatCurrencyCustom(tx.amount, tx.currency)}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{tx.destination || '—'}</Text>
                      <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <Text>{tx.note || '—'}</Text>
                        <Pressable style={styles.deleteButtonSmall} onPress={() => deleteInvestTx(tx.id)}>
                          <Text style={styles.deleteButtonText}>×</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  {(currentFinance?.investTx || []).length === 0 && <Text style={styles.noteText}>Пока нет транзакций</Text>}
                </>
              )}
            </View>
            )}
          </View>
        )}

        {tab === 'journal' && (
          <>
            {/* Journal entry picker */}
            {!journalView && (
              <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
                <Text style={styles.cardTitle}>Куда перейти?</Text>
                <View style={styles.inputRow}>
                  <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => setJournalView('new')}><Text style={styles.addButtonText}>Новая сделка</Text></Pressable>
                  <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => setJournalView('list')}><Text style={styles.addButtonText}>Журнал сделок</Text></Pressable>
                </View>
              </View>
            )}

            {journalView && (
              <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
                <View style={styles.inputRow}>
                  <Pressable style={[styles.addButton, { backgroundColor: '#1f6feb', flex: 1 }]} onPress={() => setJournalView(null)}>
                    <Text style={styles.addButtonText}>← Назад к выбору</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {journalView === 'new' && (
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>➕ Новая сделка</Text>
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы добавлять сделки</Text>}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Инструмент</Text>
                  <TextInput style={styles.input} value={newTrade.asset} onChangeText={(t) => setNewTrade(v => ({ ...v, asset: t }))} placeholder="BTCUSDT" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Сторона</Text>
                  <View style={styles.pickerContainer}>
                    {['BUY', 'SELL'].map(side => (
                      <Pressable key={side} style={[styles.pickerOption, newTrade.side === side ? styles.pickerOptionActive : null]} onPress={() => setNewTrade(v => ({ ...v, side }))}>
                        <Text style={[styles.pickerText, newTrade.side === side ? styles.pickerTextActive : null]}>{side}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={[styles.inputRow, { marginTop: 8 }]}>
                    <Pressable style={[styles.addButton, { backgroundColor: '#ef4444', flex: 1 }]} onPress={() => setNewTrade(v => ({ ...v, stopLoss: v.stopLoss || v.price }))}>
                      <Text style={styles.addButtonText}>Установить Stop Loss</Text>
                    </Pressable>
                    <Pressable style={[styles.addButton, { backgroundColor: '#10b981', flex: 1 }]} onPress={() => setNewTrade(v => ({ ...v, takeProfit: v.takeProfit || v.price }))}>
                      <Text style={styles.addButtonText}>Установить Take Profit</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Количество</Text>
                  <TextInput style={styles.input} value={newTrade.qty} onChangeText={(t) => setNewTrade(v => ({ ...v, qty: t }))} keyboardType="numeric" placeholder="0.05" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Цена</Text>
                  <TextInput style={styles.input} value={newTrade.price} onChangeText={(t) => setNewTrade(v => ({ ...v, price: t }))} keyboardType="numeric" placeholder="60000" />
                </View>
              </View>
              {/* Position size by risk */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Счёт ($)</Text>
                  <TextInput style={styles.input} value={riskCalc.account} onChangeText={(t) => setRiskCalc(v => ({ ...v, account: t }))} keyboardType="numeric" placeholder="10000" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Риск (%)</Text>
                  <TextInput style={styles.input} value={riskCalc.riskPct} onChangeText={(t) => setRiskCalc(v => ({ ...v, riskPct: t }))} keyboardType="numeric" placeholder="1" />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SL для расчёта</Text>
                  <TextInput style={styles.input} value={riskCalc.slPrice} onChangeText={(t) => setRiskCalc(v => ({ ...v, slPrice: t }))} keyboardType="numeric" placeholder="58000" />
                </View>
                <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end' }]} onPress={applyRiskPositionSize}><Text style={styles.addButtonText}>Рассчитать размер</Text></Pressable>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Stop Loss</Text>
                  <TextInput style={styles.input} value={newTrade.stopLoss} onChangeText={(t) => setNewTrade(v => ({ ...v, stopLoss: t }))} keyboardType="numeric" placeholder="58000" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Take Profit</Text>
                  <TextInput style={styles.input} value={newTrade.takeProfit} onChangeText={(t) => setNewTrade(v => ({ ...v, takeProfit: t }))} keyboardType="numeric" placeholder="63000" />
                </View>
              </View>
              {/* Quick SL assists */}
              <View style={styles.inputRow}>
                <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => {
                  const priceN = parseNumberSafe(newTrade.price);
                  if (!Number.isFinite(priceN) || priceN <= 0) { Alert.alert('SL', 'Сначала укажите цену входа'); return; }
                  const pct = 1; // 1%
                  const offset = priceN * (pct/100);
                  const sl = newTrade.side === 'BUY' ? (priceN - offset) : (priceN + offset);
                  setNewTrade(v => ({ ...v, stopLoss: String(sl.toFixed(2)) }));
                }}><Text style={styles.addButtonText}>SL -1%</Text></Pressable>
                <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => {
                  const priceN = parseNumberSafe(newTrade.price);
                  if (!Number.isFinite(priceN) || priceN <= 0) { Alert.alert('SL', 'Сначала укажите цену входа'); return; }
                  const pct = 2; // 2%
                  const offset = priceN * (pct/100);
                  const sl = newTrade.side === 'BUY' ? (priceN - offset) : (priceN + offset);
                  setNewTrade(v => ({ ...v, stopLoss: String(sl.toFixed(2)) }));
                }}><Text style={styles.addButtonText}>SL -2%</Text></Pressable>
                <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => {
                  const priceN = parseNumberSafe(newTrade.price);
                  if (!Number.isFinite(priceN) || priceN <= 0) { Alert.alert('SL', 'Сначала укажите цену входа'); return; }
                  const amt = 100; // $100
                  const sl = newTrade.side === 'BUY' ? (priceN - amt) : (priceN + amt);
                  setNewTrade(v => ({ ...v, stopLoss: String(sl.toFixed(2)) }));
                }}><Text style={styles.addButtonText}>SL -$100</Text></Pressable>
              </View>
              {/* Auto TP by R:R */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Целевой R:R</Text>
                  <View style={styles.pickerContainer}>
                    {[ '1', '1.5', '2', '3' ].map(v => (
                      <Pressable key={v} style={[styles.pickerOption, rrTarget === v ? styles.pickerOptionActive : null]} onPress={() => setRrTarget(v)}>
                        <Text style={[styles.pickerText, rrTarget === v ? styles.pickerTextActive : null]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end' }]} onPress={applyAutoTakeProfit}><Text style={styles.addButtonText}>Рассчитать TP</Text></Pressable>
              </View>
              {/* Trailing stop config */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Трейлинг-стоп</Text>
                  <View style={styles.pickerContainer}>
                    {[{k:false,l:'Выкл.'},{k:true,l:'Вкл.'}].map(o => (
                      <Pressable key={String(o.k)} style={[styles.pickerOption, newTrade.trailingEnabled === o.k ? styles.pickerOptionActive : null]} onPress={() => setNewTrade(v => ({ ...v, trailingEnabled: o.k }))}>
                        <Text style={[styles.pickerText, newTrade.trailingEnabled === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Тип</Text>
                  <View style={styles.pickerContainer}>
                    {[{k:'percent',l:'% от цены'},{k:'amount',l:'Сумма ($)'}].map(o => (
                      <Pressable key={o.k} style={[styles.pickerOption, newTrade.trailingType === o.k ? styles.pickerOptionActive : null]} onPress={() => setNewTrade(v => ({ ...v, trailingType: o.k }))}>
                        <Text style={[styles.pickerText, newTrade.trailingType === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Значение</Text>
                  <TextInput style={styles.input} value={newTrade.trailingValue} onChangeText={(t) => setNewTrade(v => ({ ...v, trailingValue: t }))} keyboardType="numeric" placeholder={newTrade.trailingType === 'percent' ? '0.5' : '100'} />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Рынок</Text>
                  <View style={styles.pickerContainer}>
                    {['Forex', 'Stock', 'Metals', 'Crypto'].map(market => (
                      <Pressable key={market} style={[styles.pickerOption, newTrade.market === market ? styles.pickerOptionActive : null]} onPress={() => setNewTrade(v => ({ ...v, market }))}>
                        <Text style={[styles.pickerText, newTrade.market === market ? styles.pickerTextActive : null]}>{market}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Стиль</Text>
                  <View style={styles.pickerContainer}>
                    {['Скальпинг', 'Интрадей', 'Среднесрок'].map(style => (
                      <Pressable key={style} style={[styles.pickerOption, newTrade.style === style ? styles.pickerOptionActive : null]} onPress={() => setNewTrade(v => ({ ...v, style }))}>
                        <Text style={[styles.pickerText, newTrade.style === style ? styles.pickerTextActive : null]}>{style}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Дата</Text>
                <TextInput style={styles.input} value={newTrade.date} onChangeText={(t) => setNewTrade(v => ({ ...v, date: t }))} placeholder="2025-01-15" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Причина открытия сделки</Text>
                <TextInput style={[styles.input, styles.textArea]} value={newTrade.notes} onChangeText={(t) => setNewTrade(v => ({ ...v, notes: t }))} placeholder="Сигнал, сетап, причина входа..." multiline numberOfLines={3} />
              </View>
              <Pressable style={styles.addButton} onPress={addTrade}><Text style={styles.addButtonText}>Добавить сделку</Text></Pressable>
            </View>
            )}

            {journalView === 'list' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Дневник сделок</Text>
              <View style={styles.filterContainer}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Рынок:</Text>
                  <View style={styles.pickerContainer}>
                    {['All', 'Forex', 'Stock', 'Metals', 'Crypto'].map(market => (
                      <Pressable key={market} style={[styles.pickerOption, filterMarket === market ? styles.pickerOptionActive : null]} onPress={() => setFilterMarket(market)}>
                        <Text style={[styles.pickerText, filterMarket === market ? styles.pickerTextActive : null]}>{market}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Стиль:</Text>
                  <View style={styles.pickerContainer}>
                    {['All', 'Скальпинг', 'Интрадей', 'Среднесрок'].map(style => (
                      <Pressable key={style} style={[styles.pickerOption, filterStyle === style ? styles.pickerOptionActive : null]} onPress={() => setFilterStyle(style)}>
                        <Text style={[styles.pickerText, filterStyle === style ? styles.pickerTextActive : null]}>{style}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.statsContainer}>
                <Text style={styles.statItem}>Закрыто: {pnlStats.closedTrades}</Text>
                <Text style={styles.statItem}>Win-rate: {(pnlStats.winRate * 100).toFixed(1)}%</Text>
                <Text style={styles.statItem}>Реализовано: {formatCurrency(pnlStats.realized)}</Text>
              </View>
              {filteredTrades.map((trade) => (
                <View key={trade.id} style={styles.tradeItem}>
                  <View style={styles.tradeHeader}>
                    <Text style={styles.tradeAsset}>{trade.asset}</Text>
                    <Text style={[styles.tradeSide, trade.side === 'BUY' ? styles.tradeSideBuy : styles.tradeSideSell]}>{trade.side}</Text>
                  </View>
                  <View style={styles.tradeDetails}>
                    <Text style={styles.tradeDetail}>{trade.qty} @ {formatCurrency(trade.price)} • Остаток: {trade.remainingQty ?? trade.qty}</Text>
                    {(() => {
                      const sl = trade.stopLoss;
                      const tp = trade.takeProfit;
                      if (!sl && !tp) return null;
                      const isBuy = trade.side === 'BUY';
                      const riskPerUnit = sl ? (isBuy ? (trade.price - sl) : (sl - trade.price)) : null;
                      const rewardPerUnit = tp ? (isBuy ? (tp - trade.price) : (trade.price - tp)) : null;
                      const risk = (riskPerUnit != null && riskPerUnit > 0) ? riskPerUnit * trade.qty : null;
                      const reward = (rewardPerUnit != null && rewardPerUnit > 0) ? rewardPerUnit * trade.qty : null;
                      const rr = (risk && reward) ? (reward / risk) : null;
                      return (
                        <Text style={styles.tradeDetail}>
                          {sl ? `SL: ${formatCurrency(sl)}` : ''}
                          {sl && tp ? ' • ' : ''}
                          {tp ? `TP: ${formatCurrency(tp)}` : ''}
                          {(rr && rr > 0) ? ` • R:R ${formatNumberCompact(rr, { maxDecimals: 6 })}` : ''}
                          {trade.trailingEnabled ? ` • Trailing ${trade.trailingType === 'percent' ? (trade.trailingValue || 0) + '%' : formatCurrency(trade.trailingValue || 0)}` : ''}
                        </Text>
                      );
                    })()}
                    <Text style={styles.tradeDetail}>{trade.market} • {trade.style} • {trade.date}</Text>
                  </View>
                  {trade.notes ? <Text style={styles.tradeNotes}>{trade.notes}</Text> : null}
                  {/* Close controls */}
                  {currentUser && trade.userId === currentUser.id && (trade.remainingQty ?? trade.qty) > 0 && (
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Кол-во закрыть</Text>
                        <TextInput style={styles.input} value={(closeDrafts[trade.id]?.qty) || ''} onChangeText={(t) => setCloseDrafts(v => ({ ...v, [trade.id]: { ...(v[trade.id]||{}), qty: t } }))} keyboardType="numeric" placeholder="0" />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Цена закрытия</Text>
                        <TextInput style={styles.input} value={(closeDrafts[trade.id]?.price) || ''} onChangeText={(t) => setCloseDrafts(v => ({ ...v, [trade.id]: { ...(v[trade.id]||{}), price: t } }))} keyboardType="numeric" placeholder="0" />
                      </View>
                      <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end' }]} onPress={() => closeTradePartial(trade.id)}><Text style={styles.addButtonText}>Закрыть частично</Text></Pressable>
                      <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end', backgroundColor: '#10b981' }]} onPress={() => closeTradeFull(trade.id)}><Text style={styles.addButtonText}>Закрыть полностью</Text></Pressable>
                    </View>
                  )}
                  {(trade.closures || []).length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={styles.filterLabel}>Закрытия:</Text>
                      {(trade.closures || []).map(c => (
                        <Text key={c.id} style={styles.tradeDetail}>• {c.date}: {c.qty} @ {formatCurrency(c.price)}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
            )}
          </>
        )}

        {tab === 'planner' && (
          <>
            {/* Planner toolbar (Google Calendar–like) */}
            <View style={[styles.card, { paddingBottom: 12 }]}>
              <View style={[styles.inputRow, { alignItems: 'center' }]}>
                <Pressable style={[styles.addButton, { backgroundColor: '#0f1520' }]} onPress={goToday}><Text style={styles.addButtonText}>Сегодня</Text></Pressable>
                <Pressable style={[styles.addButton, { backgroundColor: '#0f1520' }]} onPress={goPrev}><Text style={styles.addButtonText}>‹</Text></Pressable>
                <Pressable style={[styles.addButton, { backgroundColor: '#0f1520' }]} onPress={goNext}><Text style={styles.addButtonText}>›</Text></Pressable>
                <View style={{ flex: 1 }} />
                {['month','week','day'].map(v => (
                  <Pressable key={v} style={[styles.pickerOption, plannerView === v ? styles.pickerOptionActive : null]} onPress={() => setPlannerView(v)}>
                    <Text style={[styles.pickerText, plannerView === v ? styles.pickerTextActive : null]}>{v === 'month' ? 'Месяц' : v === 'week' ? 'Неделя' : 'День'}</Text>
                  </Pressable>
                ))}
                <Pressable style={[styles.addButton, { backgroundColor: plannerShowNews ? '#1f6feb' : '#0f1520' }]} onPress={() => setPlannerShowNews(v => !v)}><Text style={styles.addButtonText}>{plannerShowNews ? 'Скрыть новости' : 'Показать новости'}</Text></Pressable>
                </View>
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>{monthLabel(plannerDate)}</Text>
                </View>

            {/* Month View */}
            {plannerView === 'month' && (
              <View style={[styles.card, { padding: 12 }]}>
                {(() => {
                  const start = startOfMonthMon(plannerDate);
                  const rows = [];
                  for (let r = 0; r < 6; r++) {
                    const cells = [];
                    for (let c = 0; c < 7; c++) {
                      const d = addDays(start, r * 7 + c);
                      const iso = toISODate(d);
                      const dayEvents = unifiedPlannerEvents.filter(e => e.date === iso).slice(0, 3);
                      cells.push(
                        <Pressable key={iso} style={styles.plannerCell} onPress={() => openComposeForDate(iso)}>
                          <Text style={[styles.plannerCellDate, isSameDay(d, new Date()) ? styles.plannerCellToday : null]}>{d.getDate()}</Text>
                          {dayEvents.map(ev => (
                            <Pressable key={ev.id} onPress={() => openComposeForEdit(ev)}>
                              <Text style={styles.plannerEventItem}>{(ev.time || '')} {ev.title}</Text>
                  </Pressable>
                          ))}
                          {unifiedPlannerEvents.filter(e => e.date === iso).length > 3 && (
                            <Text style={styles.plannerMore}>ещё {unifiedPlannerEvents.filter(e => e.date === iso).length - 3}…</Text>
                          )}
                        </Pressable>
                      );
                    }
                    rows.push(<View key={`r${r}`} style={styles.plannerRow}>{cells}</View>);
                  }
                  return <View>{rows}</View>;
                })()}
              </View>
            )}

            {/* Week / Day simple lists */}
            {plannerView !== 'month' && (
              <View style={[styles.card, { padding: 12 }]}>
                {(() => {
                  const start = new Date(plannerDate);
                  start.setHours(0,0,0,0);
                  const days = plannerView === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(start, i - ((start.getDay()+6)%7))) : [start];
                  const hours = Array.from({ length: 24 }, (_, h) => h);
                  return (
                    <View>
                      <View style={[styles.plannerRow, { marginBottom: 4 }]}>
                        <View style={{ width: 40 }} />
                        {days.map(d => (
                          <View key={`hdr_${d.toDateString()}`} style={[styles.plannerCell, { alignItems: 'center' }]}>
                            <Text style={styles.plannerCellDate}>{toISODate(d)}</Text>
                </View>
                    ))}
                  </View>
                      {hours.map(h => (
                        <View key={`hr_${h}`} style={styles.plannerRow}>
                          <View style={{ width: 40 }}>
                            <Text style={styles.plannerCellDate}>{pad2(h)}:00</Text>
                </View>
                          {days.map(d => {
                            const iso = toISODate(d);
                            const hhmm = `${pad2(h)}:00`;
                            const items = unifiedPlannerEvents.filter(e => e.date === iso && (e.time || '').startsWith(pad2(h)));
                            return (
                              <Pressable key={`c_${iso}_${h}`} style={[styles.plannerCell, { minHeight: 40 }]} onPress={() => openComposeForDateTime(iso, hhmm)}>
                                {items.map(ev => (
                                  <Pressable key={ev.id} onPress={() => openComposeForEdit(ev)}>
                                    <Text style={styles.plannerEventItem}>{(ev.time || '')}{ev.endTime ? `–${ev.endTime}` : ''} {ev.title}</Text>
                                  </Pressable>
                                ))}
                              </Pressable>
                            );
                          })}
                  </View>
                ))}
              </View>
                  );
                })()}
            </View>
            )}

            {/* Compose modal (inline lightweight) */}
            {plannerComposeOpen && (
              <View style={[styles.card, { borderColor: '#1f2a36' }]}>
                <Text style={styles.cardTitle}>Новое событие</Text>
                {!currentUser && <Text style={styles.noteText}>Войдите, чтобы добавлять события</Text>}
              {currentUser && (
                  <>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Дата</Text>
                        <TextInput style={styles.input} value={newEvent.date} onChangeText={(t) => setNewEvent(v => ({ ...v, date: t }))} placeholder="2025-01-15" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Время</Text>
                        <TextInput style={styles.input} value={newEvent.time} onChangeText={(t) => setNewEvent(v => ({ ...v, time: t }))} placeholder="10:00" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Окончание</Text>
                        <TextInput style={styles.input} value={newEvent.endTime || ''} onChangeText={(t) => setNewEvent(v => ({ ...v, endTime: t }))} placeholder="11:00" />
                      </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Тип</Text>
                      <View style={styles.pickerContainer}>
                          {['event','workout'].map(t => (
                            <Pressable key={t} style={[styles.pickerOption, plannerComposeType === t ? styles.pickerOptionActive : null]} onPress={() => setPlannerComposeType(t)}>
                              <Text style={[styles.pickerText, plannerComposeType === t ? styles.pickerTextActive : null]}>{t === 'event' ? 'Событие' : 'Тренировка'}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Заголовок</Text>
                        <TextInput style={styles.input} value={newEvent.title} onChangeText={(t) => setNewEvent(v => ({ ...v, title: t }))} placeholder={plannerComposeType === 'event' ? "Событие" : "Тренировка"} />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Заметки</Text>
                      <TextInput style={[styles.input, styles.textArea]} value={newEvent.notes} onChangeText={(t) => setNewEvent(v => ({ ...v, notes: t }))} placeholder="Описание..." multiline numberOfLines={3} />
                  </View>
                    <View style={styles.inputRow}>
                      <Pressable style={[styles.addButton, { flex: 1, backgroundColor: '#1f6feb' }]} onPress={savePlannerCompose}><Text style={styles.addButtonText}>Сохранить</Text></Pressable>
                      {!!plannerEditing && (
                        <Pressable style={[styles.addButton, { flex: 1, backgroundColor: '#ef4444' }]} onPress={deletePlannerCompose}><Text style={styles.addButtonText}>Удалить</Text></Pressable>
                      )}
                      <Pressable style={[styles.addButton, { flex: 1 }]} onPress={() => setPlannerComposeOpen(false)}><Text style={styles.addButtonText}>Отмена</Text></Pressable>
                </View>
                  </>
              )}
                </View>
            )}

            {/* News (optional panel inside planner for now) */}
            {plannerShowNews && (
            <>
            <Text style={[styles.cardTitle, { marginTop: 8 }]}>Новости (опционально)</Text>
            <View style={styles.card}>
              <Text style={styles.cardDescription}>Данные с TradingEconomics (демо). Фильтр по стране и важности.</Text>
              {/* Filters toolbar */}
              <View style={styles.toolbarRow}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>Страны (коды/названия, через запятую)</Text>
                  <TextInput style={styles.input} value={newsCountry} onChangeText={setNewsCountry} placeholder="US, EU, CN" />
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>Важность</Text>
                  <View style={styles.chipsRow}>
                    {[
                      { k: 3, label: 'Высокая' },
                      { k: 2, label: 'Средняя' },
                      { k: 1, label: 'Низкая' },
                    ].map(({ k, label }) => (
                      <Pressable key={k} style={[styles.chip, importanceFilters[k] ? styles.chipActive : null]} onPress={() => setImportanceFilters(prev => ({ ...prev, [k]: !prev[k] }))}>
                        <Text style={[styles.chipText, importanceFilters[k] ? styles.chipTextActive : null]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>Диапазон (дней)</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                      <Text style={styles.label}>Назад</Text>
                      <TextInput style={styles.input} value={String(newsBackDays)} onChangeText={(t) => setNewsBackDays(Math.max(0, Number(t)||0))} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                      <Text style={styles.label}>Вперёд</Text>
                      <TextInput style={styles.input} value={String(newsForwardDays)} onChangeText={(t) => setNewsForwardDays(Math.max(0, Number(t)||0))} keyboardType="numeric" />
              </View>
                    </View>
                  </View>
                <View style={[styles.inputGroup, { flex: 1, justifyContent: 'flex-end' }]}>
                  <Pressable style={styles.addButton} onPress={refreshNews}><Text style={styles.addButtonText}>Обновить</Text></Pressable>
                  <Pressable style={[styles.addButton, { marginTop: 6, backgroundColor: '#0f1520' }]} onPress={expandNewsRange}><Text style={styles.addButtonText}>+30 дней к окну</Text></Pressable>
                  <Pressable style={[styles.addButton, { marginTop: 6, backgroundColor: '#0f1520' }]} onPress={resetNewsRange}><Text style={styles.addButtonText}>Сброс окна</Text></Pressable>
              </View>
            </View>

              {newsLoading && <Text style={styles.noteText}>Загрузка…</Text>}
              {!!newsError && <Text style={[styles.noteText, { color: '#ef4444' }]}>{newsError}</Text>}
              <View style={styles.newsList}>
                {news.map((item) => (
                  <View key={item.id} style={styles.newsItem}>
                    <View style={styles.newsHeader}>
                      <Text style={styles.newsDate}>{item.date || '—'}</Text>
                      <Text style={styles.newsTime}>{item.time || '—'}</Text>
                      <Text style={styles.newsCountry}>{item.country || '—'}</Text>
                    </View>
                    <Text style={styles.newsTitle}>{item.title || '—'}</Text>
                    <Text style={styles.newsImportance}>{getImportanceStars(item.importance || 1)}</Text>
                    {item.Actual || item.Previous || item.Forecast ? (
                      <Text style={styles.noteText}>
                        {item.Actual ? `Actual: ${item.Actual}` : ''}
                        {item.Previous ? `  Prev: ${item.Previous}` : ''}
                        {item.Forecast ? `  Fcst: ${item.Forecast}` : ''}
                      </Text>
                    ) : null}
                    {item.Category || item.Event || item.Title ? (
                      <Text style={styles.noteText}>{item.Category || item.Event || item.Title}</Text>
                    ) : null}
                  </View>
                ))}
                {(!newsLoading && news.length === 0) && <Text style={styles.noteText}>Нет событий по выбранным фильтрам</Text>}
                  </View>
              <Text style={styles.noteText}>Источник: TradingEconomics (guest:guest). Для продакшена используйте собственные ключи/API.</Text>
                </View>
            </>
            )}

            {/* (old events UI removed in favor of unified planner) */}
          </>
        )}

        {tab === 'profile' && (
          <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
            <Text style={styles.cardTitle}>👤 Профиль</Text>
            {!currentUser ? (
              <Text style={styles.noteText}>Войдите или зарегистрируйтесь, чтобы редактировать профиль</Text>
            ) : (
              <>
                <View style={styles.profileHeader}>
                  {currentUser.avatar ? (
                    <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={styles.avatarLetter}>{currentUser.nickname[0]?.toUpperCase()}</Text></View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileNickname}>@{currentUser.nickname}</Text>
                    <Text style={styles.profileBio}>{currentUser.bio || 'Без описания'}</Text>
                  </View>
                </View>

                {/* Profile section tabs */}
                <View style={[styles.inputRow, { marginTop: 12 }]}>
                  {[
                    { k: 'overview', l: 'Обзор' },
                    { k: 'friends', l: 'Друзья' },
                    { k: 'achievements', l: 'Достижения' },
                    { k: 'settings', l: 'Настройки' },
                  ].map(o => (
                    <Pressable key={o.k} style={[styles.pickerOption, profileTab === o.k ? styles.pickerOptionActive : null]} onPress={() => setProfileTab(o.k)}>
                      <Text style={[styles.pickerText, profileTab === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                    </Pressable>
                  ))}
                </View>

                {profileTab === 'overview' && (
                  <>
                    <Text style={[styles.cardTitle, { marginTop: 12 }]}>Редактирование</Text>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Никнейм</Text>
                        <TextInput style={styles.input} value={currentUser.nickname} onChangeText={(t) => updateProfile({ nickname: t })} />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Аватар</Text>
                        <Pressable style={styles.addButton} onPress={pickAvatarImage}><Text style={styles.addButtonText}>Загрузить фото</Text></Pressable>
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Статус</Text>
                      <TextInput style={styles.input} value={currentUser.statusText} onChangeText={(t) => updateProfile({ statusText: t })} placeholder="Например: Swing-трейдер, риск ≤1%" />
                    </View>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Опыт (лет)</Text>
                        <TextInput style={styles.input} value={String(currentUser.experienceYears || 0)} onChangeText={(t) => updateProfile({ experienceYears: Number(t || 0) })} keyboardType="numeric" />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Часовой пояс</Text>
                        <TextInput style={styles.input} value={currentUser.timezone} onChangeText={(t) => updateProfile({ timezone: t })} placeholder="Europe/Moscow" />
                      </View>
                    </View>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Локация</Text>
                        <TextInput style={styles.input} value={currentUser.location} onChangeText={(t) => updateProfile({ location: t })} placeholder="Москва, РФ" />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ссылки</Text>
                        <TextInput style={styles.input} value={currentUser.links?.tg || ''} onChangeText={(t) => updateProfile({ links: { ...(currentUser.links||{}), tg: t } })} placeholder="Telegram @handle" />
                        <TextInput style={[styles.input, { marginTop: 8 }]} value={currentUser.links?.x || ''} onChangeText={(t) => updateProfile({ links: { ...(currentUser.links||{}), x: t } })} placeholder="X/Twitter link" />
                      </View>
                    </View>
                    <Text style={[styles.cardTitle, { marginTop: 12 }]}>Рынки интереса</Text>
                    <View style={styles.inputRow}>
                      {['Crypto','Stocks','Forex'].map(m => (
                        <Pressable key={m} style={[styles.pickerOption, (currentUser.markets||[]).includes(m) ? styles.pickerOptionActive : null]} onPress={() => toggleMarketPref(m)}>
                          <Text style={[styles.pickerText, (currentUser.markets||[]).includes(m) ? styles.pickerTextActive : null]}>{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>О себе</Text>
                      <TextInput style={[styles.input, styles.textArea]} value={currentUser.bio} onChangeText={(t) => updateProfile({ bio: t })} multiline numberOfLines={3} />
            </View>
          </>
                )}

                {profileTab === 'friends' && (
                  <>
                    <Text style={[styles.cardTitle, { marginTop: 12 }]}>Друзья</Text>
                    <View style={styles.friendsList}>
                      {friendsOfCurrent.length === 0 && <Text style={styles.noteText}>Пока нет друзей</Text>}
                      {friendsOfCurrent.map(f => (
                        <View key={f.id} style={styles.friendItem}>
                          <Text style={styles.friendName}>@{f.nickname}</Text>
                          <Pressable style={styles.removeFriendBtn} onPress={() => removeFriend(f.id)}><Text style={styles.removeFriendText}>Удалить</Text></Pressable>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.cardTitle, { marginTop: 12 }]}>Найти пользователей</Text>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Поиск пользователей</Text>
                        <TextInput style={styles.input} value={userSearch} onChangeText={(t) => { setUserSearch(t); runUserSearch(t); }} placeholder="Введите никнейм" />
                      </View>
                    </View>
                    {userSearch.trim().length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        {searchResults.length === 0 ? (
                          <Text style={styles.noteText}>Ничего не найдено</Text>
                        ) : (
                          <View style={styles.friendsList}>
                            {searchResults.map(u => (
                              <View key={`s_${u.id}`} style={styles.friendItem}>
                                <Text style={styles.friendName}>@{u.nickname}</Text>
                                {currentUser && u.id !== currentUser.id && (
                                  (() => {
                                    const pending = pendingWithUser(u.id);
                                    if ((currentUser.friends || []).includes(u.id)) {
                                      return <Pressable style={styles.removeFriendBtn} onPress={() => removeFriend(u.id)}><Text style={styles.removeFriendText}>Удалить</Text></Pressable>;
                                    }
                                    if (pending && pending.to === currentUser.id) {
                                      return (
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                          <Pressable style={styles.addFriendBtn} onPress={() => acceptFriendRequest(pending.id)}><Text style={styles.addFriendText}>Принять</Text></Pressable>
                                          <Pressable style={styles.removeFriendBtn} onPress={() => rejectFriendRequest(pending.id)}><Text style={styles.removeFriendText}>Отклонить</Text></Pressable>
                                        </View>
                                      );
                                    }
                                    if (pending && pending.from === currentUser.id) {
                                      return <Pressable style={styles.removeFriendBtn} onPress={() => cancelFriendRequest(pending.id)}><Text style={styles.removeFriendText}>Отменить</Text></Pressable>;
                                    }
                                    return <Pressable style={styles.addFriendBtn} onPress={() => sendFriendRequest(u.id)}><Text style={styles.addFriendText}>Добавить</Text></Pressable>;
                                  })()
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Incoming requests */}
                    {myIncomingRequests().length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.cardTitle}>Входящие запросы</Text>
                        <View style={styles.friendsList}>
                          {myIncomingRequests().map(r => (
                            <View key={r.id} style={styles.friendItem}>
                              <Text style={styles.friendName}>@{userById(r.from).nickname}</Text>
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Pressable style={styles.addFriendBtn} onPress={() => acceptFriendRequest(r.id)}><Text style={styles.addFriendText}>Принять</Text></Pressable>
                                <Pressable style={styles.removeFriendBtn} onPress={() => rejectFriendRequest(r.id)}><Text style={styles.removeFriendText}>Отклонить</Text></Pressable>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Outgoing requests */}
                    {myOutgoingRequests().length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.cardTitle}>Исходящие запросы</Text>
                        <View style={styles.friendsList}>
                          {myOutgoingRequests().map(r => (
                            <View key={r.id} style={styles.friendItem}>
                              <Text style={styles.friendName}>@{userById(r.to).nickname}</Text>
                              <Pressable style={styles.removeFriendBtn} onPress={() => cancelFriendRequest(r.id)}><Text style={styles.removeFriendText}>Отменить</Text></Pressable>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Recommendations */}
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.cardTitle}>Рекомендации</Text>
                      <View style={styles.friendsList}>
                        {friendRecommendations().map(u => (
                          <View key={`rec_${u.id}`} style={styles.friendItem}>
                            <Text style={styles.friendName}>@{u.nickname}</Text>
                            <Pressable style={styles.addFriendBtn} onPress={() => sendFriendRequest(u.id)}><Text style={styles.addFriendText}>Добавить</Text></Pressable>
                          </View>
                        ))}
                        {friendRecommendations().length === 0 && <Text style={styles.noteText}>Пока нет рекомендаций</Text>}
                      </View>
                    </View>
                  </>
                )}

                {profileTab === 'achievements' && (
                  <>
                    <Text style={[styles.cardTitle, { marginTop: 12 }]}>🏆 Достижения</Text>
                    <View style={styles.achievementsGrid}>
                      {achievements.map((a) => (
                        <View key={a.id} style={[styles.achievement, a.unlocked ? styles.achievementUnlocked : styles.achievementLocked]}>
                          <Text style={styles.achievementTitle}>{a.title}</Text>
                          <Text style={styles.achievementDesc}>{a.description}</Text>
                          {a.unlocked ? (
                            <Text style={styles.achievementDate}>Получено: {a.date || '—'}</Text>
                          ) : (
                            <Text style={styles.achievementLockedText}>🔒 Заблокировано</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {profileTab === 'settings' && (
                  <>
                    <Text style={[styles.cardTitle, { marginTop: 12 }]}>Настройки</Text>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Тема</Text>
                        <View style={styles.pickerContainer}>
                          {[{k:'light',l:'Светлая'},{k:'dark',l:'Тёмная'}].map(o => (
                            <Pressable key={o.k} style={[styles.pickerOption, appTheme === o.k ? styles.pickerOptionActive : null]} onPress={() => setAppTheme(o.k)}>
                              <Text style={[styles.pickerText, appTheme === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {tab === 'community' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👥 Сообщество трейдеров</Text>
            <Text style={styles.cardDescription}>Публикуйте идеи, лайкайте и комментируйте</Text>

            {/* Feed filters */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Фильтр по рынку</Text>
                <View style={styles.pickerContainer}>
                  {['All','Crypto','Stocks','Forex'].map(m => (
                    <Pressable key={m} style={[styles.pickerOption, postFilterMarket === m ? styles.pickerOptionActive : null]} onPress={() => setPostFilterMarket(m)}>
                      <Text style={[styles.pickerText, postFilterMarket === m ? styles.pickerTextActive : null]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Сортировка</Text>
                <View style={styles.pickerContainer}>
                  {[{k:'date_desc',l:'Сначала новые'},{k:'likes_desc',l:'По лайкам'}].map(o => (
                    <Pressable key={o.k} style={[styles.pickerOption, postSort === o.k ? styles.pickerOptionActive : null]} onPress={() => setPostSort(o.k)}>
                      <Text style={[styles.pickerText, postSort === o.k ? styles.pickerTextActive : null]}>{o.l}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.inputRow}>
              <Pressable style={[styles.addButton, { flex: 1, backgroundColor: showMine ? '#1f6feb' : '#0f1520' }]} onPress={() => setShowMine(v => !v)}>
                <Text style={styles.addButtonText}>{showMine ? 'Показать все' : 'Только мои посты'}</Text>
              </Pressable>
              <Pressable style={[styles.addButton, { flex: 1, backgroundColor: showBookmarksOnly ? '#1f6feb' : '#0f1520' }]} onPress={() => setShowBookmarksOnly(v => !v)}>
                <Text style={styles.addButtonText}>{showBookmarksOnly ? 'Все посты' : 'Закладки'}</Text>
              </Pressable>
            </View>
            {hashtagFilter ? (
              <View style={styles.inputRow}>
                <Text style={styles.noteText}>Фильтр по тегу: #{hashtagFilter}</Text>
                <Pressable style={[styles.addButton, { marginLeft: 12 }]} onPress={() => setHashtagFilter('')}><Text style={styles.addButtonText}>Сбросить</Text></Pressable>
              </View>
            ) : null}

            {/* Post composer */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Заголовок</Text>
                <TextInput style={styles.input} value={newPost.title} onChangeText={(t) => setNewPost(v => ({ ...v, title: t }))} placeholder="Идея по BTC..." />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Рынок</Text>
                <View style={styles.pickerContainer}>
                  {['Crypto', 'Stocks', 'Forex'].map(m => (
                    <Pressable key={m} style={[styles.pickerOption, newPost.market === m ? styles.pickerOptionActive : null]} onPress={() => setNewPost(v => ({ ...v, market: m }))}>
                      <Text style={[styles.pickerText, newPost.market === m ? styles.pickerTextActive : null]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Текст</Text>
              <TextInput style={[styles.input, styles.textArea]} value={newPost.content} onChangeText={(t) => setNewPost(v => ({ ...v, content: t }))} placeholder="Описание сетапа, риск..." multiline numberOfLines={3} />
            </View>
            <View style={styles.inputRow}>
              <Pressable style={[styles.addButton, { flex: 1 }]} onPress={pickImagesForPost}><Text style={styles.addButtonText}>Прикрепить скрин(ы)</Text></Pressable>
            </View>
            {(newPost.images || []).length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.filterLabel}>Прикреплено: {(newPost.images || []).length}</Text>
                <ScrollView horizontal style={{ marginTop: 6 }}>
                  {(newPost.images || []).map((uri, idx) => (
                    <View key={uri+idx} style={{ marginRight: 8, position: 'relative' }}>
                      <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 6, backgroundColor: '#eee' }} />
                      <Pressable style={[styles.deleteButtonSmall, { position: 'absolute', top: -6, right: -6 }]} onPress={() => setNewPost(v => ({ ...v, images: v.images.filter((u, i) => i !== idx) }))}>
                        <Text style={styles.deleteButtonText}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            <Pressable style={styles.addButton} onPress={addPost}><Text style={styles.addButtonText}>Опубликовать</Text></Pressable>

            {/* Feed */}
            <View style={styles.communityGrid}>
              {posts
                .filter(p => postFilterMarket === 'All' ? true : p.market === postFilterMarket)
                .filter(p => showMine ? (currentUser && p.userId === currentUser.id) : true)
                .filter(p => showBookmarksOnly ? isBookmarked(p.id) : true)
                .filter(p => hashtagFilter ? (p.content || '').includes(`#${hashtagFilter}`) : true)
                .sort((a,b) => postSort === 'likes_desc' ? (b.likes.length - a.likes.length) : (b.id - a.id))
                .map((post) => (
                <View key={post.id} style={styles.communityPost}>
                  <View style={styles.postHeader}>
                    <Pressable onPress={() => setViewUserId(post.userId)}>
                    <Text style={styles.postUser}>@{userById(post.userId).nickname}</Text>
                    </Pressable>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.postMarket}>{post.market}</Text>
                      {currentUser && post.userId === currentUser.id && (
                        <Pressable style={styles.deleteButton} onPress={() => deletePost(post.id)}>
                          <Text style={styles.deleteButtonText}>×</Text>
                        </Pressable>
                      )}
                      {currentUser && (
                        <Pressable style={styles.actionButton} onPress={() => toggleBookmark(post.id)}>
                          <Text style={styles.actionText}>{isBookmarked(post.id) ? '★' : '☆'}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  {renderPostContent(post.content)}
                  {(post.images || []).length > 0 && (
                    <ScrollView horizontal style={{ marginBottom: 8 }}>
                      {(post.images || []).map((uri, idx) => (
                        <Image key={uri+idx} source={{ uri }} style={{ width: 140, height: 140, borderRadius: 8, backgroundColor: '#eee', marginRight: 8 }} />
                      ))}
                    </ScrollView>
                  )}
                  <View style={styles.postActions}>
                    <Pressable style={styles.actionButton} onPress={() => toggleLike(post.id)}>
                      <Text style={styles.actionText}>👍 {post.likes.length}</Text>
                    </Pressable>
                  </View>

                  {/* Comments */}
                  {post.comments.map(c => (
                    <View key={c.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentMeta}>@{userById(c.userId).nickname} • {c.date}</Text>
                        {currentUser && c.userId === currentUser.id && (
                          <Pressable style={styles.deleteButtonSmall} onPress={() => deleteComment(post.id, c.id)}>
                            <Text style={styles.deleteButtonText}>×</Text>
                          </Pressable>
                        )}
                      </View>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  ))}
                  <View style={styles.commentComposer}>
                    <TextInput style={styles.input} value={commentDrafts[post.id] || ''} onChangeText={(t) => setCommentDrafts(v => ({ ...v, [post.id]: t }))} placeholder="Добавить комментарий..." />
                    <Pressable style={[styles.addButton, { marginTop: 8 }]} onPress={() => addComment(post.id)}><Text style={styles.addButtonText}>Отправить</Text></Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}


        
      </ScrollView>

      {/* Lightweight profile viewer */}
      {!!viewUserId && (
        <View style={styles.profileModalOverlay}>
          <View style={[styles.profileModal, isDark ? { backgroundColor: '#121820', borderColor: '#1f2a36' } : null]}>
              {(() => {
                const u = userById(viewUserId);
                const isFriend = currentUser && currentUser.friends && currentUser.friends.includes(viewUserId);
                return (
                  <>
                    <Text style={styles.cardTitle}>Профиль @{u.nickname}</Text>
                    <Text style={styles.profileBio}>{u.bio || 'Без описания'}</Text>
            <View style={[styles.inputRow, { marginTop: 8 }]}>
              {currentUser && viewUserId !== currentUser.id && (
                        isFriend ? (
                          <Pressable style={styles.removeFriendBtn} onPress={() => { removeFriend(viewUserId); }}><Text style={styles.removeFriendText}>Удалить из друзей</Text></Pressable>
                ) : (
                          <Pressable style={styles.addFriendBtn} onPress={() => { addFriend(viewUserId); }}><Text style={styles.addFriendText}>Добавить в друзья</Text></Pressable>
                )
              )}
              <Pressable style={[styles.addButton, { backgroundColor: '#1f6feb' }]} onPress={() => setViewUserId(null)}><Text style={styles.addButtonText}>Закрыть</Text></Pressable>
            </View>
                  </>
                );
              })()}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f14' },
  header: { backgroundColor: '#121820', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1f2a36' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#e6edf3' },
  brandLogo: { width: 560, height: 240, alignSelf: 'center', marginBottom: 6 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tabContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#1b2430', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#1f6feb' },
  inactiveTab: { backgroundColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#9fb0c0' },
  activeTabText: { color: '#fff' },
  inactiveTabText: { color: '#9fb0c0' },
  authStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authStatusText: { fontSize: 12, color: '#9fb0c0' },
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#fff', fontWeight: '600' },

  content: { flex: 1, padding: 20 },
  card: { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' },
  cardDescription: { fontSize: 14, color: '#9fb0c0', marginBottom: 16 },
  plannerRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  plannerCell: { flex: 1, minHeight: 90, borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 6, backgroundColor: '#0f1520' },
  plannerCellDate: { fontSize: 12, color: '#9fb0c0', marginBottom: 4 },
  plannerCellToday: { color: '#fff', fontWeight: '700' },
  plannerEventItem: { fontSize: 12, color: '#e6edf3' },
  plannerMore: { fontSize: 12, color: '#9fb0c0', marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputGroup: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' },
  input: { borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerContainer: { flexDirection: 'row', gap: 6 },
  pickerOption: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#1b2430', alignItems: 'center' },
  pickerOptionActive: { backgroundColor: '#1f6feb' },
  pickerText: { fontSize: 12, color: '#9fb0c0' },
  pickerTextActive: { color: '#fff', fontWeight: '600' },
  resultCard: { backgroundColor: '#0f1520', borderRadius: 8, padding: 16, marginTop: 8, alignItems: 'center' },
  resultTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#e6edf3' },
  resultValue: { fontSize: 22, fontWeight: 'bold', color: '#10b981', marginBottom: 4 },
  resultSubtitle: { fontSize: 13, color: '#9fb0c0' },
  emergencyStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  emergencyBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  emergencyGood: { backgroundColor: '#28a745' },
  emergencyWarning: { backgroundColor: '#ffc107' },
  emergencyText: { fontSize: 13, fontWeight: '600' },
  emergencyTextGood: { color: '#fff' },
  emergencyTextWarning: { color: '#000' },
  emergencyGoal: { fontSize: 13, color: '#666' },
  emergencyRecommendation: { fontSize: 12, color: '#666', marginTop: 6, fontStyle: 'italic' },
  addButton: { backgroundColor: '#10b981', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  filterContainer: { marginBottom: 12 },
  filterGroup: { marginBottom: 10 },
  filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#9fb0c0' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 12 },
  statItem: { fontSize: 13, fontWeight: '600', color: '#e6edf3' },
  tradeItem: { borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 12, marginBottom: 8 },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tradeAsset: { fontSize: 15, fontWeight: 'bold' },
  tradeSide: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12, fontWeight: '600' },
  tradeSideBuy: { backgroundColor: '#d4edda', color: '#155724' },
  tradeSideSell: { backgroundColor: '#f8d7da', color: '#721c24' },
  deleteButton: { backgroundColor: '#dc3545', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tradeDetails: { marginBottom: 4 },
  tradeDetail: { fontSize: 12, color: '#9fb0c0', marginBottom: 2 },
  tradeNotes: { fontSize: 12, color: '#1f6feb', fontStyle: 'italic' },

  newsList: { marginBottom: 8 },
  newsItem: { borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 12, marginBottom: 8 },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  newsDate: { fontSize: 12, color: '#9fb0c0' },
  newsTime: { fontSize: 12, color: '#9fb0c0' },
  newsCountry: { fontSize: 12, color: '#9fb0c0' },
  newsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2, color: '#e6edf3' },
  newsImportance: { fontSize: 12, color: '#ffc107' },
  noteText: { fontSize: 12, color: '#9fb0c0', fontStyle: 'italic' },
  toolbarRow: { flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1b2430' },
  chipActive: { backgroundColor: '#1f6feb' },
  chipText: { fontSize: 12, color: '#9fb0c0' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  workoutList: { marginTop: 8 },
  workoutItem: { borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 12, marginBottom: 8 },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  workoutType: { fontSize: 15, fontWeight: 'bold' },
  workoutDate: { fontSize: 12, color: '#9fb0c0', marginBottom: 2 },
  workoutNotes: { fontSize: 12, color: '#1f6feb', fontStyle: 'italic' },

  eventList: { marginTop: 8 },
  eventItem: { borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 12, marginBottom: 8 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  eventTitle: { fontSize: 15, fontWeight: 'bold' },
  eventDate: { fontSize: 12, color: '#9fb0c0', marginBottom: 2 },
  eventNotes: { fontSize: 12, color: '#1f6feb', fontStyle: 'italic' },

  communityGrid: { gap: 12 },
  communityPost: { borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 12 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  postUser: { fontSize: 13, fontWeight: '600', color: '#1f6feb' },
  postMarket: { fontSize: 12, backgroundColor: '#1b2430', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: '#9fb0c0' },
  postTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4, color: '#e6edf3' },
  postContent: { fontSize: 14, color: '#e6edf3', marginBottom: 8 },
  postActions: { flexDirection: 'row', gap: 10 },
  actionButton: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#0f1520', borderRadius: 4 },
  actionText: { fontSize: 12, color: '#9fb0c0' },
  commentItem: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 6 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentMeta: { fontSize: 11, color: '#9fb0c0', marginBottom: 2 },
  commentText: { fontSize: 13, color: '#e6edf3' },
  deleteButtonSmall: { backgroundColor: '#dc3545', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  commentComposer: { marginTop: 8 },

  achievementsGrid: { gap: 12 },
  achievement: { borderRadius: 8, padding: 12, borderWidth: 1, backgroundColor: '#0f1520', borderColor: '#1f2a36' },
  achievementUnlocked: { backgroundColor: '#0f1520', borderColor: '#10b981' },
  achievementLocked: { backgroundColor: '#0f1520', borderColor: '#1f2a36' },
  achievementTitle: { fontSize: 14, fontWeight: '600', color: '#e6edf3' },
  achievementDesc: { fontSize: 13, color: '#9fb0c0', marginTop: 2 },
  achievementDate: { fontSize: 12, color: '#10b981', fontWeight: '600', marginTop: 4 },
  achievementLockedText: { fontSize: 12, color: '#9fb0c0', fontStyle: 'italic', marginTop: 4 },

  authCard: { backgroundColor: '#121820', borderRadius: 12, padding: 16, margin: 16, borderWidth: 1, borderColor: '#1f2a36' },
  switchAuth: { marginTop: 8, alignItems: 'center' },
  switchAuthText: { color: '#1f6feb', fontSize: 12 },

  // Toast
  toast: { position: 'absolute', top: 70, left: 20, right: 20, padding: 12, borderRadius: 8, backgroundColor: '#0f1520', borderWidth: 1, borderColor: '#1f2a36', zIndex: 1000 },
  toastWarn: { borderColor: '#ef4444', backgroundColor: '#2b0f12' },
  toastError: { borderColor: '#ef4444', backgroundColor: '#2b0f12' },
  toastText: { color: '#e6edf3', fontSize: 13, textAlign: 'center' },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1b2430' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: '#e6edf3' },
  profileNickname: { fontSize: 16, fontWeight: '700', color: '#e6edf3' },
  profileBio: { fontSize: 13, color: '#9fb0c0' },
  friendsList: { gap: 8, marginTop: 8 },
  friendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  friendName: { fontSize: 13, fontWeight: '600', color: '#e6edf3' },
  addFriendBtn: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addFriendText: { color: '#fff', fontWeight: '600' },
  removeFriendBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  removeFriendText: { color: '#fff', fontWeight: '600' },

  // Finance tables and chart
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1f2a36', marginTop: 8 },
  tableHeaderCell: { fontSize: 12, fontWeight: '700', color: '#e6edf3' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1f2a36' },
  tableCell: { fontSize: 12, color: '#e6edf3' },
  barRow: { width: '100%', height: 10, backgroundColor: '#1b2430', borderRadius: 6, marginTop: 6, overflow: 'hidden' },
  barLabel: { fontSize: 12, color: '#9fb0c0', marginTop: 2 },

  // Profile modal
  profileModalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  profileModal: { width: '90%', maxWidth: 500, borderRadius: 12, borderWidth: 1, padding: 16, backgroundColor: '#fff' },
});


