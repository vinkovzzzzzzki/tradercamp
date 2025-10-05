import '@testing-library/jest-native/extend-expect';

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: ({ data }) => <div data-testid="line-chart">{JSON.stringify(data)}</div>,
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => <div data-testid="status-bar" />,
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { PNG: 'png', JPEG: 'jpeg' },
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn((obj) => obj.web),
}));

// Mock Animated
jest.mock('react-native/Libraries/Animated/Animated', () => ({
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })),
  timing: jest.fn(() => ({
    start: jest.fn(),
  })),
}));

// Mock LayoutAnimation
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  configureNext: jest.fn(),
  create: jest.fn(),
  Types: {},
  Properties: {},
}));

// Mock UIManager
jest.mock('react-native/Libraries/ReactNative/UIManager', () => ({
  setLayoutAnimationEnabledExperimental: jest.fn(),
}));
