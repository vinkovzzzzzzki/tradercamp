import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

interface FabAction {
  label: string;
  onPress: () => void;
  color?: string;
}

interface FABProps {
  actions: FabAction[];
}

const FAB: React.FC<FABProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ position: 'absolute', right: 20, bottom: 20, zIndex: 1000, alignItems: 'flex-end', gap: 8 }}>
      {open && actions.map((a, idx) => (
        <Pressable
          key={idx}
          onPress={() => { setOpen(false); a.onPress(); }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: a.color || '#1f6feb'
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{a.label}</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#3b82f6',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}
      >
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 28 }}>+</Text>
      </Pressable>
    </View>
  );
};

export default FAB;


