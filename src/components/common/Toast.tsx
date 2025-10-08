// Toast component - exact reproduction of current toast structure
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { Toast as ToastType } from '../../state/types';

interface ToastProps {
  toast: ToastType | null;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <View style={[
      { position: 'absolute', top: 70, left: 20, right: 20, padding: 12, borderRadius: 8, backgroundColor: '#0f1520', borderWidth: 1, borderColor: '#1f2a36', zIndex: 1000, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
      toast.kind === 'warning' ? { borderColor: '#ef4444', backgroundColor: '#2b0f12' } : null,
      toast.kind === 'error' ? { borderColor: '#ef4444', backgroundColor: '#2b0f12' } : null
    ]}>
      <Text style={{ color: '#e6edf3', fontSize: 13, flex: 1 }}>
        {toast.msg}
      </Text>
      {toast.actionLabel && toast.onAction && (
        <Pressable onPress={toast.onAction} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1f6feb' }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{toast.actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default Toast;
