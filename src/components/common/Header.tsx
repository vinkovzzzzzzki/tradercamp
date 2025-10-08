// Header component - exact reproduction of current header structure
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { TabType, User, FinanceViewType, JournalViewType, CalendarViewType } from '../../state/types';

interface HeaderProps {
  tab: TabType;
  openDropdown: string | null;
  currentUser: User | null;
  isDark: boolean;
  onTabClick: (tab: TabType) => void;
  onTabHover: (tab: TabType) => void;
  onTabLeave: (tab: TabType) => void;
  onDropdownEnter: () => void;
  onDropdownLeave: () => void;
  onLogout: () => void;
  onFinanceViewChange?: (view: FinanceViewType) => void;
  onJournalViewChange?: (view: JournalViewType) => void;
  onPlannerViewChange?: (view: CalendarViewType) => void;
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
  onDropdownEnter,
  onDropdownLeave,
  onLogout,
  onFinanceViewChange,
  onJournalViewChange,
  onPlannerViewChange,
  tabAnimation,
  dropdownAnimations,
  buttonAnimations
}) => {
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRefs = useRef<Record<string, any>>({});

  const tabs = [
    { 
      key: 'finance' as TabType, 
      label: 'Финансы',
      dropdown: [
        { label: 'Обзор', action: () => { onTabClick('finance'); onFinanceViewChange?.('summary'); } },
        { label: 'Подушка безопасности', action: () => { onTabClick('finance'); onFinanceViewChange?.('fund'); } },
        { label: 'Инвестиции', action: () => { onTabClick('finance'); onFinanceViewChange?.('invest'); } },
        { label: 'Долги', action: () => { onTabClick('finance'); onFinanceViewChange?.('debts'); } }
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

  // Update dropdown position when it opens
  useEffect(() => {
    if (openDropdown && buttonRefs.current[openDropdown]) {
      const button = buttonRefs.current[openDropdown];
      if (button && button.measure) {
        button.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setDropdownPosition({
            top: pageY + height,
            left: pageX,
            width: width
          });
        });
      }
    }
  }, [openDropdown]);

  return (
    <View style={[
      styles.header,
      { overflow: 'visible' },
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
        { flexDirection: 'row', backgroundColor: '#1b2430', borderRadius: 10, padding: 4, marginHorizontal: 20, marginBottom: 150, overflow: 'visible' },
        isDark ? { backgroundColor: '#1b2430' } : null
      ]}>
        {tabs.map(({ key, label, dropdown }) => (
          <View 
            key={key} 
            style={{ flex: 1, position: 'relative', overflow: 'visible' }}
            {...({
              onMouseEnter: () => onTabHover(key),
              onMouseLeave: () => onTabLeave(key),
            } as any)}
          >
            <Pressable 
              ref={ref => buttonRefs.current[key] = ref}
              style={[
                { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center' },
                tab === key ? { backgroundColor: '#1f6feb' } : { backgroundColor: 'transparent' }
              ]} 
              onPress={() => onTabClick(key)}
            >
              <Text style={[
                { fontSize: 12, fontWeight: '600' },
                tab === key ? { color: '#fff' } : { color: '#9fb0c0' }
              ]}>
                {label}
              </Text>
            </Pressable>
            
            {/* Dropdown menu - positioned absolutely relative to parent */}
            {openDropdown === key && (
              <View
                {...({
                  style: [
                    styles.dropdownAbsolute,
                    isDark ? styles.dropdownDark : null
                  ],
                  pointerEvents: 'auto',
                  onMouseEnter: onDropdownEnter,
                  onMouseLeave: onDropdownLeave,
                } as any)}
              >
                {dropdown.map((item, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed, hovered }: any) => [
                      styles.dropdownItem,
                      (pressed || hovered) && { backgroundColor: '#374151' }
                    ]}
                    onPress={item.action}
                    onHoverIn={() => {}}
                    onHoverOut={() => {}}
                  >
                    <Text style={[
                      styles.dropdownText,
                      isDark ? styles.dropdownTextDark : null
                    ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
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
  dropdownAbsolute: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    minWidth: 150,
    backgroundColor: '#1a202c',
    borderRadius: 8,
    padding: 4,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 999,
    zIndex: 999999,
  },
  dropdownDark: {
    backgroundColor: '#1a202c',
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    cursor: 'pointer',
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