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

  // Check notification permissions on component mount
  useEffect(() => {
    const checkNotifications = async () => {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };
    checkNotifications();
  }, []);

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

          {/* Workouts list */}
          {workouts.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={[styles.listTitle, isDark ? styles.listTitleDark : null]}>
                Запланированные тренировки
              </Text>
              <ScrollView style={styles.list}>
                {workouts.map(workout => (
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

          {/* Events list */}
          {events.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={[styles.listTitle, isDark ? styles.listTitleDark : null]}>
                Запланированные события
              </Text>
              <ScrollView style={styles.list}>
                {events.map(event => (
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