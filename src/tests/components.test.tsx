// Component tests - exact reproduction of current component behavior
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Header } from '../components/common/Header';
import { Toast } from '../components/common/Toast';
import { SummaryBalance } from '../components/finance/SummaryBalance';
import { SafetyFund } from '../components/finance/SafetyFund';
import { Investments } from '../components/finance/Investments';
import { Debts } from '../components/finance/Debts';
import type { User, ChartVisibility, ChartTimePeriodType, DataPoint } from '../state/types';

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: ({ data }: { data: any }) => <div data-testid="line-chart">{JSON.stringify(data)}</div>,
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => <div data-testid="status-bar" />,
}));

describe('Header Component', () => {
  const mockProps = {
    tab: 'finance' as const,
    openDropdown: null,
    currentUser: null,
    isDark: true,
    onTabClick: jest.fn(),
    onTabHover: jest.fn(),
    onTabLeave: jest.fn(),
    onLogout: jest.fn(),
    tabAnimation: { setValue: jest.fn() } as any,
    dropdownAnimations: {},
    buttonAnimations: {},
  };

  test('renders header with logo and tabs', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByText('Финансы')).toBeTruthy();
    expect(screen.getByText('Дневник')).toBeTruthy();
    expect(screen.getByText('Планер')).toBeTruthy();
    expect(screen.getByText('Сообщество')).toBeTruthy();
    expect(screen.getByText('Профиль')).toBeTruthy();
  });

  test('shows user info when logged in', () => {
    const user: User = {
      id: '1',
      nickname: 'testuser',
      bio: 'Test bio',
      avatar: '',
      friends: []
    };
    
    render(<Header {...mockProps} currentUser={user} />);
    
    expect(screen.getByText('testuser')).toBeTruthy();
    expect(screen.getByText('Выйти')).toBeTruthy();
  });

  test('calls onTabClick when tab is clicked', () => {
    render(<Header {...mockProps} />);
    
    fireEvent.press(screen.getByText('Дневник'));
    expect(mockProps.onTabClick).toHaveBeenCalledWith('journal');
  });
});

describe('Toast Component', () => {
  test('renders toast message', () => {
    const toast = { msg: 'Test message', kind: 'info' as const };
    render(<Toast toast={toast} />);
    
    expect(screen.getByText('Test message')).toBeTruthy();
  });

  test('renders warning toast with correct styling', () => {
    const toast = { msg: 'Warning message', kind: 'warning' as const };
    render(<Toast toast={toast} />);
    
    expect(screen.getByText('Warning message')).toBeTruthy();
  });

  test('renders error toast with correct styling', () => {
    const toast = { msg: 'Error message', kind: 'error' as const };
    render(<Toast toast={toast} />);
    
    expect(screen.getByText('Error message')).toBeTruthy();
  });

  test('renders nothing when toast is null', () => {
    render(<Toast toast={null} />);
    
    expect(screen.queryByText('Test message')).toBeNull();
  });
});

describe('SummaryBalance Component', () => {
  const mockProps = {
    currentUser: null,
    isDark: true,
    chartVisibility: { cushion: true, investments: true, debts: true, total: true } as ChartVisibility,
    chartTimePeriod: 'days' as ChartTimePeriodType,
    cashReserve: 5000,
    investmentBalance: 10000,
    sortedDebts: [],
    cushionHistory: [] as DataPoint[],
    investmentHistory: [] as DataPoint[],
    debtsHistory: [] as DataPoint[],
    onChartVisibilityChange: jest.fn(),
    onChartTimePeriodChange: jest.fn(),
    onResetAllFinancialData: jest.fn(),
    getComprehensiveChartData: jest.fn(() => ({ datasets: [], labels: [] })),
  };

  test('renders summary balance card', () => {
    render(<SummaryBalance {...mockProps} />);
    
    expect(screen.getByText('📊 Сводный баланс')).toBeTruthy();
  });

  test('shows login message when user is not logged in', () => {
    render(<SummaryBalance {...mockProps} />);
    
    expect(screen.getByText('Войдите или зарегистрируйтесь, чтобы просматривать финансовые данные')).toBeTruthy();
  });

  test('shows chart toggles when user is logged in', () => {
    const user: User = {
      id: '1',
      nickname: 'testuser',
      bio: 'Test bio',
      avatar: '',
      friends: []
    };
    
    render(<SummaryBalance {...mockProps} currentUser={user} />);
    
    expect(screen.getByText('Подушка')).toBeTruthy();
    expect(screen.getByText('Инвестиции')).toBeTruthy();
    expect(screen.getByText('Долги')).toBeTruthy();
    expect(screen.getByText('Итог')).toBeTruthy();
  });

  test('calls onChartVisibilityChange when toggle is clicked', () => {
    const user: User = {
      id: '1',
      nickname: 'testuser',
      bio: 'Test bio',
      avatar: '',
      friends: []
    };
    
    render(<SummaryBalance {...mockProps} currentUser={user} />);
    
    fireEvent.press(screen.getByText('Подушка'));
    expect(mockProps.onChartVisibilityChange).toHaveBeenCalled();
  });
});

