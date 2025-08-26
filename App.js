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
    { id: 2, nickname: 'StockMaster', password: 'demo', bio: 'Growth & AI plays', avatar: '', friends: [1] },
  ]));
  const [currentUserId, setCurrentUserId] = useState(() => storage.get('currentUserId', null));
  // Supabase auth session (email/password)
  const [supaAuth, setSupaAuth] = useState(() => storage.get('supaAuth', null));
  useEffect(() => storage.set('supaAuth', supaAuth), [supaAuth]);
  // Local overlay profiles for Supabase users
  const [supaProfiles, setSupaProfiles] = useState(() => storage.get('supaProfiles', {})); // { [supaUserId]: { nickname, bio, avatar, friends: number[] } }
  useEffect(() => storage.set('supaProfiles', supaProfiles), [supaProfiles]);
  // Theme
  const [appTheme, setAppTheme] = useState(() => storage.get('appTheme', 'light'));
  useEffect(() => storage.set('appTheme', appTheme), [appTheme]);
  const isDark = appTheme === 'dark';
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
    notes: ''
  });
  const [closeDrafts, setCloseDrafts] = useState({}); // tradeId -> { qty, price }

  // Calendar state
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [newsCountry, setNewsCountry] = useState('US,EU,CN');
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
    title: '',
    notes: '',
    remindBefore: 30,
  });

  // Community state
  const [posts, setPosts] = useState(() => storage.get('posts', [
    { id: 1, userId: 1, title: 'BTC: лонг после закрепления', content: 'BTC: лонг после закрепления над ключевым уровнем. Риск 1%.', market: 'Crypto', likes: [2], comments: [{ id: 1, userId: 2, text: 'Согласен!', date: '2025-01-20' }] },
    { id: 2, userId: 2, title: 'NVDA анализ', content: 'NVDA показывает признаки разворота. Рассматриваю вход на откате.', market: 'Stocks', likes: [], comments: [] },
  ]));
  const [newPost, setNewPost] = useState({ title: '', content: '', market: 'Crypto', images: [] });
  const [commentDrafts, setCommentDrafts] = useState({}); // postId -> text

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
    const trade = {
      id: trades.length ? Math.max(...trades.map(t => t.id)) + 1 : 1,
      userId: currentUser.id,
      ...newTrade,
      qty: qtyN,
      price: priceN,
      remainingQty: qtyN,
      closures: []
    };
    setTrades(prev => [trade, ...prev]);
    // Ensure the new trade is visible in the list regardless of current filters
    setFilterMarket('All');
    setFilterStyle('All');
    Alert.alert('Готово', 'Сделка добавлена');
    setNewTrade({ asset: '', side: 'BUY', qty: '', price: '', market: 'Crypto', style: 'Скальпинг', date: new Date().toISOString().slice(0,10), notes: '' });
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

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatCurrencyCustom = (value, currency) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
    } catch {
      return `${Number(value || 0).toFixed(2)} ${currency || ''}`.trim();
    }
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
  const refreshNews = async () => {
    setNewsLoading(true);
    setNewsError('');
    try {
      const now = new Date();
      const d1 = formatDate(now);
      const d2 = formatDate(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14));
      const countries = normalizeCountries(newsCountry);
      const importance = selectedImportanceList();
      // Use your TE key:secret provided by the user
      let TE_C = 'e4cd3fef8e944b6:fjav7sp40q39exh';
      const params = new URLSearchParams({ c: TE_C, format: 'json', d1, d2 });
      if (countries) params.set('country', countries);
      if (importance) params.set('importance', importance);
      const url = `https://api.tradingeconomics.com/calendar?${params.toString()}`;
      let res = await fetch(url);
      // If unauthorized/forbidden, retry with guest:guest
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        TE_C = 'guest:guest';
        const p2 = new URLSearchParams({ c: TE_C, format: 'json', d1, d2 });
        if (countries) p2.set('country', countries);
        if (importance) p2.set('importance', importance);
        const url2 = `https://api.tradingeconomics.com/calendar?${p2.toString()}`;
        res = await fetch(url2);
      }
      // If still not ok, try without optional filters
      if (!res.ok) {
        const p3 = new URLSearchParams({ c: TE_C, format: 'json', d1, d2 });
        const url3 = `https://api.tradingeconomics.com/calendar?${p3.toString()}`;
        res = await fetch(url3);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json) ? json : [];
      const mapped = items.map((it, idx) => {
        const dt = it.Date || it.DateUtc || it.DateISO || it.date;
        const dObj = dt ? new Date(dt) : null;
        const dateStr = dObj ? dObj.toISOString().slice(0, 10) : (it.Date || '').slice(0, 10);
        const timeStr = dObj ? dObj.toISOString().slice(11, 16) : (it.Time || '').slice(0, 5);
        const level = mapImportanceLabelToLevel(it.Importance || it.importance);
        return {
          id: `${it.EventId || it.Id || idx}-${dateStr}`,
          date: dateStr,
          time: timeStr,
          country: it.Country || it.CountryName || '—',
          title: it.Event || it.Category || it.Title || 'Событие',
          importance: level,
        };
      }).filter(it => importanceFilters[it.importance]);
      setNews(mapped);
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
  }, [newsCountry, importanceFilters]);

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
      const cur = prev[currentUser.id] || { debts: [], emergencyTx: [], investTx: [], incomeDays: [] };
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
      return { ...cur, debts };
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
      const debts = (cur.debts || []).map(d => d.id === debtId ? { ...d, amount: Math.max(0, (d.amount || 0) - draft) } : d).filter(d => (d.amount || 0) > 0);
      return { ...cur, debts };
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
      const debts = (cur.debts || []).filter(d => d.id !== debtId);
      return { ...cur, debts };
    });
    if (supaConfigured && currentSupaUser) {
      (async () => {
        try {
          await fetch(supaUrl(`/finance_debts?id=eq.${encodeURIComponent(debtId)}`), { method: 'DELETE', headers: supaAuthHeadersWithSession() });
        } catch {}
      })();
    }
  };

  const addEmergencyTransaction = () => {
    const amount = Number(newEmergencyTx.amount) || 0;
    if (amount <= 0) return Alert.alert('Ошибка', 'Введите сумму > 0');
    const entry = { id: Date.now(), date: new Date().toISOString().slice(0,10), ...newEmergencyTx, amount };
    withFinance(cur => ({ ...cur, emergencyTx: [entry, ...(cur.emergencyTx || [])] }));
    // Keep existing cashReserve state updated
    setCashReserve(prev => newEmergencyTx.type === 'deposit' ? prev + amount : Math.max(0, prev - amount));
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

  const addInvestTransaction = () => {
    const amount = Number(newInvestTx.amount) || 0;
    if (amount <= 0) return Alert.alert('Ошибка', 'Введите сумму > 0');
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

  return (
    <View style={[styles.container, isDark ? { backgroundColor: '#0b0f14' } : null]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, isDark ? { backgroundColor: '#121820', borderBottomColor: '#1f2a36' } : null]}>
        <Text style={[styles.title, isDark ? { color: '#e6edf3' } : null]}>Trader's Hub</Text>
        <View style={styles.topBar}>
          <View style={[styles.tabContainer, isDark ? { backgroundColor: '#1b2430' } : null]}>
            {[
              { key: 'finance', label: 'Финансы' },
              { key: 'journal', label: 'Дневник' },
              { key: 'calendar', label: 'Календари' },
              { key: 'community', label: 'Сообщество' },
              { key: 'achievements', label: 'Достижения' },
              { key: 'profile', label: 'Профиль' },
            ].map(({ key, label }) => (
              <Pressable key={key} style={[styles.tab, tab === key ? styles.activeTab : styles.inactiveTab]} onPress={() => setTab(key)}>
                <Text style={[styles.tabText, tab === key ? styles.activeTabText : (isDark ? { color: '#9fb0c0' } : styles.inactiveTabText)]}>{label}</Text>
              </Pressable>
            ))}
          </View>
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
        {tab === 'finance' && (
          <>
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

            {/* Emergency Fund */}
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>🛡️ Подушка безопасности</Text>
              <Text style={styles.cardDescription}>Резерв на непредвиденные расходы</Text>
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

            {/* Debts */}
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>🔻 Долги</Text>
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы управлять долгами</Text>}
              {currentUser && (
                <>
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
                      </View>
                    </View>
                  ))}
                  {(sortedDebts || []).length === 0 && <Text style={styles.noteText}>Нет долгов</Text>}
                </>
              )}
            </View>

            {/* Emergency Fund Transactions */}
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
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Где расположено</Text>
                      <TextInput style={styles.input} value={newEmergencyTx.location} onChangeText={(t) => setNewEmergencyTx(v => ({ ...v, location: t }))} placeholder="Банк, брокер, наличка..." />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Заметка</Text>
                      <TextInput style={styles.input} value={newEmergencyTx.note} onChangeText={(t) => setNewEmergencyTx(v => ({ ...v, note: t }))} placeholder="Комментарий" />
                    </View>
                  </View>
                  <Pressable style={styles.addButton} onPress={addEmergencyTransaction}><Text style={styles.addButtonText}>Добавить</Text></Pressable>

                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Дата</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Тип</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Сумма</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Где</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Заметка</Text>
                  </View>
                  {(currentFinance?.emergencyTx || []).map(tx => (
                    <View key={tx.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.type === 'deposit' ? 'Пополнение' : 'Изъятие'}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{formatCurrencyCustom(tx.amount, tx.currency)}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.location || '—'}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{tx.note || '—'}</Text>
                    </View>
                  ))}
                  {(currentFinance?.emergencyTx || []).length === 0 && <Text style={styles.noteText}>Пока нет транзакций</Text>}
                </>
              )}
            </View>

            {/* Investment Capital */}
            <View style={[styles.card, isDark ? { backgroundColor: '#121820' } : null]}>
              <Text style={styles.cardTitle}>💹 Инвестиционный капитал</Text>
              <Text style={styles.cardDescription}>Баланс: {formatCurrencyCustom(investmentBalance, (currentFinance?.investTx?.[0]?.currency) || 'USD')}</Text>
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
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Куда конкретно</Text>
                      <TextInput style={styles.input} value={newInvestTx.destination} onChangeText={(t) => setNewInvestTx(v => ({ ...v, destination: t }))} placeholder="Счёт брокера, стратегия..." />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Заметка</Text>
                      <TextInput style={styles.input} value={newInvestTx.note} onChangeText={(t) => setNewInvestTx(v => ({ ...v, note: t }))} placeholder="Комментарий" />
                    </View>
                  </View>
                  <Pressable style={styles.addButton} onPress={addInvestTransaction}><Text style={styles.addButtonText}>Добавить</Text></Pressable>

                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Дата</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Тип</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Сумма</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Куда</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Заметка</Text>
                  </View>
                  {(currentFinance?.investTx || []).map(tx => (
                    <View key={tx.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{tx.type === 'in' ? 'Ввод' : 'Вывод'}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{formatCurrencyCustom(tx.amount, tx.currency)}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{tx.destination || '—'}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{tx.note || '—'}</Text>
                    </View>
                  ))}
                  {(currentFinance?.investTx || []).length === 0 && <Text style={styles.noteText}>Пока нет транзакций</Text>}
                </>
              )}
            </View>

            
          </>
        )}

        {tab === 'journal' && (
          <>
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
          </>
        )}

        {tab === 'calendar' && (
          <>
            {/* News */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📰 Календарь новостей</Text>
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
                <View style={[styles.inputGroup, { flex: 1, justifyContent: 'flex-end' }]}>
                  <Pressable style={styles.addButton} onPress={refreshNews}><Text style={styles.addButtonText}>Обновить</Text></Pressable>
                </View>
              </View>

              {newsLoading && <Text style={styles.noteText}>Загрузка…</Text>}
              {!!newsError && <Text style={[styles.noteText, { color: '#ef4444' }]}>{newsError}</Text>}

              <View style={styles.newsList}>
                {news.map((item) => (
                  <View key={item.id} style={styles.newsItem}>
                    <View style={styles.newsHeader}>
                      <Text style={styles.newsDate}>{item.date}</Text>
                      <Text style={styles.newsTime}>{item.time}</Text>
                      <Text style={styles.newsCountry}>{item.country}</Text>
                    </View>
                    <Text style={styles.newsTitle}>{item.title}</Text>
                    <Text style={styles.newsImportance}>{getImportanceStars(item.importance)}</Text>
                  </View>
                ))}
                {(!newsLoading && news.length === 0) && <Text style={styles.noteText}>Нет событий по выбранным фильтрам</Text>}
              </View>
              <Text style={styles.noteText}>Источник: TradingEconomics (guest:guest). Для продакшена используйте собственные ключи/API.</Text>
            </View>

            {/* Workouts */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💪 Дневник тренировок</Text>
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы добавлять тренировки</Text>}
              {/* Recurring generator */}
              {currentUser && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.filterLabel}>Повторяющиеся тренировки</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Стартовая дата</Text>
                      <TextInput style={styles.input} value={recurring.startDate} onChangeText={(t) => setRecurring(v => ({ ...v, startDate: t }))} placeholder="2025-02-01" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Недели</Text>
                      <TextInput style={styles.input} value={String(recurring.weeks)} onChangeText={(t) => setRecurring(v => ({ ...v, weeks: t }))} keyboardType="numeric" placeholder="4" />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Время</Text>
                      <TextInput style={styles.input} value={recurring.time} onChangeText={(t) => setRecurring(v => ({ ...v, time: t }))} placeholder="18:00" />
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Дни недели</Text>
                      <View style={styles.pickerContainer}>
                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(k => (
                          <Pressable key={k} style={[styles.pickerOption, recurring.days[k] ? styles.pickerOptionActive : null]} onPress={() => setRecurring(v => ({ ...v, days: { ...v.days, [k]: !v.days[k] } }))}>
                            <Text style={[styles.pickerText, recurring.days[k] ? styles.pickerTextActive : null]}>{k}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Тип</Text>
                      <View style={styles.pickerContainer}>
                        {['Кардио', 'Силовая', 'Растяжка'].map(type => (
                          <Pressable key={type} style={[styles.pickerOption, recurring.type === type ? styles.pickerOptionActive : null]} onPress={() => setRecurring(v => ({ ...v, type }))}>
                            <Text style={[styles.pickerText, recurring.type === type ? styles.pickerTextActive : null]}>{type}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Напоминание (мин)</Text>
                      <View style={styles.pickerContainer}>
                        {[15,30,60].map(m => (
                          <Pressable key={m} style={[styles.pickerOption, recurring.remindBefore === m ? styles.pickerOptionActive : null]} onPress={() => setRecurring(v => ({ ...v, remindBefore: m }))}>
                            <Text style={[styles.pickerText, recurring.remindBefore === m ? styles.pickerTextActive : null]}>{m}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Заметки</Text>
                    <TextInput style={styles.input} value={recurring.notes} onChangeText={(t) => setRecurring(v => ({ ...v, notes: t }))} placeholder="Комментарий" />
                  </View>
                  <Pressable style={styles.addButton} onPress={generateRecurringWorkouts}><Text style={styles.addButtonText}>Создать расписание</Text></Pressable>
                </View>
              )}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Дата</Text>
                  <TextInput style={styles.input} value={newWorkout.date} onChangeText={(t) => setNewWorkout(v => ({ ...v, date: t }))} placeholder="2025-01-15" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Время</Text>
                  <TextInput style={styles.input} value={newWorkout.time} onChangeText={(t) => setNewWorkout(v => ({ ...v, time: t }))} placeholder="18:00" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Тип</Text>
                  <View style={styles.pickerContainer}>
                    {['Кардио', 'Силовая', 'Растяжка'].map(type => (
                      <Pressable key={type} style={[styles.pickerOption, newWorkout.type === type ? styles.pickerOptionActive : null]} onPress={() => setNewWorkout(v => ({ ...v, type }))}>
                        <Text style={[styles.pickerText, newWorkout.type === type ? styles.pickerTextActive : null]}>{type}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Напоминание (мин)</Text>
                  <View style={styles.pickerContainer}>
                    {[15,30,60].map(m => (
                      <Pressable key={m} style={[styles.pickerOption, newWorkout.remindBefore === m ? styles.pickerOptionActive : null]} onPress={() => setNewWorkout(v => ({ ...v, remindBefore: m }))}>
                        <Text style={[styles.pickerText, newWorkout.remindBefore === m ? styles.pickerTextActive : null]}>{m}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Заметки</Text>
                <TextInput style={styles.input} value={newWorkout.notes} onChangeText={(t) => setNewWorkout(v => ({ ...v, notes: t }))} placeholder="Спина + бицепс..." />
              </View>
              <Pressable style={styles.addButton} onPress={addWorkout}><Text style={styles.addButtonText}>Добавить тренировку</Text></Pressable>
              <View style={styles.workoutList}>
                {workouts.map((w) => (
                  <View key={w.id} style={styles.workoutItem}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutType}>{w.type}</Text>
                      <Pressable style={styles.deleteButton} onPress={() => deleteWorkout(w.id)}><Text style={styles.deleteButtonText}>×</Text></Pressable>
                    </View>
                    <Text style={styles.workoutDate}>{w.date}</Text>
                    {w.notes ? <Text style={styles.workoutNotes}>{w.notes}</Text> : null}
                  </View>
                ))}
              </View>
            </View>

            {/* Events */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📅 Планер</Text>
              {!currentUser && <Text style={styles.noteText}>Войдите, чтобы добавлять события</Text>}
              {currentUser && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.filterLabel}>Ежедневное напоминание</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Время</Text>
                      <TextInput style={styles.input} value={plannerPrefs.time} onChangeText={(t) => setPlannerPrefs(p => ({ ...p, time: t }))} placeholder="22:00" />
                    </View>
                    {!plannerPrefs.enabled ? (
                      <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end', backgroundColor: '#10b981' }]} onPress={schedulePlannerDaily}><Text style={styles.addButtonText}>Включить</Text></Pressable>
                    ) : (
                      <Pressable style={[styles.addButton, { flex: 1, alignSelf: 'flex-end', backgroundColor: '#ef4444' }]} onPress={cancelPlannerDaily}><Text style={styles.addButtonText}>Отключить</Text></Pressable>
                    )}
                  </View>
                </View>
              )}
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
                  <Text style={styles.label}>Заголовок</Text>
                  <TextInput style={styles.input} value={newEvent.title} onChangeText={(t) => setNewEvent(v => ({ ...v, title: t }))} placeholder="Ревизия портфеля" />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Напоминание (мин)</Text>
                  <View style={styles.pickerContainer}>
                    {[15,30,60].map(m => (
                      <Pressable key={m} style={[styles.pickerOption, newEvent.remindBefore === m ? styles.pickerOptionActive : null]} onPress={() => setNewEvent(v => ({ ...v, remindBefore: m }))}>
                        <Text style={[styles.pickerText, newEvent.remindBefore === m ? styles.pickerTextActive : null]}>{m}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Заметки</Text>
                <TextInput style={[styles.input, styles.textArea]} value={newEvent.notes} onChangeText={(t) => setNewEvent(v => ({ ...v, notes: t }))} placeholder="Перебалансировка 60/40..." multiline numberOfLines={3} />
              </View>
              <Pressable style={styles.addButton} onPress={addEvent}><Text style={styles.addButtonText}>Добавить событие</Text></Pressable>
              {currentUser && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.filterLabel}>Импорт расписания курсов (JSON)</Text>
                  <TextInput style={[styles.input, styles.textArea]} value={courseImportText} onChangeText={setCourseImportText} placeholder='[{"type":"workout","title":"Кардио","date":"2025-02-10","time":"19:00","remindBefore":30}]' multiline numberOfLines={3} />
                  <Pressable style={[styles.addButton, { marginTop: 8 }]} onPress={importCourseSchedule}><Text style={styles.addButtonText}>Импортировать</Text></Pressable>
                </View>
              )}
              <View style={styles.eventList}>
                {events.map((ev) => (
                  <View key={ev.id} style={styles.eventItem}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      <Pressable style={styles.deleteButton} onPress={() => deleteEvent(ev.id)}><Text style={styles.deleteButtonText}>×</Text></Pressable>
                    </View>
                    <Text style={styles.eventDate}>{ev.date}</Text>
                    {ev.notes ? <Text style={styles.eventNotes}>{ev.notes}</Text> : null}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {tab === 'community' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👥 Сообщество трейдеров</Text>
            <Text style={styles.cardDescription}>Публикуйте идеи, лайкайте и комментируйте</Text>

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
              {posts.map((post) => (
                <View key={post.id} style={styles.communityPost}>
                  <View style={styles.postHeader}>
                    <Text style={styles.postUser}>@{userById(post.userId).nickname}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.postMarket}>{post.market}</Text>
                      {currentUser && post.userId === currentUser.id && (
                        <Pressable style={styles.deleteButton} onPress={() => deletePost(post.id)}>
                          <Text style={styles.deleteButtonText}>×</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postContent}>{post.content}</Text>
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

        {tab === 'achievements' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Достижения</Text>
            <Text style={styles.cardDescription}>Отслеживайте ваш прогресс в торговле</Text>
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
          </View>
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

                <Text style={[styles.cardTitle, { marginTop: 12 }]}>Редактирование</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Никнейм</Text>
                    <TextInput style={[styles.input, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={currentUser.nickname} onChangeText={(t) => updateProfile({ nickname: t })} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Аватар</Text>
                    <Pressable style={styles.addButton} onPress={pickAvatarImage}><Text style={styles.addButtonText}>Загрузить фото</Text></Pressable>
                  </View>
                </View>
                <Text style={[styles.cardTitle, { marginTop: 12 }]}>Backend (Supabase)</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>URL</Text>
                    <TextInput style={[styles.input, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={supa.url} onChangeText={(t) => setSupa(v => ({ ...v, url: t }))} placeholder="https://xxxxx.supabase.co" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Anon Key</Text>
                    <TextInput style={[styles.input, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={supa.anonKey} onChangeText={(t) => setSupa(v => ({ ...v, anonKey: t }))} placeholder="eyJ..." />
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bucket</Text>
                    <TextInput style={[styles.input, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={supa.bucket} onChangeText={(t) => setSupa(v => ({ ...v, bucket: t }))} placeholder="public" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Синхронизация</Text>
                    <Pressable style={styles.addButton} onPress={fetchSupaPosts}><Text style={styles.addButtonText}>Обновить посты</Text></Pressable>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>О себе</Text>
                  <TextInput style={[styles.input, styles.textArea, isDark ? { backgroundColor: '#0f1520', color: '#e6edf3', borderColor: '#1f2a36' } : null]} value={currentUser.bio} onChangeText={(t) => updateProfile({ bio: t })} multiline numberOfLines={3} />
                </View>

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

                <Text style={[styles.cardTitle, { marginTop: 12 }]}>Кого добавить</Text>
                <View style={styles.friendsList}>
                  {suggestedUsers.filter(u => !currentUser.friends.includes(u.id) && u.id !== currentUser.id).map(u => (
                    <View key={u.id} style={styles.friendItem}>
                      <Text style={styles.friendName}>@{u.nickname}</Text>
                      <Pressable style={styles.addFriendBtn} onPress={() => addFriend(u.id)}><Text style={styles.addFriendText}>Добавить</Text></Pressable>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tabContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#007AFF' },
  inactiveTab: { backgroundColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  inactiveTabText: { color: '#666' },
  authStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authStatusText: { fontSize: 12, color: '#333' },
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#fff', fontWeight: '600' },

  content: { flex: 1, padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputGroup: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#f9f9f9' },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerContainer: { flexDirection: 'row', gap: 6 },
  pickerOption: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#f0f0f0', alignItems: 'center' },
  pickerOptionActive: { backgroundColor: '#007AFF' },
  pickerText: { fontSize: 12, color: '#666' },
  pickerTextActive: { color: '#fff', fontWeight: '600' },
  resultCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginTop: 8, alignItems: 'center' },
  resultTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  resultValue: { fontSize: 22, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  resultSubtitle: { fontSize: 13, color: '#666' },
  emergencyStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  emergencyBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  emergencyGood: { backgroundColor: '#28a745' },
  emergencyWarning: { backgroundColor: '#ffc107' },
  emergencyText: { fontSize: 13, fontWeight: '600' },
  emergencyTextGood: { color: '#fff' },
  emergencyTextWarning: { color: '#000' },
  emergencyGoal: { fontSize: 13, color: '#666' },
  emergencyRecommendation: { fontSize: 12, color: '#666', marginTop: 6, fontStyle: 'italic' },
  addButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  filterContainer: { marginBottom: 12 },
  filterGroup: { marginBottom: 10 },
  filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 12 },
  statItem: { fontSize: 13, fontWeight: '600', color: '#333' },
  tradeItem: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tradeAsset: { fontSize: 15, fontWeight: 'bold' },
  tradeSide: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12, fontWeight: '600' },
  tradeSideBuy: { backgroundColor: '#d4edda', color: '#155724' },
  tradeSideSell: { backgroundColor: '#f8d7da', color: '#721c24' },
  deleteButton: { backgroundColor: '#dc3545', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tradeDetails: { marginBottom: 4 },
  tradeDetail: { fontSize: 12, color: '#666', marginBottom: 2 },
  tradeNotes: { fontSize: 12, color: '#007AFF', fontStyle: 'italic' },

  newsList: { marginBottom: 8 },
  newsItem: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  newsDate: { fontSize: 12, color: '#666' },
  newsTime: { fontSize: 12, color: '#666' },
  newsCountry: { fontSize: 12, color: '#666' },
  newsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  newsImportance: { fontSize: 12, color: '#ffc107' },
  noteText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  toolbarRow: { flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  workoutList: { marginTop: 8 },
  workoutItem: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  workoutType: { fontSize: 15, fontWeight: 'bold' },
  workoutDate: { fontSize: 12, color: '#666', marginBottom: 2 },
  workoutNotes: { fontSize: 12, color: '#007AFF', fontStyle: 'italic' },

  eventList: { marginTop: 8 },
  eventItem: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  eventTitle: { fontSize: 15, fontWeight: 'bold' },
  eventDate: { fontSize: 12, color: '#666', marginBottom: 2 },
  eventNotes: { fontSize: 12, color: '#007AFF', fontStyle: 'italic' },

  communityGrid: { gap: 12 },
  communityPost: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  postUser: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
  postMarket: { fontSize: 12, backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  postTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  postContent: { fontSize: 14, color: '#333', marginBottom: 8 },
  postActions: { flexDirection: 'row', gap: 10 },
  actionButton: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f8f9fa', borderRadius: 4 },
  actionText: { fontSize: 12, color: '#666' },
  commentItem: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 6 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentMeta: { fontSize: 11, color: '#888', marginBottom: 2 },
  commentText: { fontSize: 13, color: '#333' },
  deleteButtonSmall: { backgroundColor: '#dc3545', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  commentComposer: { marginTop: 8 },

  achievementsGrid: { gap: 12 },
  achievement: { borderRadius: 8, padding: 12, borderWidth: 1 },
  achievementUnlocked: { backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
  achievementLocked: { backgroundColor: '#f8f9fa', borderColor: '#e0e0e0' },
  achievementTitle: { fontSize: 14, fontWeight: '600' },
  achievementDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  achievementDate: { fontSize: 12, color: '#28a745', fontWeight: '600', marginTop: 4 },
  achievementLockedText: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 4 },

  authCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 16, borderWidth: 1, borderColor: '#eee' },
  switchAuth: { marginTop: 8, alignItems: 'center' },
  switchAuthText: { color: '#007AFF', fontSize: 12 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ddd' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: '#555' },
  profileNickname: { fontSize: 16, fontWeight: '700' },
  profileBio: { fontSize: 13, color: '#666' },
  friendsList: { gap: 8, marginTop: 8 },
  friendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  friendName: { fontSize: 13, fontWeight: '600' },
  addFriendBtn: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addFriendText: { color: '#fff', fontWeight: '600' },
  removeFriendBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  removeFriendText: { color: '#fff', fontWeight: '600' },

  // Finance tables and chart
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 8 },
  tableHeaderCell: { fontSize: 12, fontWeight: '700', color: '#333' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
  tableCell: { fontSize: 12, color: '#333' },
  barRow: { width: '100%', height: 10, backgroundColor: '#f0f0f0', borderRadius: 6, marginTop: 6, overflow: 'hidden' },
  barLabel: { fontSize: 12, color: '#666', marginTop: 2 },
});


