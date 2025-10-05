// Dashboard feature component - simplified version
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { 
  User, 
  ChartVisibility, 
  ChartTimePeriodType, 
  DataPoint,
  EmergencyTransaction,
  InvestmentTransaction,
  Debt
} from '../../state/types';

interface DashboardProps {
  currentUser: User | null;
  isDark: boolean;
  chartVisibility: ChartVisibility;
  chartTimePeriod: ChartTimePeriodType;
  cashReserve: number;
  investmentBalance: number;
  monthlyExpenses: number;
  emergencyMonths: number;
  sortedDebts: Debt[];
  cushionHistory: DataPoint[];
  investmentHistory: DataPoint[];
  debtsHistory: DataPoint[];
  emergencyTx: EmergencyTransaction[];
  investTx: InvestmentTransaction[];
  investHoldings: Array<{ destination: string; currency: string; balance: number }>;
  newEmergencyTx: any;
  newInvestTx: any;
  newDebt: any;
  repayDrafts: Record<number, string>;
  showEmergencyLocationDropdown: boolean;
  showInvestDestinationDropdown: boolean;
  emergencyLocations: string[];
  investDestinations: string[];
  onChartVisibilityChange: (visibility: ChartVisibility) => void;
  onChartTimePeriodChange: (period: ChartTimePeriodType) => void;
  onResetAllFinancialData: () => void;
  onMonthlyExpensesChange: (value: number) => void;
  onCashReserveChange: (value: number) => void;
  onNewEmergencyTxChange: (tx: any) => void;
  onAddEmergencyTransaction: () => void;
  onShowEmergencyLocationDropdown: (show: boolean) => void;
  onEmergencyLocationSelect: (location: string, currency: string) => void;
  onDeleteEmergencyTx: (id: number) => void;
  onNewInvestTxChange: (tx: any) => void;
  onAddInvestmentTransaction: () => void;
  onShowInvestDestinationDropdown: (show: boolean) => void;
  onInvestDestinationSelect: (destination: string, currency: string) => void;
  onDeleteInvestTx: (id: number) => void;
  onNewDebtChange: (debt: any) => void;
  onAddDebt: () => void;
  onRepayDraftChange: (drafts: Record<number, string>) => void;
  onRepayDebt: (debtId: number) => void;
  onDeleteDebt: (debtId: number) => void;
  onDeleteDebtTx: (debtId: number, txId: number) => void;
  getComprehensiveChartData: () => { datasets: any[]; labels: string[] };
}

const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  isDark,
  chartVisibility,
  chartTimePeriod,
  cashReserve,
  investmentBalance,
  monthlyExpenses,
  emergencyMonths,
  sortedDebts,
  cushionHistory,
  investmentHistory,
  debtsHistory,
  emergencyTx,
  investTx,
  investHoldings,
  newEmergencyTx,
  newInvestTx,
  newDebt,
  repayDrafts,
  showEmergencyLocationDropdown,
  showInvestDestinationDropdown,
  emergencyLocations,
  investDestinations,
  onChartVisibilityChange,
  onChartTimePeriodChange,
  onResetAllFinancialData,
  onMonthlyExpensesChange,
  onCashReserveChange,
  onNewEmergencyTxChange,
  onAddEmergencyTransaction,
  onShowEmergencyLocationDropdown,
  onEmergencyLocationSelect,
  onDeleteEmergencyTx,
  onNewInvestTxChange,
  onAddInvestmentTransaction,
  onShowInvestDestinationDropdown,
  onInvestDestinationSelect,
  onDeleteInvestTx,
  onNewDebtChange,
  onAddDebt,
  onRepayDraftChange,
  onRepayDebt,
  onDeleteDebt,
  onDeleteDebtTx,
  getComprehensiveChartData
}) => {
  return (
    <View style={[styles.container, isDark ? styles.containerDark : null]}>
      <Text style={[styles.title, isDark ? styles.titleDark : null]}>
        Финансовый дашборд
      </Text>
      
      <View style={[styles.section, isDark ? styles.sectionDark : null]}>
        <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
          Общий баланс
        </Text>
        <Text style={[styles.balance, isDark ? styles.balanceDark : null]}>
          ${(cashReserve + investmentBalance).toLocaleString()}
        </Text>
      </View>

      <View style={[styles.section, isDark ? styles.sectionDark : null]}>
        <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
          Резервный фонд
        </Text>
        <Text style={[styles.amount, isDark ? styles.amountDark : null]}>
          ${cashReserve.toLocaleString()}
        </Text>
        <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          На {emergencyMonths} месяцев расходов
        </Text>
      </View>

      <View style={[styles.section, isDark ? styles.sectionDark : null]}>
        <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
          Инвестиции
        </Text>
        <Text style={[styles.amount, isDark ? styles.amountDark : null]}>
          ${investmentBalance.toLocaleString()}
        </Text>
        <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          {investTx.length} транзакций
        </Text>
      </View>

      <View style={[styles.section, isDark ? styles.sectionDark : null]}>
        <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
          Долги
        </Text>
        <Text style={[styles.amount, isDark ? styles.amountDark : null]}>
          ${sortedDebts.reduce((sum, debt) => sum + debt.amount, 0).toLocaleString()}
        </Text>
        <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          {sortedDebts.length} активных долгов
        </Text>
      </View>

      <View style={[styles.section, isDark ? styles.sectionDark : null]}>
        <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
          Ежемесячные расходы
        </Text>
        <Text style={[styles.amount, isDark ? styles.amountDark : null]}>
          ${monthlyExpenses.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#0d1117',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  titleDark: {
    color: '#f9fafb',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionDark: {
    backgroundColor: '#161b22',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  balanceDark: {
    color: '#34d399',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  amountDark: {
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  subtitleDark: {
    color: '#9ca3af',
  },
});

export default Dashboard;