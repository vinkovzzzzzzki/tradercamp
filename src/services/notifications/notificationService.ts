// Notification service - exact reproduction of original notification logic
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger?: Notifications.NotificationTriggerInput;
}

// Request permissions for notifications
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Schedule a notification
export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: any
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: triggerDate,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

// Schedule workout reminder
export async function scheduleWorkoutReminder(
  workout: {
    id: number;
    date: string;
    time: string;
    type: string;
    remindBefore: number;
  }
): Promise<string | null> {
  const workoutDateTime = new Date(`${workout.date}T${workout.time}`);
  const reminderTime = new Date(workoutDateTime.getTime() - (workout.remindBefore * 60 * 1000));
  
  // Don't schedule if reminder time is in the past
  if (reminderTime <= new Date()) {
    return null;
  }

  const title = 'Напоминание о тренировке';
  const body = `Через ${workout.remindBefore} минут: ${workout.type}`;
  
  return scheduleNotification(title, body, reminderTime, {
    type: 'workout',
    workoutId: workout.id,
  });
}

// Schedule event reminder
export async function scheduleEventReminder(
  event: {
    id: number;
    date: string;
    time: string;
    title: string;
    remindBefore: number;
  }
): Promise<string | null> {
  const eventDateTime = new Date(`${event.date}T${event.time}`);
  const reminderTime = new Date(eventDateTime.getTime() - (event.remindBefore * 60 * 1000));
  
  // Don't schedule if reminder time is in the past
  if (reminderTime <= new Date()) {
    return null;
  }

  const title = 'Напоминание о событии';
  const body = `Через ${event.remindBefore} минут: ${event.title}`;
  
  return scheduleNotification(title, body, reminderTime, {
    type: 'event',
    eventId: event.id,
  });
}

// Cancel a notification
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

// Get all scheduled notifications
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

// Add notification listener
export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

// Add notification response listener (when user taps notification)
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// Remove notification listener
export function removeNotificationListener(subscription: Notifications.Subscription): void {
  Notifications.removeNotificationSubscription(subscription);
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

// Get notification settings
export async function getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus | null> {
  try {
    return await Notifications.getPermissionsAsync();
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return null;
  }
}
