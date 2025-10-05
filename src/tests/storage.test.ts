// Storage utilities tests - exact reproduction of current storage behavior
import { storage, STORAGE_KEYS } from '../services/persist/storage';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('storage.get returns parsed value when key exists', () => {
    const testValue = { test: 'value' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(testValue));
    
    const result = storage.get('test-key');
    expect(result).toEqual(testValue);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  test('storage.get returns fallback when key does not exist', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const result = storage.get('nonexistent-key', 'fallback');
    expect(result).toBe('fallback');
  });

  test('storage.get returns fallback when JSON parsing fails', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');
    
    const result = storage.get('invalid-key', 'fallback');
    expect(result).toBe('fallback');
  });

  test('storage.get returns fallback when window is undefined', () => {
    const originalWindow = global.window;
    delete (global as any).window;
    
    const result = storage.get('test-key', 'fallback');
    expect(result).toBe('fallback');
    
    global.window = originalWindow;
  });

  test('storage.set stores value as JSON string', () => {
    const testValue = { test: 'value' };
    
    storage.set('test-key', testValue);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testValue));
  });

  test('storage.set handles errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    expect(() => storage.set('test-key', 'value')).not.toThrow();
  });

  test('storage.set does nothing when window is undefined', () => {
    const originalWindow = global.window;
    delete (global as any).window;
    
    storage.set('test-key', 'value');
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    
    global.window = originalWindow;
  });

  test('storage.remove removes key from localStorage', () => {
    storage.remove('test-key');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
  });

  test('storage.remove handles errors gracefully', () => {
    localStorageMock.removeItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    expect(() => storage.remove('test-key')).not.toThrow();
  });

  test('storage.clear clears localStorage', () => {
    storage.clear();
    expect(localStorageMock.clear).toHaveBeenCalled();
  });

  test('storage.clear handles errors gracefully', () => {
    localStorageMock.clear.mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    expect(() => storage.clear()).not.toThrow();
  });

  test('STORAGE_KEYS contains all expected keys', () => {
    expect(STORAGE_KEYS.SUPA_AUTH).toBe('supaAuth');
    expect(STORAGE_KEYS.SUPA_PROFILES).toBe('supaProfiles');
    expect(STORAGE_KEYS.APP_THEME).toBe('appTheme');
    expect(STORAGE_KEYS.FINANCE_DATA).toBe('financeData');
    expect(STORAGE_KEYS.CUSHION_HISTORY).toBe('cushionHistory');
    expect(STORAGE_KEYS.INVESTMENT_HISTORY).toBe('investmentHistory');
    expect(STORAGE_KEYS.DEBTS_HISTORY).toBe('debtsHistory');
    expect(STORAGE_KEYS.WORKOUTS).toBe('workouts');
    expect(STORAGE_KEYS.EVENTS).toBe('events');
    expect(STORAGE_KEYS.PLANNER_PREFS).toBe('plannerPrefs');
    expect(STORAGE_KEYS.RECURRING).toBe('recurring');
    expect(STORAGE_KEYS.POSTS).toBe('posts');
    expect(STORAGE_KEYS.BOOKMARKS).toBe('bookmarks');
    expect(STORAGE_KEYS.NEWS_CACHE).toBe('newsCache');
    expect(STORAGE_KEYS.NEWS_LAST_FETCH).toBe('newsLastFetch');
    expect(STORAGE_KEYS.TRADES).toBe('trades');
    expect(STORAGE_KEYS.COURSE_IMPORT_TEXT).toBe('courseImportText');
  });
});
