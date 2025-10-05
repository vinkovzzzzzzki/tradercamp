import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

export const ensureNotificationPermissions = async () => {
  if (Platform.OS === 'web') {
    Alert.alert('Уведомления', 'Фоновые уведомления на вебе ограничены. Для надёжной работы используйте мобильное приложение.');
    return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const tryScheduleReminder = async (isoDateTime, minutesBefore, title, body) => {
  try {
    if (!isoDateTime || !minutesBefore) return;
    const ok = await ensureNotificationPermissions();
    if (!ok) return;
    const when = new Date(isoDateTime);
    if (Number.isNaN(when.getTime())) return;
    const triggerDate = new Date(when.getTime() - minutesBefore * 60 * 1000);
    if (triggerDate.getTime() <= Date.now()) return; // skip past times
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: triggerDate,
    });
  } catch {}
};

export const scheduleNotification = async (content, trigger) => {
  try {
    const ok = await ensureNotificationPermissions();
    if (!ok) return null;
    return await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });
  } catch {
    return null;
  }
};

export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
};
