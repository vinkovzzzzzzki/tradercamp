// Dashboard feature component - exact reproduction of current finance tab structure
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
  onDeleteDebt: (id: number) => void;
  onDeleteDebtTx: (debtId: number, txId: number) => void;
  getComprehensiveChartData: () => { datasets: any[]; labels: string[] };
  totalDebt: number;
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
  getComprehensiveChartData,
}) => {
  const [chartTooltip, setChartTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: null
  });

  // Format currency function
      // Local utility intentionally named differently to avoid clashing with services export
      const formatCurrencyLocal = (value: number, currency: string) => {
        const num = Number(value);
        const cur = (currency || '').toString().trim();
        if (!Number.isFinite(num)) return `0,0${cur ? ' ' + cur : ''}`;
        const sign = num < 0 ? '-' : '';
        const abs = Math.abs(num);
        const fixed = abs.toFixed(10);
        const parts = fixed.split('.');
        const intPart = parts[0] || '0';
        let fracPart = parts[1] || '';
        while (fracPart.endsWith('0')) fracPart = fracPart.slice(0, -1);
        if (fracPart.length === 0) fracPart = '0';
        const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return `${sign}${intWithSpaces},${fracPart}${cur ? ' ' + cur : ''}`;
      };

  // Chart mouse move handler
  const handleChartMouseMove = (event: any) => {
    const chartData = getComprehensiveChartData();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const chartWidth = Dimensions.get('window').width - 60;
    const chartPadding = 40;
    const effectiveWidth = chartWidth - (chartPadding * 2);
    const relativeX = x - chartPadding;
    
    let dataIndex = Math.round((relativeX / effectiveWidth) * (chartData.labels.length - 1));
    dataIndex = Math.max(0, Math.min(dataIndex, chartData.labels.length - 1));
    
    if (dataIndex >= 0 && dataIndex < chartData.labels.length) {
      const label = chartData.labels[dataIndex];
      const values = [];
      
      let datasetIndex = 0;
      if (chartVisibility.cushion && chartData.datasets[datasetIndex]) {
        values.push({
          value: chartData.datasets[datasetIndex].data[dataIndex],
          color: '#3b82f6',
          label: 'Подушка'
        });
        datasetIndex++;
      }
      
      if (chartVisibility.investment && chartData.datasets[datasetIndex]) {
        values.push({
          value: chartData.datasets[datasetIndex].data[dataIndex],
          color: '#10b981',
          label: 'Инвестиции'
        });
        datasetIndex++;
      }
      
      if (chartVisibility.debts && chartData.datasets[datasetIndex]) {
        values.push({
          value: chartData.datasets[datasetIndex].data[dataIndex],
          color: '#ef4444',
          label: 'Долги'
        });
        datasetIndex++;
      }
      
      if (chartVisibility.total && chartData.datasets[datasetIndex]) {
        values.push({
          value: chartData.datasets[datasetIndex].data[dataIndex],
          color: '#a855f7',
          label: 'Итого'
        });
      }
      
      if (values.length > 0) {
        const tooltipWidth = 200;
        const tooltipHeight = 100;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        let tooltipX = event.clientX;
        let tooltipY = event.clientY + 5;
        
        if (tooltipX + tooltipWidth > screenWidth) {
          tooltipX = event.clientX - tooltipWidth - 10;
        }
        
        if (tooltipY + tooltipHeight > screenHeight) {
          tooltipY = event.clientY - tooltipHeight - 10;
        }
        
        setChartTooltip({
          visible: true,
          x: tooltipX,
          y: tooltipY,
          data: { label, values }
        });
      }
    }
  };

  const handleChartLeave = () => {
    setChartTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  // Chart statistics
  const getChartStatistics = () => {
    if (!chartVisibility.cushion || cushionHistory.length < 2) return null;
    
    const values = cushionHistory.map(d => d.amount || 0);
    const current = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;
    
    return {
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      {/* Summary chart (compact vertical) */}
      <SummaryBalance
        isDark={isDark}
        currentUser={currentUser}
        chartVisibility={chartVisibility}
        chartTimePeriod={chartTimePeriod}
        cashReserve={cashReserve}
        investmentBalance={investmentBalance}
        sortedDebts={sortedDebts}
        cushionHistory={cushionHistory}
        investmentHistory={investmentHistory}
        debtsHistory={debtsHistory}
        chartTooltip={chartTooltip}
        onChartVisibilityChange={onChartVisibilityChange}
        onChartTimePeriodChange={onChartTimePeriodChange}
        onChartMouseMove={handleChartMouseMove}
        onChartLeave={handleChartLeave}
        onResetAllFinancialData={onResetAllFinancialData}
        getComprehensiveChartData={getComprehensiveChartData}
        getChartStatistics={getChartStatistics}
            formatCurrencyCustom={formatCurrencyLocal}
      />
      
      {/* Financial management components */}
      <SafetyFund
        cashReserve={cashReserve}
        monthlyExpenses={monthlyExpenses}
        emergencyMonths={emergencyMonths}
        emergencyTx={emergencyTx}
        newEmergencyTx={newEmergencyTx}
        showLocationDropdown={showEmergencyLocationDropdown}
        emergencyLocations={emergencyLocations}
        isDark={isDark}
        onCashReserveChange={onCashReserveChange}
        onMonthlyExpensesChange={onMonthlyExpensesChange}
        onNewEmergencyTxChange={onNewEmergencyTxChange}
        onAddEmergencyTransaction={onAddEmergencyTransaction}
        onShowLocationDropdown={onShowEmergencyLocationDropdown}
        onLocationSelect={onEmergencyLocationSelect}
        onDeleteEmergencyTx={onDeleteEmergencyTx}
      />

      <Investments
        investmentBalance={investmentBalance}
        investTx={investTx}
        investHoldings={investHoldings}
        newInvestTx={newInvestTx}
        showDestinationDropdown={showInvestDestinationDropdown}
        investDestinations={investDestinations}
        isDark={isDark}
        onNewInvestTxChange={onNewInvestTxChange}
        onAddInvestmentTransaction={onAddInvestmentTransaction}
        onShowDestinationDropdown={onShowInvestDestinationDropdown}
        onDestinationSelect={onInvestDestinationSelect}
        onDeleteInvestTx={onDeleteInvestTx}
      />

      <Debts
        sortedDebts={sortedDebts}
        newDebt={newDebt}
        repayDrafts={repayDrafts}
        totalDebt={totalDebt}
        isDark={isDark}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  darkContainer: {
    backgroundColor: '#0b0f14',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#121820',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  cardTitleDark: {
    color: '#e6edf3',
  },
  text: {
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 8,
  },
  darkText: {
    color: '#e6edf3',
  },
});

export default Dashboard;