// Tabs component - exact reproduction of current tabs structure
import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { TabType } from '../../state/types';

interface TabsProps {
  tab: TabType;
  openDropdown: string | null;
  isDark: boolean;
  onTabClick: (tab: TabType) => void;
  onTabHover: (tab: TabType) => void;
  onTabLeave: (tab: TabType) => void;
  tabAnimation: Animated.Value;
  dropdownAnimations: Record<string, Animated.Value>;
  buttonAnimations: Record<string, Animated.Value>;
}

const Tabs: React.FC<TabsProps> = ({
  tab,
  openDropdown,
  isDark,
  onTabClick,
  onTabHover,
  onTabLeave,
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
  );
};

export default Tabs;
