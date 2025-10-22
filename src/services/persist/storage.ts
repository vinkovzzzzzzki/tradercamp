// Local storage utilities with React Native AsyncStorage fallback
// Keeps sync API for web; adds async helpers for native

let AsyncStorageRef: any = null;
try {
  // Optional dependency; available on native after installation
  // Using require to avoid bundling issues on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorageRef = require('@react-native-async-storage/async-storage').default;
} catch {}

export const storage = {
  get(key: string, fallback: any = null) {
    try {
      // Web/local env with localStorage
      if (typeof window !== 'undefined' && (window as any).localStorage) {
        const raw = (window as any).localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      }
      // No synchronous storage available (likely React Native) → return fallback
      return fallback;
    } catch {
      return fallback;
    }
  },
  
  set(key: string, value: any) {
    try {
      // Web/local env with localStorage
      if (typeof window !== 'undefined' && (window as any).localStorage) {
        (window as any).localStorage.setItem(key, JSON.stringify(value));
        return;
      }
      // React Native: best-effort async write
      if (AsyncStorageRef) {
        AsyncStorageRef.setItem(key, JSON.stringify(value));
      }
    } catch {}
  },

  async getAsync(key: string, fallback: any = null) {
    try {
      if (AsyncStorageRef) {
        const raw = await AsyncStorageRef.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      }
      // Fallback to sync get if available
      return storage.get(key, fallback);
    } catch {
      return fallback;
    }
  },
  
  async setAsync(key: string, value: any) {
    try {
      if (AsyncStorageRef) {
        await AsyncStorageRef.setItem(key, JSON.stringify(value));
        return;
      }
      storage.set(key, value);
    } catch {}
  },
  
  remove(key: string) {
    try {
      if (typeof window !== 'undefined' && (window as any).localStorage) {
        (window as any).localStorage.removeItem(key);
        return;
      }
      if (AsyncStorageRef) {
        AsyncStorageRef.removeItem(key);
      }
    } catch {}
  },
  
  clear() {
    try {
        if (typeof window !== 'undefined' && (window as any).localStorage) {
          (window as any).localStorage.clear();
          return;
        }
        if (AsyncStorageRef) {
          AsyncStorageRef.clear();
        }
    } catch {}
  }
};

// Storage keys constants
export const STORAGE_KEYS = {
  SUPA_AUTH: 'supaAuth',
  SUPA_PROFILES: 'supaProfiles',
  APP_THEME: 'appTheme',
  FINANCE_DATA: 'financeData',
  CUSHION_HISTORY: 'cushionHistory',
  INVESTMENT_HISTORY: 'investmentHistory',
  DEBTS_HISTORY: 'debtsHistory',
  EMERGENCY_TX: 'emergencyTx',
  INVEST_TX: 'investTx',
  SORTED_DEBTS: 'sortedDebts',
  EMERGENCY_LOCATIONS: 'emergencyLocations',
  INVEST_DESTINATIONS: 'investDestinations',
  WORKOUTS: 'workouts',
  EVENTS: 'events',
  PLANNER_PREFS: 'plannerPrefs',
  RECURRING: 'recurring',
  POSTS: 'posts',
  BOOKMARKS: 'bookmarks',
  NEWS_CACHE: 'newsCache',
  NEWS_LAST_FETCH: 'newsLastFetch',
  TRADES: 'trades',
  COURSE_IMPORT_TEXT: 'courseImportText',
  // UI filter states
  FINANCE_TX_FILTERS: 'financeTxFilters',
  JOURNAL_FILTERS: 'journalFilters'
} as const;
