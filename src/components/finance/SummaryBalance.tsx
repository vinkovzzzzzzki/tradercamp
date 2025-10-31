// SummaryBalance component - exact reproduction of original functionality
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Skeleton from '../common/Skeleton';
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
  // Responsive width: measure container width to make chart truly full-width inside the card
  const [chartWidth, setChartWidth] = useState<number>(Math.max(320, Dimensions.get('window').width));
  const [timePreset, setTimePreset] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');
  const [tapTooltip, setTapTooltip] = useState<{ visible: boolean; x: number; y: number; data: any } | null>(null);
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
                {/* Time presets selector */}
                <View style={styles.timePeriodSelector}>
                  {([
                    { k: '1M', l: '1М' },
                    { k: '3M', l: '3М' },
                    { k: '6M', l: '6М' },
                    { k: '1Y', l: '1Г' },
                    { k: 'ALL', l: 'Все' }
                  ] as Array<{ k: '1M' | '3M' | '6M' | '1Y' | 'ALL'; l: string }>).map(opt => (
                    <Pressable
                      key={opt.k}
                      style={[styles.timePeriodButton, timePreset === opt.k ? styles.timePeriodButtonActive : null]}
                      onPress={() => setTimePreset(opt.k)}
                    >
                      <Text style={[styles.timePeriodText, timePreset === opt.k ? styles.timePeriodTextActive : null]}>
                        {opt.l}
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
                <View
                  style={styles.lineChartContainer}
                  onLayout={(e) => {
                    const measured = Math.max(320, Math.floor(e.nativeEvent.layout.width));
                    if (measured !== chartWidth) setChartWidth(measured);
                  }}
                  onTouchEnd={() => setTapTooltip(null)}
                >
                  {(() => {
                    const chartData = (getComprehensiveChartData as any)(timePreset, chartVisibility);
                    const allYValues = (chartData.datasets || [])
                      .flatMap((ds: any) => (ds?.data ?? []))
                      .filter((v: any) => Number.isFinite(v)) as number[];
                    const yMin = allYValues.length ? Math.min(...allYValues) : 0;
                    const yMax = allYValues.length ? Math.max(...allYValues) : 1;
                    const yRange = Math.max(1, yMax - yMin);
                    const segments = yRange > 1_000_000 ? 6 : yRange > 100_000 ? 6 : yRange > 10_000 ? 5 : 4;
                    const formatCompact = (n: number) => {
                      const abs = Math.abs(n);
                      const sign = n < 0 ? '-' : '';
                      if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
                      if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
                      if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
                      return `${n}`;
                    };
                    const ruMonths = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
                    const formatX = (label: string) => {
                      // We expect either ISO (YYYY-MM-DD) or fallback like D/M
                      const parseIso = (s: string) => {
                        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00');
                        const m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
                        if (m) {
                          const today = new Date();
                          const year = today.getFullYear();
                          const day = Number(m[1]);
                          const month = Number(m[2]) - 1;
                          return new Date(year, month, day);
                        }
                        const d = new Date(s);
                        return isNaN(d.getTime()) ? null : d;
                      };
                      const d = parseIso(label);
                      if (!d) return label;
                      const day = d.getDate();
                      const mon = d.getMonth();
                      const yr = d.getFullYear();
                      if (timePreset === '1M') {
                        return chartWidth < 420 ? `${day}` : `${day} ${ruMonths[mon]}`;
                      }
                      if (timePreset === '3M' || timePreset === '6M') {
                        return chartWidth < 420 ? `${ruMonths[mon]}` : `${day} ${ruMonths[mon]}`;
                      }
                      // 1Y and ALL
                      const shortYear = String(yr).slice(2);
                      return chartWidth < 380 ? `${ruMonths[mon]}` : `${ruMonths[mon]} ${shortYear}`;
                    };
                    
                    // Show message when no data is visible
                    if (chartData.datasets.length === 0) {
                      return (
                        <View style={styles.emptyChartContainer}>
                          <Skeleton width={chartWidth} height={180} />
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
                          style={styles.lineChart}
                          fromZero={false}
                          segments={segments}
                          yLabelsOffset={8}
                          xLabelsOffset={chartWidth < 360 ? 8 : 0}
                          verticalLabelRotation={chartWidth < 380 ? 45 : 0}
                          formatYLabel={(v: string) => {
                            const num = Number(v);
                            return Number.isFinite(num) ? formatCompact(num) : v;
                          }}
                          formatXLabel={(v: string) => formatX(v)}
                          withShadow={false}
                          withInnerLines
                          withOuterLines
                          onDataPointClick={({ index, x, y }) => {
                            try {
                              const values: Array<{ value: number; color: string; label: string }> = [];
                              let di = 0;
                              if (chartVisibility.cushion && chartData.datasets[di]) {
                                values.push({ value: chartData.datasets[di].data[index], color: '#3b82f6', label: 'Подушка' });
                                di++;
                              }
                              if (chartVisibility.investments && chartData.datasets[di]) {
                                values.push({ value: chartData.datasets[di].data[index], color: '#10b981', label: 'Инвестиции' });
                                di++;
                              }
                              if (chartVisibility.debts && chartData.datasets[di]) {
                                values.push({ value: chartData.datasets[di].data[index], color: '#ef4444', label: 'Долги' });
                                di++;
                              }
                              if (chartVisibility.total && chartData.datasets[di]) {
                                values.push({ value: chartData.datasets[di].data[index], color: '#a855f7', label: 'Итого' });
                              }
                              const label = chartData.labels[index] || '';
                              setTapTooltip({
                                visible: true,
                                x: Math.max(12, Math.min(x + 12, chartWidth - 212)),
                                y: Math.max(12, y + 12),
                                data: { label: formatX(label), values }
                              });
                            } catch {}
                          }}
                        />
                      </View>
                    );
                  })()}
                </View>
                
                {/* Chart tooltip (web hover) */}
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
                {/* Chart tooltip (mobile tap) */}
                {tapTooltip?.visible && tapTooltip.data && (
                  <View
                    style={[
                      styles.chartTooltip,
                      {
                        left: tapTooltip.x,
                        top: tapTooltip.y,
                        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                        borderColor: isDark ? '#1f2a36' : '#e5e7eb'
                      }
                    ]}
                  >
                    <View style={[
                      styles.tooltipArrow,
                      {
                        borderTopColor: isDark ? '#1a1a1a' : '#ffffff',
                        borderBottomColor: isDark ? '#1a1a1a' : '#ffffff'
                      }
                    ]} />
                    <Text style={[styles.tooltipTitle, { color: isDark ? '#e6edf3' : '#1f2937' }]}>
                      {tapTooltip.data.label}
                    </Text>
                    {tapTooltip.data.values && tapTooltip.data.values.map((item: any, index: number) => (
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
                    <Pressable
                      style={styles.legendItem}
                      onPress={() => setChartVisibilitySafe(v => ({ ...v, cushion: !v.cushion }))}
                    >
                      <View style={[styles.legendColor, { backgroundColor: '#3b82f6', opacity: chartVisibility.cushion ? 1 : 0.4 }]} />
                      <Text style={styles.legendText}>Подушка безопасности</Text>
                    </Pressable>
                    <Pressable
                      style={styles.legendItem}
                      onPress={() => setChartVisibilitySafe(v => ({ ...v, investments: !v.investments }))}
                    >
                      <View style={[styles.legendColor, { backgroundColor: '#10b981', opacity: chartVisibility.investments ? 1 : 0.4 }]} />
                      <Text style={styles.legendText}>Инвестиции</Text>
                    </Pressable>
                  </View>
                  <View style={styles.legendRow}>
                    <Pressable
                      style={styles.legendItem}
                      onPress={() => setChartVisibilitySafe(v => ({ ...v, debts: !v.debts }))}
                    >
                      <View style={[styles.legendColor, { backgroundColor: '#ef4444', opacity: chartVisibility.debts ? 1 : 0.4 }]} />
                      <Text style={styles.legendText}>Долги</Text>
                    </Pressable>
                    <Pressable
                      style={styles.legendItem}
                      onPress={() => setChartVisibilitySafe(v => ({ ...v, total: !v.total }))}
                    >
                      <View style={[styles.legendColor, { backgroundColor: '#a855f7', opacity: chartVisibility.total ? 1 : 0.4 }]} />
                      <Text style={styles.legendText}>Итоговый баланс</Text>
                    </Pressable>
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
    alignSelf: 'stretch',
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
    alignSelf: 'stretch',
    width: '100%',
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
