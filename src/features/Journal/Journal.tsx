// Journal feature component
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { User } from '../../state/types';

interface JournalProps {
  currentUser: User | null;
  isDark: boolean;
}

interface JournalEntry {
  id: number;
  date: string;
  title: string;
  content: string;
  mood: 'happy' | 'neutral' | 'sad';
  tags: string[];
}

const Journal: React.FC<JournalProps> = ({ currentUser, isDark }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 1,
      date: '2024-01-15',
      title: 'Первая запись',
      content: 'Сегодня начал вести финансовый дневник. Поставил цель накопить резервный фонд.',
      mood: 'happy',
      tags: ['цели', 'финансы']
    }
  ]);
  
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: 'neutral' as 'happy' | 'neutral' | 'sad',
    tags: ''
  });

  const addEntry = () => {
    if (!newEntry.title || !newEntry.content) return;
    
    const entry: JournalEntry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      title: newEntry.title,
      content: newEntry.content,
      mood: newEntry.mood,
      tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    setEntries(prev => [entry, ...prev]);
    setNewEntry({ title: '', content: '', mood: 'neutral', tags: '' });
  };

  const deleteEntry = (id: number) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      default: return '😐';
    }
  };

  return (
    <ScrollView style={[styles.container, isDark ? styles.containerDark : null]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.titleDark : null]}>
          Финансовый дневник
        </Text>
        <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          Записывайте свои мысли, цели и достижения
        </Text>
      </View>

      {/* New entry form */}
      <View style={[styles.form, isDark ? styles.formDark : null]}>
        <Text style={[styles.formTitle, isDark ? styles.formTitleDark : null]}>
          Новая запись
        </Text>
        
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Заголовок записи"
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          value={newEntry.title}
          onChangeText={(text) => setNewEntry(prev => ({ ...prev, title: text }))}
        />
        
        <TextInput
          style={[styles.textArea, isDark ? styles.textAreaDark : null]}
          placeholder="Содержание записи..."
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          value={newEntry.content}
          onChangeText={(text) => setNewEntry(prev => ({ ...prev, content: text }))}
          multiline
          numberOfLines={4}
        />
        
        <View style={styles.moodSelector}>
          <Text style={[styles.moodLabel, isDark ? styles.moodLabelDark : null]}>
            Настроение:
          </Text>
          {(['happy', 'neutral', 'sad'] as const).map(mood => (
            <Pressable
              key={mood}
              style={[
                styles.moodButton,
                newEntry.mood === mood ? styles.moodButtonActive : null
              ]}
              onPress={() => setNewEntry(prev => ({ ...prev, mood }))}
            >
              <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
            </Pressable>
          ))}
        </View>
        
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Теги (через запятую)"
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          value={newEntry.tags}
          onChangeText={(text) => setNewEntry(prev => ({ ...prev, tags: text }))}
        />
        
        <Pressable style={styles.addButton} onPress={addEntry}>
          <Text style={styles.addButtonText}>Добавить запись</Text>
        </Pressable>
      </View>

      {/* Entries list */}
      <View style={styles.entriesList}>
        <Text style={[styles.entriesTitle, isDark ? styles.entriesTitleDark : null]}>
          Ваши записи ({entries.length})
        </Text>
        
        {entries.map(entry => (
          <View key={entry.id} style={[styles.entry, isDark ? styles.entryDark : null]}>
            <View style={styles.entryHeader}>
              <Text style={[styles.entryTitle, isDark ? styles.entryTitleDark : null]}>
                {entry.title}
              </Text>
              <View style={styles.entryMeta}>
                <Text style={[styles.entryDate, isDark ? styles.entryDateDark : null]}>
                  {entry.date}
                </Text>
                <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteEntry(entry.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </Pressable>
              </View>
            </View>
            
            <Text style={[styles.entryContent, isDark ? styles.entryContentDark : null]}>
              {entry.content}
            </Text>
            
            {entry.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {entry.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
        
        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : null]}>
              Пока нет записей. Создайте первую запись в дневнике!
            </Text>
          </View>
        )}
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
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formDark: {
    backgroundColor: '#161b22',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  formTitleDark: {
    color: '#f9fafb',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
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
    marginBottom: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#374151',
    backgroundColor: '#21262d',
    color: '#f9fafb',
  },
  moodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginRight: 12,
  },
  moodLabelDark: {
    color: '#f9fafb',
  },
  moodButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  moodButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  moodEmoji: {
    fontSize: 20,
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
  entriesList: {
    marginBottom: 24,
  },
  entriesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  entriesTitleDark: {
    color: '#f9fafb',
  },
  entry: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryDark: {
    backgroundColor: '#161b22',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  entryTitleDark: {
    color: '#f9fafb',
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  entryDateDark: {
    color: '#9ca3af',
  },
  entryMood: {
    fontSize: 16,
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
  entryContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  entryContentDark: {
    color: '#d1d5db',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#9ca3af',
  },
});

export default Journal;
