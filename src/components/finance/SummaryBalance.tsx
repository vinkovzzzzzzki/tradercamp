// Summary Balance component - exact reproduction of current summary balance structure
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import type { ChartVisibility, ChartTimePeriodType, DataPoint } from '../../state/types';
import { formatCurrencyCustom } from '../../services/format';
import { calculateTotalDebt, calculateNetWorth } from '../../services/calc';

interface SummaryBalanceProps {
  currentUser: any;
  isDark: boolean;
  chartVisibility: ChartVisibility;
  chartTimePeriod: ChartTimePeriodType;
  cashReserve: number;
  investmentBalance: number;
  sortedDebts: any[];
  cushionHistory: DataPoint[];
  investmentHistory: DataPoint[];
  debtsHistory: DataPoint[];
  onChartVisibilityChange: (visibility: ChartVisibility) => void;
  onChartTimePeriodChange: (period: ChartTimePeriodType) => void;
  onResetAllFinancialData: () => void;
  getComprehensiveChartData: () => any;
}

const SummaryBalance: React.FC<SummaryBalanceProps> = ({
  currentUser,
  isDark,
  chartVisibility,
  chartTimePeriod,
  cashReserve,
  investmentBalance,
  sortedDebts,
  cushionHistory,
  investmentHistory,
  debtsHistory,
  onChartVisibilityChange,
  onChartTimePeriodChange,
  onResetAllFinancialData,
  getComprehensiveChartData
}) => {
  const totalDebt = calculateTotalDebt(sortedDebts || []);
  const delta = calculateNetWorth(cashReserve, investmentBalance, totalDebt, 0);

  const visibleValues = [];
  if (chartVisibility.cushion) visibleValues.push(cashReserve);
  if (chartVisibility.investments) visibleValues.push(investmentBalance);
  if (chartVisibility.debts) visibleValues.push(totalDebt);
  if (chartVisibility.total) visibleValues.push(delta);
  const maxVal = Math.max(...visibleValues, 1);

  const setChartVisibilitySafe = (updater: (prev: ChartVisibility) => ChartVisibility) => {
    onChartVisibilityChange(updater(chartVisibility));
  };

  return (
    <View style={[
      { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
      isDark ? { backgroundColor: '#121820' } : null
    ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' }}>📊 Сводный баланс</Text>
        {currentUser && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable 
              style={[
                { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1b2430', borderWidth: 1, borderColor: '#1f2a36' },
                chartVisibility.cushion ? { backgroundColor: '#1f6feb', borderColor: '#1f6feb' } : null
              ]} 
              onPress={() => setChartVisibilitySafe(v => ({ ...v, cushion: !v.cushion }))}
            >
              <Text style={[
                { fontSize: 10, color: '#9fb0c0' },
                chartVisibility.cushion ? { color: '#fff', fontWeight: '600' } : null
              ]}>Подушка</Text>
            </Pressable>
            <Pressable 
              style={[
                { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1b2430', borderWidth: 1, borderColor: '#1f2a36' },
                chartVisibility.investments ? { backgroundColor: '#1f6feb', borderColor: '#1f6feb' } : null
              ]} 
              onPress={() => setChartVisibilitySafe(v => ({ ...v, investments: !v.investments }))}
            >
              <Text style={[
                { fontSize: 10, color: '#9fb0c0' },
                chartVisibility.investments ? { color: '#fff', fontWeight: '600' } : null
              ]}>Инвестиции</Text>
            </Pressable>
            <Pressable 
              style={[
                { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1b2430', borderWidth: 1, borderColor: '#1f2a36' },
                chartVisibility.debts ? { backgroundColor: '#1f6feb', borderColor: '#1f6feb' } : null
              ]} 
              onPress={() => setChartVisibilitySafe(v => ({ ...v, debts: !v.debts }))}
            >
              <Text style={[
                { fontSize: 10, color: '#9fb0c0' },
                chartVisibility.debts ? { color: '#fff', fontWeight: '600' } : null
              ]}>Долги</Text>
            </Pressable>
            <Pressable 
              style={[
                { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1b2430', borderWidth: 1, borderColor: '#1f2a36' },
                chartVisibility.total ? { backgroundColor: '#1f6feb', borderColor: '#1f6feb' } : null
              ]} 
              onPress={() => setChartVisibilitySafe(v => ({ ...v, total: !v.total }))}
            >
              <Text style={[
                { fontSize: 10, color: '#9fb0c0' },
                chartVisibility.total ? { color: '#fff', fontWeight: '600' } : null
              ]}>Итог</Text>
            </Pressable>
          </View>
        )}
      </View>
      
      {currentUser ? (
        <>
          <View style={{ maxWidth: 500, alignSelf: 'center', width: '100%' }}>
            {/* Time period selector */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {['days', 'weeks', 'months'].map(period => (
                <Pressable
                  key={period}
                  style={[
                    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1b2430', borderWidth: 1, borderColor: '#1f2a36' },
                    chartTimePeriod === period ? { backgroundColor: '#1f6feb', borderColor: '#1f6feb' } : null
                  ]}
                  onPress={() => onChartTimePeriodChange(period as ChartTimePeriodType)}
                >
                  <Text style={[
                    { fontSize: 12, color: '#9fb0c0', fontWeight: '500' },
                    chartTimePeriod === period ? { color: '#fff', fontWeight: '600' } : null
                  ]}>
                    {period === 'days' ? 'Дни' : period === 'weeks' ? 'Недели' : 'Месяцы'}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#ef4444' }}
                onPress={onResetAllFinancialData}
              >
                <Text style={{ fontSize: 12, color: '#fff', fontWeight: '500' }}>Сброс</Text>
              </Pressable>
            </View>
            
            {/* Comprehensive line chart with all metrics */}
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              {(() => {
                const chartData = getComprehensiveChartData();
                
                // Show message when no data is visible
                if (chartData.datasets.length === 0) {
                  return (
                    <View style={{ 
                      width: Dimensions.get('window').width - 60, 
                      height: 220, 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      backgroundColor: '#1a1a1a', 
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: '#1f2a36'
                    }}>
                      <Text style={{ 
                        fontSize: 14, 
                        color: '#9fb0c0', 
                        textAlign: 'center',
                        paddingHorizontal: 20
                      }}>
                        Выберите хотя бы одну метрику для отображения
                      </Text>
                    </View>
                  );
                }
                
                return (
                  <View 
                    style={{ position: 'relative' }}
                    onMouseMove={(event) => {
                      // Simple hover detection for chart area
                      const rect = event.currentTarget.getBoundingClientRect();
                      const x = event.clientX - rect.left;
                      const y = event.clientY - rect.top;
                      
                      // Calculate precise data point based on mouse position
                      const chartWidth = Dimensions.get('window').width - 60;
                      const dataIndex = Math.round((x / chartWidth) * (chartData.labels.length - 1));
                      
                      if (dataIndex >= 0 && dataIndex < chartData.labels.length) {
                        const tooltipData = {
                          date: chartData.labels[dataIndex],
                          values: chartData.datasets.map(dataset => ({
                            label: dataset.legend,
                            value: dataset.data[dataIndex],
                            color: dataset.color
                          }))
                        };
                        
                        // Show tooltip logic would go here
                      }
                    }}
                  >
                    <LineChart
                      data={chartData}
                      width={Dimensions.get('window').width - 60}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#1a1a1a',
                        backgroundGradientFrom: '#1a1a1a',
                        backgroundGradientTo: '#1a1a1a',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: '4' },
                        propsForBackgroundLines: { strokeDasharray: '' }
                      }}
                      bezier
                      style={{ borderRadius: 16 }}
                    />
                  </View>
                );
              })()}
            </View>
          </View>
        </>
      ) : (
        <Text style={{ fontSize: 12, color: '#9fb0c0', fontStyle: 'italic' }}>
          Войдите или зарегистрируйтесь, чтобы просматривать финансовые данные
        </Text>
      )}
    </View>
  );
};

export default SummaryBalance;
