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

export default storage;
