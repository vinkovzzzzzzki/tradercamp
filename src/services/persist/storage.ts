// Local storage utilities
// Exact reproduction of current storage logic

export const storage = {
  get(key: string, fallback: any = null) {
    try {
      if (typeof window === 'undefined') return fallback;
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  
  set(key: string, value: any) {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  
  remove(key: string) {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
    } catch {}
  },
  
  clear() {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.clear();
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
  COURSE_IMPORT_TEXT: 'courseImportText'
} as const;
