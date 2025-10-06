import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { User } from '../../state/types';

interface PlannerProps {
  currentUser: User | null;
  isDark: boolean;
}

const Planner: React.FC<PlannerProps> = ({ isDark }) => {
  const [viewMode, setViewMode] = React.useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().slice(0, 10));

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const startOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday first
    const nd = new Date(d);
    nd.setDate(d.getDate() + diff);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };
  const addDays = (d: Date, days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  };
  const getMonthGrid = (d: Date) => {
    const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const start = startOfWeek(firstOfMonth);
    const weeks: Date[][] = [];
    let cursor = new Date(start);
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }
    return weeks;
  };
  const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      <View style={[styles.calendarHeader, isDark ? styles.calendarHeaderDark : null]}>
        <View style={styles.calendarLeft}>
          <Text style={[styles.plannerTitle, isDark ? styles.plannerTitleDark : null]}>Планер</Text>
          <Pressable
            style={[styles.navButton, isDark ? styles.navButtonDark : null]}
            onPress={() => {
              if (viewMode === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
              if (viewMode === 'week') setCurrentDate(addDays(currentDate, -7));
              if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
            }}
          >
            <Text style={[styles.navButtonText, isDark ? styles.navButtonTextDark : null]}>{'<'}</Text>
          </Pressable>
          <Pressable
            style={[styles.todayButton, isDark ? styles.todayButtonDark : null]}
            onPress={() => { setCurrentDate(new Date()); setSelectedDate(formatDate(new Date())); }}
          >
            <Text style={[styles.todayText, isDark ? styles.todayTextDark : null]}>Сегодня</Text>
          </Pressable>
          <Pressable
            style={[styles.navButton, isDark ? styles.navButtonDark : null]}
            onPress={() => {
              if (viewMode === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
              if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
              if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
            }}
          >
            <Text style={[styles.navButtonText, isDark ? styles.navButtonTextDark : null]}>{'>'}</Text>
          </Pressable>
          <Text style={[styles.monthLabel, isDark ? styles.monthLabelDark : null]}>
            {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.viewModeGroup}>
          {(['month', 'week', 'day'] as const).map(vm => (
            <Pressable
              key={vm}
              style={[styles.viewModeBtn, viewMode === vm ? styles.viewModeBtnActive : null]}
              onPress={() => setViewMode(vm)}
            >
              <Text style={[styles.viewModeText, viewMode === vm ? styles.viewModeTextActive : null]}>
                {vm === 'month' ? 'Месяц' : vm === 'week' ? 'Неделя' : 'День'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.calendarCard, isDark ? styles.calendarCardDark : null]}>
        <View style={styles.weekdaysRow}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(dn => (
            <Text key={dn} style={[styles.weekday, isDark ? styles.weekdayDark : null]}>{dn}</Text>
          ))}
        </View>

        {viewMode === 'month' && (
          <View style={styles.monthGrid}>
            {getMonthGrid(currentDate).map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  const key = wi + '-' + di;
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const dateStr = formatDate(day);
                  const isSelected = dateStr === selectedDate;
                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.dayCell,
                        !isCurrentMonth ? styles.dayCellMuted : null,
                        isSelected ? styles.dayCellSelected : null,
                      ]}
                      onPress={() => setSelectedDate(dateStr)}
                    >
                      <Text style={[
                        styles.dayNum,
                        !isCurrentMonth ? styles.dayNumMuted : null,
                        isSelected ? styles.dayNumSelected : null,
                        isDark ? styles.dayNumDark : null,
                      ]}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {viewMode === 'week' && (
          <View style={styles.weekRow}>
            {Array.from({ length: 7 }).map((_, i) => {
              const start = startOfWeek(currentDate);
              const day = addDays(start, i);
              const dateStr = formatDate(day);
              const isSelected = dateStr === selectedDate;
              const isCurrentMonth = isSameMonth(day, currentDate);
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.dayCell,
                    !isCurrentMonth ? styles.dayCellMuted : null,
                    isSelected ? styles.dayCellSelected : null,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[
                    styles.dayNum,
                    !isCurrentMonth ? styles.dayNumMuted : null,
                    isSelected ? styles.dayNumSelected : null,
                    isDark ? styles.dayNumDark : null,
                  ]}
                  >
                    {day.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {viewMode === 'day' && (
          <View style={styles.dayViewBox}>
            <Text style={[styles.dayViewTitle, isDark ? styles.dayViewTitleDark : null]}>
              {new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        )}
      </View>
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarHeaderDark: {
  },
  calendarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginRight: 8,
  },
  plannerTitleDark: {
    color: '#e6edf3',
  },
  navButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  navButtonDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
  },
  navButtonText: {
    color: '#374151',
    fontWeight: '700',
  },
  navButtonTextDark: {
    color: '#e6edf3',
  },
  todayButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  todayButtonDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
  },
  todayText: {
    color: '#374151',
    fontWeight: '600',
  },
  todayTextDark: {
    color: '#e6edf3',
  },
  monthLabel: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  monthLabelDark: {
    color: '#e6edf3',
  },
  viewModeGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  viewModeText: {
    color: '#374151',
    fontWeight: '600',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calendarCardDark: {
    backgroundColor: '#121820',
    borderColor: '#374151',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  weekdayDark: {
    color: '#9ca3af',
  },
  monthGrid: {
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  dayCell: {
    width: `${100 / 7 - 0.5}%`,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellMuted: {
    opacity: 0.6,
  },
  dayCellSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  dayNum: {
    color: '#1f2937',
    fontWeight: '700',
  },
  dayNumDark: {
    color: '#e6edf3',
  },
  dayNumMuted: {
    opacity: 0.7,
  },
  dot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  dayViewBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dayViewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  dayViewTitleDark: {
    color: '#e6edf3',
  },
});

export default Planner;
