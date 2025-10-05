// Header component - exact reproduction of current header structure
import React from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { TabType, User } from '../../state/types';

interface HeaderProps {
  tab: TabType;
  openDropdown: string | null;
  currentUser: User | null;
  isDark: boolean;
  onTabClick: (tab: TabType) => void;
  onTabHover: (tab: TabType) => void;
  onTabLeave: (tab: TabType) => void;
  onLogout: () => void;
  tabAnimation: Animated.Value;
  dropdownAnimations: Record<string, Animated.Value>;
  buttonAnimations: Record<string, Animated.Value>;
}

const Header: React.FC<HeaderProps> = ({
  tab,
  openDropdown,
  currentUser,
  isDark,
  onTabClick,
  onTabHover,
  onTabLeave,
  onLogout,
  tabAnimation,
  dropdownAnimations,
  buttonAnimations
}) => {
  const tabs = [
    { 
      key: 'finance' as TabType, 
      label: 'Финансы',
      dropdown: [
        { label: 'Обзор', action: () => onTabClick('finance') },
        { label: 'Резервный фонд', action: () => onTabClick('finance') },
        { label: 'Инвестиции', action: () => onTabClick('finance') },
        { label: 'Долги', action: () => onTabClick('finance') },
        { label: 'Аналитика', action: () => onTabClick('finance') }
      ]
    },
    { 
      key: 'journal' as TabType, 
      label: 'Дневник',
      dropdown: [
        { label: 'Записи', action: () => onTabClick('journal') },
        { label: 'Цели', action: () => onTabClick('journal') },
        { label: 'Достижения', action: () => onTabClick('journal') },
        { label: 'Рефлексия', action: () => onTabClick('journal') }
      ]
    },
    { 
      key: 'planner' as TabType, 
      label: 'Планер',
      dropdown: [
        { label: 'Календарь', action: () => onTabClick('planner') },
        { label: 'Задачи', action: () => onTabClick('planner') },
        { label: 'Привычки', action: () => onTabClick('planner') },
        { label: 'Планы', action: () => onTabClick('planner') }
      ]
    },
    { 
      key: 'community' as TabType, 
      label: 'Сообщество',
      dropdown: [
        { label: 'Лента', action: () => onTabClick('community') },
        { label: 'Друзья', action: () => onTabClick('community') },
        { label: 'Группы', action: () => onTabClick('community') },
        { label: 'Чат', action: () => onTabClick('community') }
      ]
    },
    { 
      key: 'profile' as TabType, 
      label: 'Профиль',
      dropdown: [
        { label: 'Настройки', action: () => onTabClick('profile') },
        { label: 'Статистика', action: () => onTabClick('profile') },
        { label: 'Безопасность', action: () => onTabClick('profile') },
        { label: 'Выйти', action: onLogout }
      ]
    },
  ];

  return (
    <View style={[
      styles.header,
      isDark ? styles.headerDark : null
    ]}>
      <StatusBar style="dark" />
      
      {/* Sticky top bar */}
      <View style={[
        styles.stickyTopBar,
        isDark ? styles.stickyTopBarDark : null
      ]}>
        <View style={{ flex: 1 }} />
      </View>
      
      {/* Static logo in header (does not scroll) */}
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <Image
          source={require('../../../assets/investcamp-logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>
      
      {/* Static navigation tabs with dropdowns */}
      <View style={[
        { flexDirection: 'row', backgroundColor: '#1b2430', borderRadius: 10, padding: 4, marginHorizontal: 20, marginBottom: 10, position: 'relative' },
        isDark ? { backgroundColor: '#1b2430' } : null
      ]}>
        {tabs.map(({ key, label, dropdown }) => (
          <View key={key} style={{ flex: 1, position: 'relative' }}>
            <Animated.View style={{ flex: 1 }}>
              <Pressable 
                style={[
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center' },
                  tab === key ? { backgroundColor: '#1f6feb' } : { backgroundColor: 'transparent' }
                ]} 
                onPress={() => onTabClick(key)}
                onHoverIn={() => onTabHover(key)}
                onHoverOut={() => onTabLeave(key)}
              >
                <Text style={[
                  { fontSize: 12, fontWeight: '600' },
                  tab === key ? { color: '#fff' } : { color: '#9fb0c0' }
                ]}>
                  {label}
                </Text>
              </Pressable>
            </Animated.View>
            
            {/* Dropdown menu */}
            {openDropdown === key && (
              <Animated.View style={[
                styles.dropdown,
                isDark ? styles.dropdownDark : null
              ]}>
                {dropdown.map((item, index) => (
                  <Pressable
                    key={index}
                    style={styles.dropdownItem}
                    onPress={item.action}
                  >
                    <Text style={[
                      styles.dropdownText,
                      isDark ? styles.dropdownTextDark : null
                    ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </View>
        ))}
      </View>
      
      {/* Auth status */}
      {currentUser && (
        <View style={styles.authStatus}>
          <Text style={styles.authStatusText}>
            Добро пожаловать, {currentUser.nickname}!
          </Text>
          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Выйти</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#121820',
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2a36',
  },
  headerDark: {
    backgroundColor: '#121820',
    borderBottomColor: '#1f2a36',
  },
  stickyTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  stickyTopBarDark: {
    backgroundColor: '#121820',
  },
  authStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  authStatusText: {
    fontSize: 12,
    color: '#9fb0c0',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  brandLogo: {
    width: 280,
    height: 120,
    alignSelf: 'center',
    marginBottom: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a202c',
    borderRadius: 8,
    padding: 4,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownDark: {
    backgroundColor: '#1a202c',
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dropdownText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  dropdownTextDark: {
    color: '#e2e8f0',
  },
});

export default Header;