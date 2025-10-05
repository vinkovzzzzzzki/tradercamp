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
    { key: 'finance' as TabType, label: 'Финансы' },
    { key: 'journal' as TabType, label: 'Дневник' },
    { key: 'planner' as TabType, label: 'Планер' },
    { key: 'community' as TabType, label: 'Сообщество' },
    { key: 'profile' as TabType, label: 'Профиль' },
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
      
      {/* Static navigation tabs (does not scroll) */}
      <View style={[
        { flexDirection: 'row', backgroundColor: '#1b2430', borderRadius: 10, padding: 4, marginHorizontal: 20, marginBottom: 10 },
        isDark ? { backgroundColor: '#1b2430' } : null
      ]}>
        {tabs.map(({ key, label }) => (
          <Animated.View key={key} style={{ flex: 1 }}>
            <Pressable 
              style={[
                { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center' },
                tab === key ? { backgroundColor: '#1f6feb' } : { backgroundColor: 'transparent' }
              ]} 
              onPress={() => onTabClick(key)}
              onHoverIn={() => onTabHover(key)}
              onHoverOut={() => onTabLeave(key)}
              onPressIn={(e) => {
                // Hover effect simulation
                e.target.style.transform = 'scale(0.95)';
              }}
              onPressOut={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <Text style={[
                { fontSize: 12, fontWeight: '600' },
                tab === key ? { color: '#fff' } : { color: '#9fb0c0' }
              ]}>
                {label}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
      
      {/* Auth status */}
      {currentUser && (
        <View style={styles.authStatus}>
          <Text style={styles.authStatusText}>
            {currentUser.nickname}
          </Text>
          <Pressable 
            style={styles.logoutBtn}
            onPress={onLogout}
          >
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
});

export default Header;
