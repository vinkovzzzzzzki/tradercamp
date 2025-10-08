// Header component - simple and reliable dropdown implementation
import React from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { TabType, User, FinanceViewType, JournalViewType, CalendarViewType } from '../../state/types';

interface HeaderProps {
  tab: TabType;
  openDropdown: string | null;
  currentUser: User | null;
  isDark: boolean;
  onTabClick: (tab: TabType) => void;
  onOpenDropdown: (tab: string | null) => void;
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
  onOpenDropdown,
  onLogout,
  onFinanceViewChange,
  onJournalViewChange,
  onPlannerViewChange,
  tabAnimation,
  dropdownAnimations,
  buttonAnimations
}) => {
  const tabs = [
    { 
      key: 'finance' as TabType, 
      label: 'Финансы',
      hasDropdown: true,
      dropdown: [
        { label: 'Обзор', action: () => { onTabClick('finance'); onFinanceViewChange?.('summary'); onOpenDropdown(null); } },
        { label: 'Подушка безопасности', action: () => { onTabClick('finance'); onFinanceViewChange?.('fund'); onOpenDropdown(null); } },
        { label: 'Инвестиции', action: () => { onTabClick('finance'); onFinanceViewChange?.('invest'); onOpenDropdown(null); } },
        { label: 'Долги', action: () => { onTabClick('finance'); onFinanceViewChange?.('debts'); onOpenDropdown(null); } },
        { label: 'История транзакций', action: () => { onTabClick('finance'); onFinanceViewChange?.('transactions'); onOpenDropdown(null); } }
      ]
    },
    { 
      key: 'journal' as TabType, 
      label: 'Дневник',
      hasDropdown: false
    },
    { 
      key: 'planner' as TabType, 
      label: 'Планер',
      hasDropdown: false
    },
    { 
      key: 'community' as TabType, 
      label: 'Сообщество',
      hasDropdown: false
    },
    { 
      key: 'profile' as TabType, 
      label: 'Профиль',
      hasDropdown: false
    },
  ];

  const handleButtonClick = (key: string, hasDropdown: boolean) => {
    if (!hasDropdown) {
      // For tabs without dropdown, just switch tab
      onTabClick(key as TabType);
      onOpenDropdown(null);
    } else {
      // For tabs with dropdown, toggle dropdown
      if (openDropdown === key) {
        onOpenDropdown(null); // Close if already open
      } else {
        onOpenDropdown(key); // Open dropdown
      }
    }
  };

  return (
    <View style={[
      styles.header,
      isDark ? styles.headerDark : null
    ]}>
      <StatusBar style="light" />
      
      {/* Static logo in header */}
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <Image
          source={require('../../../assets/investcamp-logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>
      
      {/* Static navigation tabs with dropdowns */}
      <View style={[
        styles.tabsContainer,
        isDark ? { backgroundColor: '#1b2430' } : null
      ]}>
        {tabs.map(({ key, label, hasDropdown, dropdown }) => (
          <View 
            key={key} 
            style={styles.tabWrapper}
          >
            {/* Tab button */}
            <Pressable 
              style={[
                styles.tabButton,
                tab === key ? styles.tabButtonActive : null
              ]} 
              onPress={() => handleButtonClick(key, hasDropdown)}
            >
              <Text style={[
                styles.tabButtonText,
                tab === key ? styles.tabButtonTextActive : null
              ]}>
                {label}
              </Text>
            </Pressable>
            
            {/* Dropdown menu - only for tabs with hasDropdown */}
            {hasDropdown && openDropdown === key && dropdown && (
              <View style={[
                styles.dropdown,
                isDark ? styles.dropdownDark : null
              ]}>
                {dropdown.map((item, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && styles.dropdownItemPressed
                    ]}
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
    position: 'relative',
    zIndex: 1000,
  },
  headerDark: {
    backgroundColor: '#121820',
    borderBottomColor: '#1f2a36',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1b2430',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 10,
    position: 'relative',
    zIndex: 1001,
  },
  tabWrapper: {
    flex: 1,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#1f6feb',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9fb0c0',
  },
  tabButtonTextActive: {
    color: '#fff',
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
    elevation: 10,
    zIndex: 10000,
  },
  dropdownDark: {
    backgroundColor: '#1a202c',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dropdownItemPressed: {
    backgroundColor: '#374151',
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
