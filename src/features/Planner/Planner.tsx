// Planner feature component
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { User } from '../../state/types';

interface PlannerProps {
  currentUser: User | null;
  isDark: boolean;
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
  category: string;
}

interface Habit {
  id: number;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  lastCompleted: string | null;
}

const Planner: React.FC<PlannerProps> = ({ currentUser, isDark }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Проверить инвестиции',
      description: 'Проанализировать портфель и принять решения',
      priority: 'high',
      status: 'todo',
      dueDate: '2024-01-20',
      category: 'Финансы'
    },
    {
      id: 2,
      title: 'Пополнить резервный фонд',
      description: 'Перевести 10% от зарплаты в резерв',
      priority: 'medium',
      status: 'in-progress',
      dueDate: '2024-01-25',
      category: 'Финансы'
    }
  ]);
  
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: 1,
      title: 'Ведение финансового дневника',
      description: 'Записывать доходы и расходы каждый день',
      frequency: 'daily',
      streak: 5,
      lastCompleted: '2024-01-19'
    },
    {
      id: 2,
      title: 'Анализ инвестиций',
      description: 'Еженедельный обзор портфеля',
      frequency: 'weekly',
      streak: 2,
      lastCompleted: '2024-01-15'
    }
  ]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    category: ''
  });

  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  const addTask = () => {
    if (!newTask.title) return;
    
    const task: Task = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'todo',
      dueDate: newTask.dueDate,
      category: newTask.category
    };
    
    setTasks(prev => [...prev, task]);
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', category: '' });
  };

  const addHabit = () => {
    if (!newHabit.title) return;
    
    const habit: Habit = {
      id: Date.now(),
      title: newHabit.title,
      description: newHabit.description,
      frequency: newHabit.frequency,
      streak: 0,
      lastCompleted: null
    };
    
    setHabits(prev => [...prev, habit]);
    setNewHabit({ title: '', description: '', frequency: 'daily' });
  };

  const updateTaskStatus = (id: number, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status } : task
    ));
  };

  const completeHabit = (id: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setHabits(prev => prev.map(habit => 
      habit.id === id 
        ? { 
            ...habit, 
            streak: habit.lastCompleted === today ? habit.streak : habit.streak + 1,
            lastCompleted: today
          }
        : habit
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const deleteHabit = (id: number) => {
    setHabits(prev => prev.filter(habit => habit.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'todo': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView style={[styles.container, isDark ? styles.containerDark : null]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.titleDark : null]}>
          Планер
        </Text>
        <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          Управляйте задачами и привычками
        </Text>
      </View>

      {/* Tasks Section */}
      <View style={[styles.section, isDark ? styles.sectionDark : null]}>
        <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
          Задачи ({tasks.length})
        </Text>
        
        {/* New Task Form */}
        <View style={[styles.form, isDark ? styles.formDark : null]}>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : null]}
            placeholder="Название задачи"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={newTask.title}
            onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
          />
          
          <TextInput
            style={[styles.textArea, isDark ? styles.textAreaDark : null]}
            placeholder="Описание задачи"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={newTask.description}
            onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={2}
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, isDark ? styles.inputDark : null]}
              placeholder="Дата выполнения"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={newTask.dueDate}
              onChangeText={(text) => setNewTask(prev => ({ ...prev, dueDate: text }))}
            />
            
            <TextInput
              style={[styles.input, styles.halfInput, isDark ? styles.inputDark : null]}
              placeholder="Категория"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={newTask.category}
              onChangeText={(text) => setNewTask(prev => ({ ...prev, category: text }))}
            />
          </View>
          
          <View style={styles.prioritySelector}>
            <Text style={[styles.priorityLabel, isDark ? styles.priorityLabelDark : null]}>
              Приоритет:
            </Text>
            {(['low', 'medium', 'high'] as const).map(priority => (
              <Pressable
                key={priority}
                style={[
                  styles.priorityButton,
                  newTask.priority === priority ? styles.priorityButtonActive : null,
                  { borderColor: getPriorityColor(priority) }
                ]}
                onPress={() => setNewTask(prev => ({ ...prev, priority }))}
              >
                <Text style={[
                  styles.priorityText,
                  newTask.priority === priority ? { color: getPriorityColor(priority) } : null
                ]}>
                  {priority === 'high' ? 'Высокий' : priority === 'medium' ? 'Средний' : 'Низкий'}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Pressable style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonText}>Добавить задачу</Text>
          </Pressable>
        </View>

        {/* Tasks List */}
        {tasks.map(task => (
          <View key={task.id} style={[styles.task, isDark ? styles.taskDark : null]}>
            <View style={styles.taskHeader}>
              <Text style={[styles.taskTitle, isDark ? styles.taskTitleDark : null]}>
                {task.title}
              </Text>
              <View style={styles.taskActions}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.priorityBadgeText}>
                    {task.priority === 'high' ? 'В' : task.priority === 'medium' ? 'С' : 'Н'}
                  </Text>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteTask(task.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </Pressable>
              </View>
            </View>
            
            {task.description && (
              <Text style={[styles.taskDescription, isDark ? styles.taskDescriptionDark : null]}>
                {task.description}
              </Text>
            )}
            
            <View style={styles.taskMeta}>
              <Text style={[styles.taskDate, isDark ? styles.taskDateDark : null]}>
                {task.dueDate}
              </Text>
              {task.category && (
                <Text style={[styles.taskCategory, isDark ? styles.taskCategoryDark : null]}>
                  {task.category}
                </Text>
              )}
            </View>
            
            <View style={styles.statusButtons}>
              {(['todo', 'in-progress', 'done'] as const).map(status => (
                <Pressable
                  key={status}
                  style={[
                    styles.statusButton,
                    task.status === status ? styles.statusButtonActive : null,
                    { borderColor: getStatusColor(status) }
                  ]}
                  onPress={() => updateTaskStatus(task.id, status)}
                >
                  <Text style={[
                    styles.statusText,
                    task.status === status ? { color: getStatusColor(status) } : null
                  ]}>
                    {status === 'todo' ? 'К выполнению' : status === 'in-progress' ? 'В работе' : 'Выполнено'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Habits Section */}
      <View style={[styles.section, isDark ? styles.sectionDark : null]}>
        <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
          Привычки ({habits.length})
        </Text>
        
        {/* New Habit Form */}
        <View style={[styles.form, isDark ? styles.formDark : null]}>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : null]}
            placeholder="Название привычки"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={newHabit.title}
            onChangeText={(text) => setNewHabit(prev => ({ ...prev, title: text }))}
          />
          
          <TextInput
            style={[styles.textArea, isDark ? styles.textAreaDark : null]}
            placeholder="Описание привычки"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={newHabit.description}
            onChangeText={(text) => setNewHabit(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={2}
          />
          
          <View style={styles.frequencySelector}>
            <Text style={[styles.frequencyLabel, isDark ? styles.frequencyLabelDark : null]}>
              Частота:
            </Text>
            {(['daily', 'weekly', 'monthly'] as const).map(frequency => (
              <Pressable
                key={frequency}
                style={[
                  styles.frequencyButton,
                  newHabit.frequency === frequency ? styles.frequencyButtonActive : null
                ]}
                onPress={() => setNewHabit(prev => ({ ...prev, frequency }))}
              >
                <Text style={[
                  styles.frequencyText,
                  newHabit.frequency === frequency ? { color: '#3b82f6' } : null
                ]}>
                  {frequency === 'daily' ? 'Ежедневно' : frequency === 'weekly' ? 'Еженедельно' : 'Ежемесячно'}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Pressable style={styles.addButton} onPress={addHabit}>
            <Text style={styles.addButtonText}>Добавить привычку</Text>
          </Pressable>
        </View>

        {/* Habits List */}
        {habits.map(habit => (
          <View key={habit.id} style={[styles.habit, isDark ? styles.habitDark : null]}>
            <View style={styles.habitHeader}>
              <Text style={[styles.habitTitle, isDark ? styles.habitTitleDark : null]}>
                {habit.title}
              </Text>
              <View style={styles.habitActions}>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {habit.streak}</Text>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteHabit(habit.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </Pressable>
              </View>
            </View>
            
            {habit.description && (
              <Text style={[styles.habitDescription, isDark ? styles.habitDescriptionDark : null]}>
                {habit.description}
              </Text>
            )}
            
            <View style={styles.habitMeta}>
              <Text style={[styles.habitFrequency, isDark ? styles.habitFrequencyDark : null]}>
                {habit.frequency === 'daily' ? 'Ежедневно' : habit.frequency === 'weekly' ? 'Еженедельно' : 'Ежемесячно'}
              </Text>
              {habit.lastCompleted && (
                <Text style={[styles.habitLastCompleted, isDark ? styles.habitLastCompletedDark : null]}>
                  Последний раз: {habit.lastCompleted}
                </Text>
              )}
            </View>
            
            <Pressable
              style={[
                styles.completeButton,
                habit.lastCompleted === new Date().toISOString().slice(0, 10) ? styles.completeButtonDone : null
              ]}
              onPress={() => completeHabit(habit.id)}
            >
              <Text style={[
                styles.completeButtonText,
                habit.lastCompleted === new Date().toISOString().slice(0, 10) ? styles.completeButtonTextDone : null
              ]}>
                {habit.lastCompleted === new Date().toISOString().slice(0, 10) ? 'Выполнено сегодня' : 'Отметить выполнение'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  titleDark: {
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  subtitleDark: {
    color: '#9ca3af',
  },
  section: {
    marginBottom: 32,
  },
  sectionDark: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  form: {
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
  formDark: {
    backgroundColor: '#21262d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#21262d',
    color: '#f9fafb',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#374151',
    backgroundColor: '#21262d',
    color: '#f9fafb',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginRight: 12,
  },
  priorityLabelDark: {
    color: '#f9fafb',
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  priorityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  frequencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  frequencyLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginRight: 12,
  },
  frequencyLabelDark: {
    color: '#f9fafb',
  },
  frequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  frequencyButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  frequencyText: {
    fontSize: 12,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  task: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskDark: {
    backgroundColor: '#21262d',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  taskTitleDark: {
    color: '#f9fafb',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  taskDescriptionDark: {
    color: '#d1d5db',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskDateDark: {
    color: '#9ca3af',
  },
  taskCategory: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  taskCategoryDark: {
    color: '#60a5fa',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  habit: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitDark: {
    backgroundColor: '#21262d',
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  habitTitleDark: {
    color: '#f9fafb',
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  habitDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  habitDescriptionDark: {
    color: '#d1d5db',
  },
  habitMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  habitFrequency: {
    fontSize: 12,
    color: '#6b7280',
  },
  habitFrequencyDark: {
    color: '#9ca3af',
  },
  habitLastCompleted: {
    fontSize: 12,
    color: '#10b981',
  },
  habitLastCompletedDark: {
    color: '#34d399',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonDone: {
    backgroundColor: '#10b981',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  completeButtonTextDone: {
    color: '#ffffff',
  },
});

export default Planner;
