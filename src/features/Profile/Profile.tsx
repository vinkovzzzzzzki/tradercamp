// Profile feature component
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { User } from '../../state/types';

interface ProfileProps {
  currentUser: User | null;
  isDark: boolean;
  onLogout: () => void;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: string;
}

interface Statistic {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

const Profile: React.FC<ProfileProps> = ({ currentUser, isDark, onLogout }) => {
  const [achievements] = useState<Achievement[]>([
    {
      id: 1,
      title: 'Первые накопления',
      description: 'Создали резервный фонд на 1 месяц расходов',
      icon: '🏆',
      unlockedAt: '2024-01-15',
      category: 'Накопления'
    },
    {
      id: 2,
      title: 'Инвестор-новичок',
      description: 'Сделали первую инвестицию',
      icon: '📈',
      unlockedAt: '2024-01-10',
      category: 'Инвестиции'
    },
    {
      id: 3,
      title: 'Планировщик',
      description: 'Вели дневник 7 дней подряд',
      icon: '📝',
      unlockedAt: '2024-01-08',
      category: 'Планирование'
    }
  ]);

  const [statistics] = useState<Statistic[]>([
    {
      label: 'Общий баланс',
      value: '$12,450',
      change: '+15.2%',
      changeType: 'positive'
    },
    {
      label: 'Резервный фонд',
      value: '$3,200',
      change: '+8.5%',
      changeType: 'positive'
    },
    {
      label: 'Инвестиции',
      value: '$8,100',
      change: '+12.3%',
      changeType: 'positive'
    },
    {
      label: 'Долги',
      value: '$1,150',
      change: '-25.0%',
      changeType: 'positive'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security' | 'achievements'>('overview');
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'ru',
    currency: 'USD'
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView style={[styles.container, isDark ? styles.containerDark : null]}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.nickname?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isDark ? styles.userNameDark : null]}>
              {currentUser?.nickname || 'Пользователь'}
            </Text>
            <Text style={[styles.userEmail, isDark ? styles.userEmailDark : null]}>
              {currentUser?.id || 'user@example.com'}
            </Text>
            <Text style={[styles.memberSince, isDark ? styles.memberSinceDark : null]}>
              Участник с января 2024
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabs, isDark ? styles.tabsDark : null]}>
        {[
          { key: 'overview', label: 'Обзор' },
          { key: 'achievements', label: 'Достижения' },
          { key: 'settings', label: 'Настройки' },
          { key: 'security', label: 'Безопасность' }
        ].map(({ key, label }) => (
          <Pressable
            key={key}
            style={[
              styles.tab,
              activeTab === key ? styles.tabActive : null
            ]}
            onPress={() => setActiveTab(key as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === key ? styles.tabTextActive : null
            ]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <View>
          {/* Statistics */}
          <View style={[styles.section, isDark ? styles.sectionDark : null]}>
            <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
              Статистика
            </Text>
            <View style={styles.statsGrid}>
              {statistics.map((stat, index) => (
                <View key={index} style={[styles.statCard, isDark ? styles.statCardDark : null]}>
                  <Text style={[styles.statLabel, isDark ? styles.statLabelDark : null]}>
                    {stat.label}
                  </Text>
                  <Text style={[styles.statValue, isDark ? styles.statValueDark : null]}>
                    {stat.value}
                  </Text>
                  <Text style={[
                    styles.statChange,
                    { color: getChangeColor(stat.changeType) }
                  ]}>
                    {stat.change}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={[styles.section, isDark ? styles.sectionDark : null]}>
            <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
              Недавняя активность
            </Text>
            <View style={styles.activityList}>
              <View style={[styles.activityItem, isDark ? styles.activityItemDark : null]}>
                <Text style={styles.activityIcon}>💰</Text>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, isDark ? styles.activityTitleDark : null]}>
                    Пополнение резервного фонда
                  </Text>
                  <Text style={[styles.activityTime, isDark ? styles.activityTimeDark : null]}>
                    2 часа назад
                  </Text>
                </View>
                <Text style={[styles.activityAmount, { color: '#10b981' }]}>
                  +$500
                </Text>
              </View>
              
              <View style={[styles.activityItem, isDark ? styles.activityItemDark : null]}>
                <Text style={styles.activityIcon}>📈</Text>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, isDark ? styles.activityTitleDark : null]}>
                    Инвестиция в ETF
                  </Text>
                  <Text style={[styles.activityTime, isDark ? styles.activityTimeDark : null]}>
                    1 день назад
                  </Text>
                </View>
                <Text style={[styles.activityAmount, { color: '#3b82f6' }]}>
                  +$1,000
                </Text>
              </View>
              
              <View style={[styles.activityItem, isDark ? styles.activityItemDark : null]}>
                <Text style={styles.activityIcon}>📝</Text>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, isDark ? styles.activityTitleDark : null]}>
                    Запись в дневнике
                  </Text>
                  <Text style={[styles.activityTime, isDark ? styles.activityTimeDark : null]}>
                    2 дня назад
                  </Text>
                </View>
                <Text style={[styles.activityAmount, { color: '#6b7280' }]}>
                  —
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <View style={[styles.section, isDark ? styles.sectionDark : null]}>
          <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
            Достижения ({achievements.length})
          </Text>
          <View style={styles.achievementsList}>
            {achievements.map(achievement => (
              <View key={achievement.id} style={[styles.achievement, isDark ? styles.achievementDark : null]}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, isDark ? styles.achievementTitleDark : null]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, isDark ? styles.achievementDescriptionDark : null]}>
                    {achievement.description}
                  </Text>
                  <Text style={[styles.achievementDate, isDark ? styles.achievementDateDark : null]}>
                    Получено: {achievement.unlockedAt}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <View style={[styles.section, isDark ? styles.sectionDark : null]}>
          <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
            Настройки
          </Text>
          
          <View style={styles.settingsList}>
            <View style={[styles.settingItem, isDark ? styles.settingItemDark : null]}>
              <Text style={[styles.settingLabel, isDark ? styles.settingLabelDark : null]}>
                Уведомления
              </Text>
              <Pressable
                style={[
                  styles.toggle,
                  settings.notifications ? styles.toggleActive : null
                ]}
                onPress={() => updateSetting('notifications', !settings.notifications)}
              >
                <View style={[
                  styles.toggleThumb,
                  settings.notifications ? styles.toggleThumbActive : null
                ]} />
              </Pressable>
            </View>
            
            <View style={[styles.settingItem, isDark ? styles.settingItemDark : null]}>
              <Text style={[styles.settingLabel, isDark ? styles.settingLabelDark : null]}>
                Темная тема
              </Text>
              <Pressable
                style={[
                  styles.toggle,
                  settings.darkMode ? styles.toggleActive : null
                ]}
                onPress={() => updateSetting('darkMode', !settings.darkMode)}
              >
                <View style={[
                  styles.toggleThumb,
                  settings.darkMode ? styles.toggleThumbActive : null
                ]} />
              </Pressable>
            </View>
            
            <View style={[styles.settingItem, isDark ? styles.settingItemDark : null]}>
              <Text style={[styles.settingLabel, isDark ? styles.settingLabelDark : null]}>
                Язык
              </Text>
              <View style={styles.selectContainer}>
                <Text style={[styles.selectText, isDark ? styles.selectTextDark : null]}>
                  Русский
                </Text>
              </View>
            </View>
            
            <View style={[styles.settingItem, isDark ? styles.settingItemDark : null]}>
              <Text style={[styles.settingLabel, isDark ? styles.settingLabelDark : null]}>
                Валюта
              </Text>
              <View style={styles.selectContainer}>
                <Text style={[styles.selectText, isDark ? styles.selectTextDark : null]}>
                  USD ($)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <View style={[styles.section, isDark ? styles.sectionDark : null]}>
          <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
            Безопасность
          </Text>
          
          <View style={styles.securityList}>
            <View style={[styles.securityItem, isDark ? styles.securityItemDark : null]}>
              <Text style={[styles.securityLabel, isDark ? styles.securityLabelDark : null]}>
                Сменить пароль
              </Text>
              <Pressable style={styles.securityButton}>
                <Text style={styles.securityButtonText}>Изменить</Text>
              </Pressable>
            </View>
            
            <View style={[styles.securityItem, isDark ? styles.securityItemDark : null]}>
              <Text style={[styles.securityLabel, isDark ? styles.securityLabelDark : null]}>
                Двухфакторная аутентификация
              </Text>
              <Pressable style={styles.securityButton}>
                <Text style={styles.securityButtonText}>Настроить</Text>
              </Pressable>
            </View>
            
            <View style={[styles.securityItem, isDark ? styles.securityItemDark : null]}>
              <Text style={[styles.securityLabel, isDark ? styles.securityLabelDark : null]}>
                Активные сессии
              </Text>
              <Pressable style={styles.securityButton}>
                <Text style={styles.securityButtonText}>Просмотреть</Text>
              </Pressable>
            </View>
          </View>
          
          <View style={styles.dangerZone}>
            <Text style={[styles.dangerTitle, isDark ? styles.dangerTitleDark : null]}>
              Опасная зона
            </Text>
            <Pressable style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userNameDark: {
    color: '#f9fafb',
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  userEmailDark: {
    color: '#9ca3af',
  },
  memberSince: {
    fontSize: 14,
    color: '#9ca3af',
  },
  memberSinceDark: {
    color: '#6b7280',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tabsDark: {
    backgroundColor: '#21262d',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardDark: {
    backgroundColor: '#21262d',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statValueDark: {
    color: '#f9fafb',
  },
  statChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItemDark: {
    backgroundColor: '#21262d',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityTitleDark: {
    color: '#f9fafb',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityTimeDark: {
    color: '#9ca3af',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsList: {
    gap: 12,
  },
  achievement: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementDark: {
    backgroundColor: '#21262d',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  achievementTitleDark: {
    color: '#f9fafb',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  achievementDescriptionDark: {
    color: '#9ca3af',
  },
  achievementDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  achievementDateDark: {
    color: '#6b7280',
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItemDark: {
    backgroundColor: '#21262d',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  settingLabelDark: {
    color: '#f9fafb',
  },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  selectContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  selectText: {
    fontSize: 14,
    color: '#1f2937',
  },
  selectTextDark: {
    color: '#f9fafb',
  },
  securityList: {
    gap: 12,
    marginBottom: 24,
  },
  securityItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  securityItemDark: {
    backgroundColor: '#21262d',
  },
  securityLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  securityLabelDark: {
    color: '#f9fafb',
  },
  securityButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  securityButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 12,
  },
  dangerTitleDark: {
    color: '#f87171',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;
