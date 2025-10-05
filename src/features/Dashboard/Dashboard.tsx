// Dashboard feature component - exact reproduction of current finance tab structure
import React from 'react';
import { View } from 'react-native';
import { SummaryBalance, SafetyFund, Investments, Debts } from '../../components/finance';
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
  onEmergencyLocationSelect: (location: string) => void;
  onDeleteEmergencyTx: (id: number) => void;
  onNewInvestTxChange: (tx: any) => void;
  onAddInvestmentTransaction: () => void;
  onShowInvestDestinationDropdown: (show: boolean) => void;
  onInvestDestinationSelect: (destination: string) => void;
  onDeleteInvestTx: (id: number) => void;
  onNewDebtChange: (debt: any) => void;
  onAddDebt: () => void;
  onRepayDraftChange: (debtId: number, amount: string) => void;
  onRepayDebt: (debtId: number) => void;
  onDeleteDebt: (debtId: number) => void;
  onDeleteDebtTx: (debtId: number, txId: number) => void;
  getComprehensiveChartData: () => any;
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
    <View>
      {/* Summary chart (compact vertical) */}
      <SummaryBalance
        currentUser={currentUser}
        isDark={isDark}
        chartVisibility={chartVisibility}
        chartTimePeriod={chartTimePeriod}
        cashReserve={cashReserve}
        investmentBalance={investmentBalance}
        sortedDebts={sortedDebts}
        cushionHistory={cushionHistory}
        investmentHistory={investmentHistory}
        debtsHistory={debtsHistory}
        onChartVisibilityChange={onChartVisibilityChange}
        onChartTimePeriodChange={onChartTimePeriodChange}
        onResetAllFinancialData={onResetAllFinancialData}
        getComprehensiveChartData={getComprehensiveChartData}
      />

      {/* Safety Fund */}
      <SafetyFund
        currentUser={currentUser}
        isDark={isDark}
        monthlyExpenses={monthlyExpenses}
        cashReserve={cashReserve}
        emergencyTx={emergencyTx}
        emergencyMonths={emergencyMonths}
        newEmergencyTx={newEmergencyTx}
        showEmergencyLocationDropdown={showEmergencyLocationDropdown}
        emergencyLocations={emergencyLocations}
        onMonthlyExpensesChange={onMonthlyExpensesChange}
        onCashReserveChange={onCashReserveChange}
        onNewEmergencyTxChange={onNewEmergencyTxChange}
        onAddEmergencyTransaction={onAddEmergencyTransaction}
        onShowEmergencyLocationDropdown={onShowEmergencyLocationDropdown}
        onEmergencyLocationSelect={onEmergencyLocationSelect}
        onDeleteEmergencyTx={onDeleteEmergencyTx}
      />

      {/* Investments */}
      <Investments
        currentUser={currentUser}
        isDark={isDark}
        investmentBalance={investmentBalance}
        investTx={investTx}
        investHoldings={investHoldings}
        newInvestTx={newInvestTx}
        showInvestDestinationDropdown={showInvestDestinationDropdown}
        investDestinations={investDestinations}
        onNewInvestTxChange={onNewInvestTxChange}
        onAddInvestmentTransaction={onAddInvestmentTransaction}
        onShowInvestDestinationDropdown={onShowInvestDestinationDropdown}
        onInvestDestinationSelect={onInvestDestinationSelect}
        onDeleteInvestTx={onDeleteInvestTx}
      />

      {/* Debts */}
      <Debts
        currentUser={currentUser}
        isDark={isDark}
        debts={sortedDebts}
        totalDebt={sortedDebts.reduce((sum, d) => sum + (d.amount || 0), 0)}
        newDebt={newDebt}
        repayDrafts={repayDrafts}
        onNewDebtChange={onNewDebtChange}
        onAddDebt={onAddDebt}
        onRepayDraftChange={onRepayDraftChange}
        onRepayDebt={onRepayDebt}
        onDeleteDebt={onDeleteDebt}
        onDeleteDebtTx={onDeleteDebtTx}
      />
    </View>
  );
};

export default Dashboard;
