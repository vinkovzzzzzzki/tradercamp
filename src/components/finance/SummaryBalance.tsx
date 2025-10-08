// SummaryBalance component - exact reproduction of original functionality
import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { ChartVisibility, ChartTimePeriodType, DataPoint } from '../../state/types';

interface SummaryBalanceProps {
  isDark: boolean;
  currentUser: any;
  chartVisibility: ChartVisibility;
  chartTimePeriod: ChartTimePeriodType;
  cashReserve: number;
  investmentBalance: number;
  sortedDebts: any[];
  cushionHistory: DataPoint[];
  investmentHistory: DataPoint[];
  debtsHistory: DataPoint[];
  chartTooltip: any;
  onChartVisibilityChange: (visibility: ChartVisibility) => void;
  onChartTimePeriodChange: (period: ChartTimePeriodType) => void;
  onChartMouseMove: (event: any) => void;
  onChartLeave: () => void;
  onResetAllFinancialData: () => void;
  getComprehensiveChartData: () => any;
  getChartStatistics: () => any;
  formatCurrencyCustom: (value: number, currency: string) => string;
}

const SummaryBalance: React.FC<SummaryBalanceProps> = ({
  isDark,
  currentUser,
  chartVisibility,
  chartTimePeriod,
  cashReserve,
  investmentBalance,
  sortedDebts,
  cushionHistory,
  investmentHistory,
  debtsHistory,
  chartTooltip,
  onChartVisibilityChange,
  onChartTimePeriodChange,
  onChartMouseMove,
  onChartLeave,
  onResetAllFinancialData,
  getComprehensiveChartData,
  getChartStatistics,
  formatCurrencyCustom
}) => {
  // Match commit e6bcf81: clamp chart width and center layout
  const chartWidth = Math.min(Dimensions.get('window').width - 60, 500);
  const setChartVisibilitySafe = (updater: (v: ChartVisibility) => ChartVisibility) => {
    onChartVisibilityChange(updater(chartVisibility));
  };

  return (
    <View style={[styles.card, isDark ? styles.cardDark : null]}>
      <View style={styles.compactSummaryHeader}>
        <Text style={styles.cardTitle}>💰 Сводный баланс</Text>
        <View style={styles.compactToggles}>
          <Pressable 
            style={[styles.compactToggle, chartVisibility.cushion ? styles.compactToggleActive : null]} 
            onPress={() => setChartVisibilitySafe(v => ({ ...v, cushion: !v.cushion }))}
          >
            <Text style={[styles.compactToggleText, chartVisibility.cushion ? styles.compactToggleTextActive : null]}>Подушка</Text>
          </Pressable>
          <Pressable 
            style={[styles.compactToggle, chartVisibility.investments ? styles.compactToggleActive : null]} 
            onPress={() => setChartVisibilitySafe(v => ({ ...v, investments: !v.investments }))}
          >
            <Text style={[styles.compactToggleText, chartVisibility.investments ? styles.compactToggleTextActive : null]}>Инвестиции</Text>
          </Pressable>
          <Pressable 
            style={[styles.compactToggle, chartVisibility.debts ? styles.compactToggleActive : null]} 
            onPress={() => setChartVisibilitySafe(v => ({ ...v, debts: !v.debts }))}
          >
            <Text style={[styles.compactToggleText, chartVisibility.debts ? styles.compactToggleTextActive : null]}>Долги</Text>
          </Pressable>
          <Pressable 
            style={[styles.compactToggle, chartVisibility.total ? styles.compactToggleActive : null]} 
            onPress={() => setChartVisibilitySafe(v => ({ ...v, total: !v.total }))}
          >
            <Text style={[styles.compactToggleText, chartVisibility.total ? styles.compactToggleTextActive : null]}>Итого</Text>
          </Pressable>
        </View>
      </View>
      
      <>
        {(() => {
            const totalDebt = (sortedDebts || []).reduce((s, d) => s + (d.amount || 0), 0);
            const cushion = cashReserve;
            const invest = investmentBalance;
            const delta = cushion + invest - totalDebt;
            
            const visibleValues = [] as number[];
            if (chartVisibility.cushion) visibleValues.push(cushion);
            if (chartVisibility.investments) visibleValues.push(invest);
            if (chartVisibility.debts) visibleValues.push(totalDebt);
            if (chartVisibility.total) visibleValues.push(delta);
            const maxVal = Math.max(...visibleValues, 1);
            
            return (
              <View style={styles.chartContainer}>
                {/* Time period selector */}
                <View style={styles.timePeriodSelector}>
                  {['days', 'weeks', 'months'].map(period => (
                    <Pressable
                      key={period}
                      style={[
                        styles.timePeriodButton,
                        chartTimePeriod === period ? styles.timePeriodButtonActive : null
                      ]}
                      onPress={() => onChartTimePeriodChange(period as ChartTimePeriodType)}
                    >
                      <Text style={[
                        styles.timePeriodText,
                        chartTimePeriod === period ? styles.timePeriodTextActive : null
                      ]}>
                        {period === 'days' ? 'Дни' : period === 'weeks' ? 'Недели' : 'Месяцы'}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    style={[styles.timePeriodButton, styles.timePeriodButtonActive]}
                    onPress={onResetAllFinancialData}
                  >
                    <Text style={[styles.timePeriodText, styles.timePeriodTextActive]}>Сброс</Text>
                  </Pressable>
                </View>
                
                {/* Comprehensive line chart with all metrics */}
                <View style={styles.lineChartContainer}>
                  {(() => {
                    const chartData = getComprehensiveChartData();
                    
                    // Show message when no data is visible
                    if (chartData.datasets.length === 0) {
                      return (
                        <View style={styles.emptyChartContainer}>
                          <Text style={styles.emptyChartText}>
                            Выберите хотя бы одну метрику для отображения
                          </Text>
                        </View>
                      );
                    }
                    
                    return (
              <View 
                        style={styles.chartWrapper}
                      >
                        <LineChart
                          data={chartData}
                          width={chartWidth}
                          height={220}
                          chartConfig={{
                            backgroundColor: isDark ? '#121820' : '#ffffff',
                            backgroundGradientFrom: isDark ? '#121820' : '#ffffff',
                            backgroundGradientTo: isDark ? '#121820' : '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => isDark ? `rgba(230, 237, 243, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                            labelColor: (opacity = 1) => isDark ? `rgba(230, 237, 243, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                            style: {
                              borderRadius: 16
                            },
                            propsForDots: {
                              r: "4",
                              strokeWidth: "2"
                            }
                          }}
                          bezier
                          style={styles.lineChart}
                          fromZero={false}
                        />
                      </View>
                    );
                  })()}
                </View>
                
                {/* Chart tooltip */}
                {chartTooltip.visible && chartTooltip.data && (
                  <View 
                    style={[
                      styles.chartTooltip,
                      {
                        left: chartTooltip.x,
                        top: chartTooltip.y,
                        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                        borderColor: isDark ? '#1f2a36' : '#e5e7eb'
                      }
                    ]}
                  >
                    {/* Tooltip arrow pointing to cursor */}
                    <View style={[
                      styles.tooltipArrow,
                      {
                        borderTopColor: isDark ? '#1a1a1a' : '#ffffff',
                        borderBottomColor: isDark ? '#1a1a1a' : '#ffffff'
                      }
                    ]} />
                    
                    <Text style={[styles.tooltipTitle, { color: isDark ? '#e6edf3' : '#1f2937' }]}>
                      {chartTooltip.data.label}
                    </Text>
                    {chartTooltip.data.values && chartTooltip.data.values.map((item: any, index: number) => (
                      <View key={index} style={styles.tooltipRow}>
                        <View style={[styles.tooltipColor, { backgroundColor: item.color }]} />
                        <Text style={[styles.tooltipText, { color: isDark ? '#e6edf3' : '#1f2937' }]}>
                          {item.label}: {formatCurrencyCustom(item.value, 'USD')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Chart legend */}
                <View style={styles.chartLegend}>
                  <View style={styles.legendRow}>
                    {chartVisibility.cushion && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
                        <Text style={styles.legendText}>Подушка безопасности</Text>
                      </View>
                    )}
                    {chartVisibility.investments && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.legendText}>Инвестиции</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.legendRow}>
                    {chartVisibility.debts && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                        <Text style={styles.legendText}>Долги</Text>
                      </View>
                    )}
                    {chartVisibility.total && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#a855f7' }]} />
                        <Text style={styles.legendText}>Итоговый баланс</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Statistics */}
                {getChartStatistics() && (
                  <View style={styles.chartStatistics}>
                    <Text style={styles.statisticsTitle}>Статистика подушки безопасности</Text>
                    <View style={styles.statisticsGrid}>
                      <View style={styles.statisticItem}>
                        <Text style={styles.statisticLabel}>Изменение</Text>
                        <Text style={[
                          styles.statisticValue,
                          { color: getChartStatistics().trend === 'up' ? '#10b981' : 
                                   getChartStatistics().trend === 'down' ? '#ef4444' : '#9fb0c0' }
                        ]}>
                          {getChartStatistics().change > 0 ? '+' : ''}{formatCurrencyCustom(getChartStatistics().change, 'USD')}
                          {' '}({getChartStatistics().changePercent > 0 ? '+' : ''}{getChartStatistics().changePercent.toFixed(1)}%)
                        </Text>
                      </View>
                      <View style={styles.statisticItem}>
                        <Text style={styles.statisticLabel}>Среднее</Text>
                        <Text style={styles.statisticValue}>{formatCurrencyCustom(getChartStatistics().average, 'USD')}</Text>
                      </View>
                      <View style={styles.statisticItem}>
                        <Text style={styles.statisticLabel}>Мин</Text>
                        <Text style={styles.statisticValue}>{formatCurrencyCustom(getChartStatistics().min, 'USD')}</Text>
                      </View>
                      <View style={styles.statisticItem}>
                        <Text style={styles.statisticLabel}>Макс</Text>
                        <Text style={styles.statisticValue}>{formatCurrencyCustom(getChartStatistics().max, 'USD')}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}
      </>
    </View>
  );
};

const styles = StyleSheet.create({
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
  compactSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e6edf3',
  },
  compactToggles: {
    flexDirection: 'row',
    gap: 8,
  },
  compactToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1f2a36',
    borderWidth: 1,
    borderColor: '#374151',
  },
  compactToggleActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  compactToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9fb0c0',
  },
  compactToggleTextActive: {
    color: '#ffffff',
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  timePeriodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  timePeriodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1f2a36',
    borderWidth: 1,
    borderColor: '#374151',
  },
  timePeriodButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timePeriodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9fb0c0',
  },
  timePeriodTextActive: {
    color: '#ffffff',
  },
  lineChartContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2a36',
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#9fb0c0',
    textAlign: 'center',
  },
  chartWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTooltip: {
    position: 'absolute',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  tooltipArrow: {
    position: 'absolute',
    top: -8,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tooltipText: {
    fontSize: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#9fb0c0',
  },
  chartStatistics: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1f2a36',
    borderRadius: 8,
  },
  statisticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e6edf3',
    marginBottom: 12,
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statisticItem: {
    flex: 1,
    minWidth: 120,
  },
  statisticLabel: {
    fontSize: 12,
    color: '#9fb0c0',
    marginBottom: 4,
  },
  statisticValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e6edf3',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SummaryBalance;
