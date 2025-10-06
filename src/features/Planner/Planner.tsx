// Planner feature component - exact reproduction of original functionality
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  scheduleWorkoutReminder, 
  scheduleEventReminder, 
  cancelNotification,
  requestNotificationPermissions,
  areNotificationsEnabled
} from '../../services/notifications';
import type { User } from '../../state/types';

interface PlannerProps {
  currentUser: User | null;
  isDark: boolean;
}

const Planner: React.FC<PlannerProps> = ({ currentUser, isDark }) => {
  // Calendar scaffolding (Google Calendar-like)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  
  const [calendarView, setCalendarView] = useState<'news' | 'workouts' | 'events'>('workouts');
  const [newWorkout, setNewWorkout] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    type: 'Кардио',
    notes: '',
    remindBefore: 15
  });
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    endTime: '11:00',
    title: '',
    notes: '',
    remindBefore: 30
  });
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Helpers for calendar rendering
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
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

  // Check notification permissions on component mount
  useEffect(() => {
    const checkNotifications = async () => {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };
    checkNotifications();
  }, []);

  // Derived, filtered by selected date for day view lists
  const itemsForSelectedDay = (list: any[]) => list.filter(it => it.date === selectedDate);

  const addWorkout = async () => {
    if (!currentUser || !newWorkout.type) return;

    const workout = {
      id: Date.now(),
      userId: currentUser.id,
      ...newWorkout
    };

    // Schedule notification if enabled
    if (notificationsEnabled && newWorkout.remindBefore > 0) {
      const notificationId = await scheduleWorkoutReminder(workout);
      if (notificationId) {
        workout.notificationId = notificationId;
      }
    }

    setWorkouts(prev => [workout, ...prev]);
    setNewWorkout({
      date: new Date().toISOString().slice(0, 10),
      time: '10:00',
      type: 'Кардио',
      notes: '',
      remindBefore: 15
    });
  };

  const addEvent = async () => {
    if (!currentUser || !newEvent.title) return;

    const event = {
      id: Date.now(),
      userId: currentUser.id,
      ...newEvent
    };

    // Schedule notification if enabled
    if (notificationsEnabled && newEvent.remindBefore > 0) {
      const notificationId = await scheduleEventReminder(event);
      if (notificationId) {
        event.notificationId = notificationId;
      }
    }

    setEvents(prev => [event, ...prev]);
    setNewEvent({
      date: new Date().toISOString().slice(0, 10),
      time: '10:00',
      endTime: '11:00',
      title: '',
      notes: '',
      remindBefore: 30
    });
  };

  const deleteWorkout = async (id: number) => {
    const workout = workouts.find(w => w.id === id);
    if (workout && workout.notificationId) {
      await cancelNotification(workout.notificationId);
    }
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  const deleteEvent = async (id: number) => {
    const event = events.find(e => e.id === id);
    if (event && event.notificationId) {
      await cancelNotification(event.notificationId);
    }
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      setNotificationsEnabled(true);
      Alert.alert('Уведомления включены', 'Теперь вы будете получать напоминания о тренировках и событиях.');
    } else {
      Alert.alert('Ошибка', 'Не удалось получить разрешение на уведомления. Проверьте настройки приложения.');
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      {/* Calendar header (Google Calendar-like) */}
      <View style={[styles.calendarHeader, isDark ? styles.calendarHeaderDark : null]}>
        <View style={styles.calendarLeft}>
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

      {/* Calendar grid */}
      <View style={[styles.calendarCard, isDark ? styles.calendarCardDark : null]}>
        {/* Weekday labels */}
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
                  const hasItems = itemsForSelectedDay([...workouts, ...events].map((it: any) => ({ date: it.date } as any))).some(it => it.date === dateStr);
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
                      {hasItems && <View style={styles.dot} />}
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
              const hasItems = itemsForSelectedDay([...workouts, ...events].map((it: any) => ({ date: it.date } as any))).some(it => it.date === dateStr);
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
                  {hasItems && <View style={styles.dot} />}
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
      {/* Calendar view selector */}
      <View style={styles.viewSelector}>
        <Pressable
          style={[styles.viewButton, calendarView === 'workouts' ? styles.viewButtonActive : null]}
          onPress={() => setCalendarView('workouts')}
        >
          <Text style={[styles.viewButtonText, calendarView === 'workouts' ? styles.viewButtonTextActive : null]}>
            Тренировки
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewButton, calendarView === 'events' ? styles.viewButtonActive : null]}
          onPress={() => setCalendarView('events')}
        >
          <Text style={[styles.viewButtonText, calendarView === 'events' ? styles.viewButtonTextActive : null]}>
            События
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewButton, calendarView === 'news' ? styles.viewButtonActive : null]}
          onPress={() => setCalendarView('news')}
        >
          <Text style={[styles.viewButtonText, calendarView === 'news' ? styles.viewButtonTextActive : null]}>
            Новости
          </Text>
        </Pressable>
      </View>

      {calendarView === 'workouts' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
              🏃‍♂️ Планировщик тренировок
            </Text>
            {!notificationsEnabled && (
              <Pressable style={styles.notificationButton} onPress={enableNotifications}>
                <Text style={styles.notificationButtonText}>🔔 Включить уведомления</Text>
              </Pressable>
            )}
            {notificationsEnabled && (
              <Text style={[styles.notificationStatus, isDark ? styles.notificationStatusDark : null]}>
                🔔 Уведомления включены
              </Text>
            )}
          </View>
          {!currentUser && (
            <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
              Войдите, чтобы планировать тренировки
            </Text>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Дата</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newWorkout.date}
                onChangeText={(t) => setNewWorkout(v => ({ ...v, date: t }))}
                placeholder="2025-01-15"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Время</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newWorkout.time}
                onChangeText={(t) => setNewWorkout(v => ({ ...v, time: t }))}
                placeholder="10:00"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Тип тренировки</Text>
              <View style={styles.pickerContainer}>
                {['Кардио', 'Силовая', 'Йога', 'Плавание', 'Велосипед'].map(type => (
                  <Pressable
                    key={type}
                    style={[
                      styles.pickerOption,
                      isDark ? styles.pickerOptionDark : null,
                      newWorkout.type === type ? styles.pickerOptionActive : null
                    ]}
                    onPress={() => setNewWorkout(v => ({ ...v, type }))}
                  >
                    <Text style={[
                      styles.pickerText,
                      isDark ? styles.pickerTextDark : null,
                      newWorkout.type === type ? styles.pickerTextActive : null
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark ? styles.labelDark : null]}>Заметки</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : null]}
              value={newWorkout.notes}
              onChangeText={(t) => setNewWorkout(v => ({ ...v, notes: t }))}
              placeholder="План тренировки"
              multiline
              numberOfLines={3}
            />
          </View>

          <Pressable style={styles.addButton} onPress={addWorkout}>
            <Text style={styles.addButtonText}>Добавить тренировку</Text>
          </Pressable>

          {/* Workouts list (filtered by selected date in day mode) */}
          {(viewMode !== 'day' ? workouts.length > 0 : itemsForSelectedDay(workouts).length > 0) && (
            <View style={styles.listContainer}>
              <Text style={[styles.listTitle, isDark ? styles.listTitleDark : null]}>
                Запланированные тренировки
              </Text>
              <ScrollView style={styles.list}>
                {(viewMode === 'day' ? itemsForSelectedDay(workouts) : workouts).map(workout => (
                  <View key={workout.id} style={[styles.listItem, isDark ? styles.listItemDark : null]}>
                    <View style={styles.listItemHeader}>
                      <Text style={[styles.listItemTitle, isDark ? styles.listItemTitleDark : null]}>
                        {workout.type}
                      </Text>
                      <Text style={[styles.listItemDate, isDark ? styles.listItemDateDark : null]}>
                        {workout.date} в {workout.time}
                      </Text>
                    </View>
                    {workout.notes && (
                      <Text style={[styles.listItemNotes, isDark ? styles.listItemNotesDark : null]}>
                        {workout.notes}
                      </Text>
                    )}
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => deleteWorkout(workout.id)}
                    >
                      <Text style={styles.deleteButtonText}>Удалить</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {calendarView === 'events' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
              📅 Планировщик событий
            </Text>
            {!notificationsEnabled && (
              <Pressable style={styles.notificationButton} onPress={enableNotifications}>
                <Text style={styles.notificationButtonText}>🔔 Включить уведомления</Text>
              </Pressable>
            )}
            {notificationsEnabled && (
              <Text style={[styles.notificationStatus, isDark ? styles.notificationStatusDark : null]}>
                🔔 Уведомления включены
              </Text>
            )}
          </View>
          {!currentUser && (
            <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
              Войдите, чтобы планировать события
            </Text>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Дата</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newEvent.date}
                onChangeText={(t) => setNewEvent(v => ({ ...v, date: t }))}
                placeholder="2025-01-15"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Время начала</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newEvent.time}
                onChangeText={(t) => setNewEvent(v => ({ ...v, time: t }))}
                placeholder="10:00"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Время окончания</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newEvent.endTime}
                onChangeText={(t) => setNewEvent(v => ({ ...v, endTime: t }))}
                placeholder="11:00"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark ? styles.labelDark : null]}>Название события</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : null]}
              value={newEvent.title}
              onChangeText={(t) => setNewEvent(v => ({ ...v, title: t }))}
              placeholder="Встреча с клиентом"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark ? styles.labelDark : null]}>Заметки</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : null]}
              value={newEvent.notes}
              onChangeText={(t) => setNewEvent(v => ({ ...v, notes: t }))}
              placeholder="Детали события"
              multiline
              numberOfLines={3}
            />
          </View>

          <Pressable style={styles.addButton} onPress={addEvent}>
            <Text style={styles.addButtonText}>Добавить событие</Text>
          </Pressable>

          {/* Events list (filtered by selected date in day mode) */}
          {(viewMode !== 'day' ? events.length > 0 : itemsForSelectedDay(events).length > 0) && (
            <View style={styles.listContainer}>
              <Text style={[styles.listTitle, isDark ? styles.listTitleDark : null]}>
                Запланированные события
              </Text>
              <ScrollView style={styles.list}>
                {(viewMode === 'day' ? itemsForSelectedDay(events) : events).map(event => (
                  <View key={event.id} style={[styles.listItem, isDark ? styles.listItemDark : null]}>
                    <View style={styles.listItemHeader}>
                      <Text style={[styles.listItemTitle, isDark ? styles.listItemTitleDark : null]}>
                        {event.title}
                      </Text>
                      <Text style={[styles.listItemDate, isDark ? styles.listItemDateDark : null]}>
                        {event.date} с {event.time} до {event.endTime}
                      </Text>
                    </View>
                    {event.notes && (
                      <Text style={[styles.listItemNotes, isDark ? styles.listItemNotesDark : null]}>
                        {event.notes}
                      </Text>
                    )}
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => deleteEvent(event.id)}
                    >
                      <Text style={styles.deleteButtonText}>Удалить</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {calendarView === 'news' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
            📰 Финансовые новости
          </Text>
          <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
            Здесь будут отображаться последние финансовые новости
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  // Calendar header & grid
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
  darkContainer: {
    backgroundColor: '#0b0f14',
  },
  viewSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#3b82f6',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewButtonTextActive: {
    color: '#ffffff',
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
    marginBottom: 16,
  },
  cardTitleDark: {
    color: '#e6edf3',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  labelDark: {
    color: '#d1d5db',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    color: '#e6edf3',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  pickerOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  pickerOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  pickerTextDark: {
    color: '#d1d5db',
  },
  pickerTextActive: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  noteTextDark: {
    color: '#9ca3af',
  },
  listContainer: {
    marginTop: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  listTitleDark: {
    color: '#e6edf3',
  },
  list: {
    maxHeight: 300,
  },
  listItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  listItemDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  listItemTitleDark: {
    color: '#e6edf3',
  },
  listItemDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  listItemDateDark: {
    color: '#9ca3af',
  },
  listItemNotes: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  listItemNotesDark: {
    color: '#9ca3af',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // New styles for notifications
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  notificationButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  notificationStatusDark: {
    color: '#34d399',
  },
});

export default Planner;