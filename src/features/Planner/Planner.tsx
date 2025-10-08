import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import type { User, Workout, Event } from '../../state/types';

interface PlannerProps {
  currentUser: User | null;
  isDark: boolean;
  workouts: Workout[];
  events: Event[];
  onAddWorkout: (workout: Omit<Workout, 'id' | 'userId'>) => void;
  onAddEvent: (event: Omit<Event, 'id' | 'userId'>) => void;
  onDeleteWorkout: (id: number) => void;
  onDeleteEvent: (id: number) => void;
}

const Planner: React.FC<PlannerProps> = ({ 
  currentUser, 
  isDark,
  workouts,
  events,
  onAddWorkout,
  onAddEvent,
  onDeleteWorkout,
  onDeleteEvent
}) => {
  const [viewMode, setViewMode] = React.useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [showEventModal, setShowEventModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [eventType, setEventType] = useState<'event' | 'workout'>('event');

  // Form states
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: selectedDate,
    time: '09:00',
    notes: '',
    category: 'Работа',
    remindBefore: 60,
    reminders: [60, 15]
  });

  const [newWorkout, setNewWorkout] = useState({
    type: 'Бег',
    date: selectedDate,
    time: '09:00',
    notes: '',
    remindBefore: 15
  });

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

  // Get events for a specific date
  const getEventsForDate = (dateStr: string) => {
    const dayEvents = events.filter(e => e.date === dateStr);
    const dayWorkouts = workouts.filter(w => w.date === dateStr);
    return [...dayEvents, ...dayWorkouts.map(w => ({ ...w, isWorkout: true }))];
  };

  const handleAddEvent = () => {
    if (!currentUser) return;
    if (!newEvent.title) return;

    onAddEvent(newEvent);
    setNewEvent({
      title: '',
      date: selectedDate,
      time: '09:00',
      notes: '',
      category: 'Работа',
      remindBefore: 60,
      reminders: [60, 15]
    });
    setShowEventModal(false);
  };

  const handleAddWorkout = () => {
    if (!currentUser) return;

    onAddWorkout(newWorkout);
    setNewWorkout({
      type: 'Бег',
      date: selectedDate,
      time: '09:00',
      notes: '',
      remindBefore: 15
    });
    setShowWorkoutModal(false);
  };

  const openCreateModal = (date: string, type: 'event' | 'workout') => {
    setSelectedDate(date);
    setNewEvent(prev => ({ ...prev, date, reminders: [60, 15] }));
    setNewWorkout(prev => ({ ...prev, date }));
    setEventType(type);
    if (type === 'event') {
      setShowEventModal(true);
    } else {
      setShowWorkoutModal(true);
    }
  };

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

      {/* Add Event/Workout Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.addButton, { backgroundColor: '#10b981' }]}
          onPress={() => openCreateModal(selectedDate, 'event')}
        >
          <Text style={styles.addButtonText}>+ Событие</Text>
        </Pressable>
        <Pressable
          style={[styles.addButton, { backgroundColor: '#f59e0b' }]}
          onPress={() => openCreateModal(selectedDate, 'workout')}
        >
          <Text style={styles.addButtonText}>+ Тренировка</Text>
        </Pressable>
      </View>

      <View style={[styles.calendarCard, isDark ? styles.calendarCardDark : null]}>
        <View style={styles.weekdaysRow}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(dn => (
            <Text key={dn} style={[styles.weekday, isDark ? styles.weekdayDark : null]}>{dn}</Text>
          ))}
        </View>

        {viewMode === 'month' && (
          <ScrollView style={styles.monthGrid}>
            {getMonthGrid(currentDate).map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  const key = wi + '-' + di;
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const dateStr = formatDate(day);
                  const isSelected = dateStr === selectedDate;
                  const dayEvents = getEventsForDate(dateStr);
                  
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
                      {/* Event indicators */}
                      <View style={styles.eventIndicators}>
                        {dayEvents.slice(0, 2).map((event, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.eventDot,
                              { backgroundColor: (event as any).isWorkout ? '#f59e0b' : '#10b981' }
                            ]}
                          />
                        ))}
                        {dayEvents.length > 2 && (
                          <Text style={styles.moreEvents}>+{dayEvents.length - 2}</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Events list for selected date */}
        {selectedDate && (
          <View style={[styles.eventsSection, isDark ? styles.eventsSectionDark : null]}>
            <Text style={[styles.eventsSectionTitle, isDark ? styles.eventsSectionTitleDark : null]}>
              События на {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </Text>
            <ScrollView style={styles.eventsList}>
              {getEventsForDate(selectedDate).map((item, idx) => {
                const isWorkout = (item as any).isWorkout;
                return (
                  <View key={idx} style={[styles.eventItem, isDark ? styles.eventItemDark : null]}>
                    <View style={[
                      styles.eventColorBar,
                      { backgroundColor: isWorkout ? '#f59e0b' : '#10b981' }
                    ]} />
                    <View style={styles.eventContent}>
                      <Text style={[styles.eventTitle, isDark ? styles.eventTitleDark : null]}>
                        {isWorkout ? (item as any).type : (item as any).title}
                      </Text>
                      <Text style={[styles.eventTime, isDark ? styles.eventTimeDark : null]}>
                        🕐 {(item as any).time}
                      </Text>
                      {(item as any).notes && (
                        <Text style={[styles.eventNotes, isDark ? styles.eventNotesDark : null]}>
                          {(item as any).notes}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      style={styles.deleteEventButton}
                      onPress={() => isWorkout ? onDeleteWorkout((item as any).id) : onDeleteEvent((item as any).id)}
                    >
                      <Text style={styles.deleteEventButtonText}>✕</Text>
                    </Pressable>
                  </View>
                );
              })}
              {getEventsForDate(selectedDate).length === 0 && (
                <Text style={[styles.noEventsText, isDark ? styles.noEventsTextDark : null]}>
                  Нет событий на этот день
                </Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Event Creation Modal */}
      <Modal visible={showEventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.modalContentDark : null]}>
            <Text style={[styles.modalTitle, isDark ? styles.modalTitleDark : null]}>Новое событие</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Название</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
                placeholder="Встреча, звонок..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, isDark ? styles.labelDark : null]}>Дата</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : null]}
                  value={newEvent.date}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, date: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, isDark ? styles.labelDark : null]}>Время</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : null]}
                  value={newEvent.time}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, time: text }))}
                  placeholder="HH:MM"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Заметки</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newEvent.notes}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, notes: text }))}
                placeholder="Дополнительная информация..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddEvent}
              >
                <Text style={styles.saveButtonText}>Создать</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Workout Creation Modal */}
      <Modal visible={showWorkoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.modalContentDark : null]}>
            <Text style={[styles.modalTitle, isDark ? styles.modalTitleDark : null]}>Новая тренировка</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Тип</Text>
              <View style={styles.pickerContainer}>
                {['Бег', 'Йога', 'Тренажерный зал', 'Плавание', 'Велосипед'].map(type => (
                  <Pressable
                    key={type}
                    style={[
                      styles.pickerOption,
                      isDark ? styles.pickerOptionDark : null,
                      newWorkout.type === type ? styles.pickerOptionActive : null
                    ]}
                    onPress={() => setNewWorkout(prev => ({ ...prev, type }))}
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

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, isDark ? styles.labelDark : null]}>Дата</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : null]}
                  value={newWorkout.date}
                  onChangeText={(text) => setNewWorkout(prev => ({ ...prev, date: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, isDark ? styles.labelDark : null]}>Время</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : null]}
                  value={newWorkout.time}
                  onChangeText={(text) => setNewWorkout(prev => ({ ...prev, time: text }))}
                  placeholder="HH:MM"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Заметки</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newWorkout.notes}
                onChangeText={(text) => setNewWorkout(prev => ({ ...prev, notes: text }))}
                placeholder="Расстояние, упражнения..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWorkoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddWorkout}
              >
                <Text style={styles.saveButtonText}>Создать</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#e6edf3',
    marginRight: 8,
  },
  plannerTitleDark: {
    color: '#e6edf3',
  },
  navButton: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1f2a36',
  },
  navButtonDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
  },
  navButtonText: {
    color: '#9fb0c0',
    fontWeight: '700',
  },
  navButtonTextDark: {
    color: '#e6edf3',
  },
  todayButton: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1f2a36',
  },
  todayButtonDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
  },
  todayText: {
    color: '#9fb0c0',
    fontWeight: '600',
  },
  todayTextDark: {
    color: '#e6edf3',
  },
  monthLabel: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#e6edf3',
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
    borderColor: '#374151',
    backgroundColor: '#1f2a36',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  viewModeText: {
    color: '#9fb0c0',
    fontWeight: '600',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
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
    color: '#9fb0c0',
    fontSize: 12,
    fontWeight: '600',
  },
  weekdayDark: {
    color: '#9ca3af',
  },
  monthGrid: {
    maxHeight: 300,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 6,
  },
  dayCell: {
    width: `${100 / 7 - 0.6}%`,
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2a36',
    padding: 4,
    position: 'relative',
  },
  dayCellMuted: {
    opacity: 0.6,
  },
  dayCellSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
    borderWidth: 2,
  },
  dayNum: {
    color: '#e6edf3',
    fontWeight: '700',
    fontSize: 12,
  },
  dayNumDark: {
    color: '#e6edf3',
  },
  dayNumMuted: {
    opacity: 0.7,
  },
  dayNumSelected: {
    color: '#3b82f6',
  },
  eventIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 4,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEvents: {
    fontSize: 10,
    color: '#6b7280',
  },
  eventsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  eventsSectionDark: {
    borderTopColor: '#374151',
  },
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  eventsSectionTitleDark: {
    color: '#e6edf3',
  },
  eventsList: {
    maxHeight: 200,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  eventItemDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  eventColorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  eventTitleDark: {
    color: '#e6edf3',
  },
  eventTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  eventTimeDark: {
    color: '#9ca3af',
  },
  eventNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  eventNotesDark: {
    color: '#9ca3af',
  },
  deleteEventButton: {
    padding: 4,
  },
  deleteEventButtonText: {
    fontSize: 18,
    color: '#ef4444',
  },
  noEventsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  noEventsTextDark: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalContentDark: {
    backgroundColor: '#121820',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  modalTitleDark: {
    color: '#e6edf3',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  cancelButtonText: {
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Planner;
