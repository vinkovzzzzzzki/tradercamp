// Toast component - exact reproduction of current toast structure
import React from 'react';
import { View, Text } from 'react-native';
import type { Toast as ToastType } from '../../state/types';

interface ToastProps {
  toast: ToastType | null;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <View style={[
      { position: 'absolute', top: 70, left: 20, right: 20, padding: 12, borderRadius: 8, backgroundColor: '#0f1520', borderWidth: 1, borderColor: '#1f2a36', zIndex: 1000 },
      toast.kind === 'warning' ? { borderColor: '#ef4444', backgroundColor: '#2b0f12' } : null,
      toast.kind === 'error' ? { borderColor: '#ef4444', backgroundColor: '#2b0f12' } : null
    ]}>
      <Text style={{ color: '#e6edf3', fontSize: 13, textAlign: 'center' }}>
        {toast.msg}
      </Text>
    </View>
  );
};

export default Toast;
