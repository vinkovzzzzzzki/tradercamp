import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

interface AuthProps {
  isDark: boolean;
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  authMode: 'login' | 'register';
  setAuthMode: (m: 'login' | 'register') => void;
  handleSignIn: () => Promise<void> | void;
  handleSignUp: () => Promise<void> | void;
  handleResetPassword: () => Promise<void> | void;
}

const Auth: React.FC<AuthProps> = ({ isDark, authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode, handleSignIn, handleSignUp, handleResetPassword }) => {
  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      <View style={styles.card}>
        <Text style={[styles.title, isDark ? styles.titleDark : null]}>Авторизация</Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Email"
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          autoCapitalize="none"
          keyboardType="email-address"
          value={authEmail}
          onChangeText={setAuthEmail}
        />
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Пароль"
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          secureTextEntry
          value={authPassword}
          onChangeText={setAuthPassword}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {authMode === 'login' ? (
            <>
              <Pressable style={styles.button} onPress={() => handleSignIn()}>
                <Text style={styles.buttonText}>Войти</Text>
              </Pressable>
              <Pressable style={styles.buttonSecondary} onPress={() => setAuthMode('register')}>
                <Text style={styles.buttonText}>Регистрация</Text>
              </Pressable>
              <Pressable style={styles.buttonSecondary} onPress={() => handleResetPassword()}>
                <Text style={styles.buttonText}>Сброс</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.button} onPress={() => handleSignUp()}>
                <Text style={styles.buttonText}>Создать аккаунт</Text>
              </Pressable>
              <Pressable style={styles.buttonSecondary} onPress={() => setAuthMode('login')}>
                <Text style={styles.buttonText}>У меня есть аккаунт</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0b0f14' },
  darkContainer: { backgroundColor: '#0b0f14' },
  card: { backgroundColor: '#121820', borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  titleDark: { color: '#e6edf3' },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#e6edf3',
    backgroundColor: '#1f2937',
    marginBottom: 10,
  },
  inputDark: { borderColor: '#374151', backgroundColor: '#1f2937', color: '#e6edf3' },
  button: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  buttonSecondary: { backgroundColor: '#374151', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default Auth;

