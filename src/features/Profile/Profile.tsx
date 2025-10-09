// Profile feature component - exact reproduction of original functionality
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { storage, STORAGE_KEYS } from '../../services/persist';
import { arrayToCSV, downloadCSV, generateFilename } from '../../services/export/csv';
import { areNotificationsEnabled, requestNotificationPermissions, scheduleNotification } from '../../services/notifications';
import type { User } from '../../state/types';

interface ProfileProps {
  currentUser: User | null;
  isDark: boolean;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser, isDark, onLogout }) => {
  const [profileTab, setProfileTab] = useState<'overview' | 'friends' | 'achievements' | 'settings'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [achievements, setAchievements] = useState([
    { id: 1, title: 'Первый шаг', description: 'Создали аккаунт', earned: true, date: '2025-01-01' },
    { id: 2, title: 'Трейдер', description: 'Добавили первую сделку', earned: false },
    { id: 3, title: 'Планировщик', description: 'Создали первый план', earned: true, date: '2025-01-15' },
    { id: 4, title: 'Социальный', description: 'Опубликовали первый пост', earned: false },
    { id: 5, title: 'Финансист', description: 'Накопили $1000 в резерве', earned: false }
  ]);

  const searchUsers = () => {
    // Mock search results
    const mockResults: User[] = [
      { id: '2', nickname: 'trader_pro', bio: 'Опытный трейдер', avatar: '', friends: [] },
      { id: '3', nickname: 'crypto_guru', bio: 'Эксперт по криптовалютам', avatar: '', friends: [] }
    ];
    setSearchResults(mockResults.filter(user => 
      user.nickname.toLowerCase().includes(userSearch.toLowerCase())
    ));
  };

  const sendFriendRequest = (userId: string) => {
    Alert.alert('Запрос отправлен', 'Запрос в друзья отправлен пользователю');
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const handleOpenNotifications = async () => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('Уведомления', 'Разрешения не предоставлены');
      return;
    }
    const in1Min = new Date(Date.now() + 60 * 1000);
    await scheduleNotification('Проверка уведомлений', 'Это тестовое уведомление профиля', in1Min);
    Alert.alert('Уведомления', 'Тестовое уведомление запланировано через 1 минуту');
  };

  const handleOpenTheme = () => {
    Alert.alert('Тема', 'Переключить тему сейчас?', [
      { text: 'Светлая', onPress: () => storage.set(STORAGE_KEYS.APP_THEME, 'light') },
      { text: 'Тёмная', onPress: () => storage.set(STORAGE_KEYS.APP_THEME, 'dark') },
      { text: 'Отмена', style: 'cancel' }
    ]);
  };

  const handleOpenPrivacy = () => {
    Alert.alert('Приватность', 'Очистить локальные данные приложения?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: () => storage.clear() }
    ]);
  };

  const handleOpenExport = () => {
    try {
      const all = {
        emergencyTx: storage.get(STORAGE_KEYS.EMERGENCY_TX, []),
        investTx: storage.get(STORAGE_KEYS.INVEST_TX, []),
        debts: storage.get(STORAGE_KEYS.SORTED_DEBTS, []),
        trades: storage.get(STORAGE_KEYS.TRADES, []),
        workouts: storage.get(STORAGE_KEYS.WORKOUTS, []),
        events: storage.get(STORAGE_KEYS.EVENTS, []),
        posts: storage.get(STORAGE_KEYS.POSTS, []),
      };
      const json = JSON.stringify(all, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generateFilename('backup', 'json');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      Alert.alert('Экспорт', 'Не удалось экспортировать данные');
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      {/* Profile tabs */}
      <View style={styles.tabSelector}>
        <Pressable
          style={[styles.tabButton, profileTab === 'overview' ? styles.tabButtonActive : null]}
          onPress={() => setProfileTab('overview')}
        >
          <Text style={[styles.tabButtonText, profileTab === 'overview' ? styles.tabButtonTextActive : null]}>
            Обзор
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, profileTab === 'friends' ? styles.tabButtonActive : null]}
          onPress={() => setProfileTab('friends')}
        >
          <Text style={[styles.tabButtonText, profileTab === 'friends' ? styles.tabButtonTextActive : null]}>
            Друзья
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, profileTab === 'achievements' ? styles.tabButtonActive : null]}
          onPress={() => setProfileTab('achievements')}
        >
          <Text style={[styles.tabButtonText, profileTab === 'achievements' ? styles.tabButtonTextActive : null]}>
            Достижения
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, profileTab === 'settings' ? styles.tabButtonActive : null]}
          onPress={() => setProfileTab('settings')}
        >
          <Text style={[styles.tabButtonText, profileTab === 'settings' ? styles.tabButtonTextActive : null]}>
            Настройки
          </Text>
        </Pressable>
      </View>

      {/* Overview tab */}
      {profileTab === 'overview' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
            👤 Профиль пользователя
          </Text>
          
          {currentUser ? (
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentUser.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.userName, isDark ? styles.userNameDark : null]}>
                {currentUser.nickname}
              </Text>
              <Text style={[styles.userBio, isDark ? styles.userBioDark : null]}>
                {currentUser.bio || 'Пользователь не добавил описание'}
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark ? styles.statValueDark : null]}>
                    {currentUser.friends?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDark ? styles.statLabelDark : null]}>
                    Друзей
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark ? styles.statValueDark : null]}>
                    {achievements.filter(a => a.earned).length}
                  </Text>
                  <Text style={[styles.statLabel, isDark ? styles.statLabelDark : null]}>
                    Достижений
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark ? styles.statValueDark : null]}>
                    30
                  </Text>
                  <Text style={[styles.statLabel, isDark ? styles.statLabelDark : null]}>
                    Дней в системе
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
              Войдите, чтобы просмотреть профиль
            </Text>
          )}
        </View>
      )}

      {/* Friends tab */}
      {profileTab === 'friends' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
            👥 Друзья и поиск
          </Text>
          
          {/* Search users */}
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, isDark ? styles.searchInputDark : null]}
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Поиск пользователей..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            />
            <Pressable style={styles.searchButton} onPress={searchUsers}>
              <Text style={styles.searchButtonText}>Найти</Text>
            </Pressable>
          </View>

          {/* Search results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <Text style={[styles.searchResultsTitle, isDark ? styles.searchResultsTitleDark : null]}>
                Результаты поиска
              </Text>
              {searchResults.map(user => (
                <View key={user.id} style={[styles.userCard, isDark ? styles.userCardDark : null]}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {user.nickname.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={[styles.userNickname, isDark ? styles.userNicknameDark : null]}>
                        {user.nickname}
                      </Text>
                      <Text style={[styles.userBio, isDark ? styles.userBioDark : null]}>
                        {user.bio || 'Нет описания'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.friendButton}
                    onPress={() => sendFriendRequest(user.id)}
                  >
                    <Text style={styles.friendButtonText}>Добавить</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Current friends */}
          {currentUser && (
            <View style={styles.friendsList}>
              <Text style={[styles.friendsTitle, isDark ? styles.friendsTitleDark : null]}>
                Ваши друзья ({currentUser.friends?.length || 0})
              </Text>
              {currentUser.friends && currentUser.friends.length > 0 ? (
                <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
                  Список друзей будет отображаться здесь
                </Text>
              ) : (
                <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
                  У вас пока нет друзей. Найдите их через поиск!
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Achievements tab */}
      {profileTab === 'achievements' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
            🏆 Достижения
          </Text>
          
          <View style={styles.achievementsList}>
            {achievements.map(achievement => (
              <View key={achievement.id} style={[
                styles.achievement,
                isDark ? styles.achievementDark : null,
                achievement.earned ? styles.achievementEarned : null
              ]}>
                <View style={styles.achievementIcon}>
                  <Text style={styles.achievementIconText}>
                    {achievement.earned ? '🏆' : '🔒'}
                  </Text>
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle,
                    isDark ? styles.achievementTitleDark : null,
                    !achievement.earned ? styles.achievementTitleLocked : null
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    isDark ? styles.achievementDescriptionDark : null,
                    !achievement.earned ? styles.achievementDescriptionLocked : null
                  ]}>
                    {achievement.description}
                  </Text>
                  {achievement.earned && achievement.date && (
                    <Text style={[styles.achievementDate, isDark ? styles.achievementDateDark : null]}>
                      Получено: {achievement.date}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Settings tab */}
      {profileTab === 'settings' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
            ⚙️ Настройки
          </Text>
          
          <View style={styles.settingsList}>
            <Pressable style={[styles.settingItem, isDark ? styles.settingItemDark : null]} onPress={handleOpenNotifications}>
              <Text style={[styles.settingText, isDark ? styles.settingTextDark : null]}>
                🔔 Уведомления
              </Text>
              <Text style={[styles.settingArrow, isDark ? styles.settingArrowDark : null]}>
                ›
              </Text>
            </Pressable>
            
            <Pressable style={[styles.settingItem, isDark ? styles.settingItemDark : null]} onPress={handleOpenTheme}>
              <Text style={[styles.settingText, isDark ? styles.settingTextDark : null]}>
                🎨 Тема
              </Text>
              <Text style={[styles.settingArrow, isDark ? styles.settingArrowDark : null]}>
                ›
              </Text>
            </Pressable>
            
            <Pressable style={[styles.settingItem, isDark ? styles.settingItemDark : null]} onPress={handleOpenPrivacy}>
              <Text style={[styles.settingText, isDark ? styles.settingTextDark : null]}>
                🔒 Приватность
              </Text>
              <Text style={[styles.settingArrow, isDark ? styles.settingArrowDark : null]}>
                ›
              </Text>
            </Pressable>
            
            <Pressable style={[styles.settingItem, isDark ? styles.settingItemDark : null]} onPress={handleOpenExport}>
              <Text style={[styles.settingText, isDark ? styles.settingTextDark : null]}>
                📊 Экспорт данных
              </Text>
              <Text style={[styles.settingArrow, isDark ? styles.settingArrowDark : null]}>
                ›
              </Text>
            </Pressable>
            
            <Pressable
              style={[styles.settingItem, isDark ? styles.settingItemDark : null]}
              onPress={handleLogout}
            >
              <Text style={[styles.settingText, styles.settingTextDanger, isDark ? styles.settingTextDark : null]}>
                🚪 Выйти
              </Text>
            </Pressable>
          </View>
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
  tabSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1f2a36',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9fb0c0',
  },
  tabButtonTextActive: {
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
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  userNameDark: {
    color: '#e6edf3',
  },
  userBio: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  userBioDark: {
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statValueDark: {
    color: '#60a5fa',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#9ca3af',
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
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  searchInputDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    color: '#e6edf3',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResults: {
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  searchResultsTitleDark: {
    color: '#e6edf3',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userCardDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userNickname: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userNicknameDark: {
    color: '#e6edf3',
  },
  friendButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  friendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendsList: {
    marginTop: 16,
  },
  friendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  friendsTitleDark: {
    color: '#e6edf3',
  },
  achievementsList: {
    gap: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  achievementDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  achievementEarned: {
    backgroundColor: '#1a3d2a',
    borderColor: '#22c55e',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  achievementTitleDark: {
    color: '#e6edf3',
  },
  achievementTitleLocked: {
    color: '#9ca3af',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  achievementDescriptionDark: {
    color: '#9ca3af',
  },
  achievementDescriptionLocked: {
    color: '#6b7280',
  },
  achievementDate: {
    fontSize: 12,
    color: '#10b981',
  },
  achievementDateDark: {
    color: '#34d399',
  },
  settingsList: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingItemDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  settingText: {
    fontSize: 16,
    color: '#1f2937',
  },
  settingTextDark: {
    color: '#e6edf3',
  },
  settingTextDanger: {
    color: '#ef4444',
  },
  settingArrow: {
    fontSize: 20,
    color: '#6b7280',
  },
  settingArrowDark: {
    color: '#9ca3af',
  },
});

export default Profile;