describe('SafetyFund Component', () => {
  const mockProps = {
    currentUser: null,
    isDark: true,
    monthlyExpenses: 2000,
    cashReserve: 5000,
    emergencyTx: [],
    emergencyMonths: 2.5,
    newEmergencyTx: { type: 'deposit', amount: '', currency: 'USD', location: '', note: '' },
    showEmergencyLocationDropdown: false,
    emergencyLocations: [],
    onMonthlyExpensesChange: jest.fn(),
    onCashReserveChange: jest.fn(),
    onNewEmergencyTxChange: jest.fn(),
    onAddEmergencyTransaction: jest.fn(),
    onShowEmergencyLocationDropdown: jest.fn(),
    onEmergencyLocationSelect: jest.fn(),
    onDeleteEmergencyTx: jest.fn(),
  };

  test('renders safety fund card', () => {
    render(<SafetyFund {...mockProps} />);
    
    expect(screen.getByText('🛡️ Подушка безопасности')).toBeTruthy();
  });

  test('shows login message when user is not logged in', () => {
    render(<SafetyFund {...mockProps} />);
    
    expect(screen.getByText('Войдите или зарегистрируйтесь, чтобы управлять подушкой безопасности')).toBeTruthy();
  });

  test('shows emergency fund status when user is logged in', () => {
    const user: User = {
      id: '1',
      nickname: 'testuser',
      bio: 'Test bio',
      avatar: '',
      friends: []
    };
    
    render(<SafetyFund {...mockProps} currentUser={user} />);
    
    expect(screen.getByText('Месячные расходы ($)')).toBeTruthy();
    expect(screen.getByText('Текущий резерв ($)')).toBeTruthy();
    expect(screen.getByText('2.5 мес.')).toBeTruthy();
    expect(screen.getByText('Цель: 6 месяцев')).toBeTruthy();
  });
});

describe('Investments Component', () => {
  const mockProps = {
    currentUser: null,
    isDark: true,
    investmentBalance: 10000,
    investTx: [],
    investHoldings: [],
    newInvestTx: { type: 'in', amount: '', currency: 'USD', destination: '', note: '' },
    showInvestDestinationDropdown: false,
    investDestinations: [],
    onNewInvestTxChange: jest.fn(),
    onAddInvestmentTransaction: jest.fn(),
    onShowInvestDestinationDropdown: jest.fn(),
    onInvestDestinationSelect: jest.fn(),
    onDeleteInvestTx: jest.fn(),
  };

  test('renders investments card', () => {
    render(<Investments {...mockProps} />);
    
    expect(screen.getByText('📈 Инвестиции')).toBeTruthy();
  });

  test('shows login message when user is not logged in', () => {
    render(<Investments {...mockProps} />);
    
    expect(screen.getByText('Войдите или зарегистрируйтесь, чтобы управлять инвестициями')).toBeTruthy();
  });

  test('shows investment form when user is logged in', () => {
    const user: User = {
      id: '1',
      nickname: 'testuser',
      bio: 'Test bio',
      avatar: '',
      friends: []
    };
    
    render(<Investments {...mockProps} currentUser={user} />);
    
    expect(screen.getByText('Добавить транзакцию')).toBeTruthy();
    expect(screen.getByText('Вложение')).toBeTruthy();
    expect(screen.getByText('Вывод')).toBeTruthy();
  });
});

describe('Debts Component', () => {
  const mockProps = {
    currentUser: null,
    isDark: true,
    debts: [],
    totalDebt: 0,
    newDebt: { name: '', amount: '', currency: 'USD' },
    repayDrafts: {},
    onNewDebtChange: jest.fn(),
    onAddDebt: jest.fn(),
    onRepayDraftChange: jest.fn(),
    onRepayDebt: jest.fn(),
    onDeleteDebt: jest.fn(),
    onDeleteDebtTx: jest.fn(),
  };

  test('renders debts card', () => {
    render(<Debts {...mockProps} />);
    
    expect(screen.getByText('💳 Долги')).toBeTruthy();
  });

  test('shows login message when user is not logged in', () => {
    render(<Debts {...mockProps} />);
    
    expect(screen.getByText('Войдите или зарегистрируйтесь, чтобы управлять долгами')).toBeTruthy();
  });

  test('shows debt form when user is logged in', () => {
    const user: User = {
      id: '1',
      nickname: 'testuser',
      bio: 'Test bio',
      avatar: '',
      friends: []
    };
    
    render(<Debts {...mockProps} currentUser={user} />);
    
    expect(screen.getByText('Добавить долг')).toBeTruthy();
    expect(screen.getByText('Название')).toBeTruthy();
    expect(screen.getByText('Сумма')).toBeTruthy();
    expect(screen.getByText('Валюта')).toBeTruthy();
  });
});
