import * as Notifications from 'expo-notifications';

const DAILY_REMINDER_HOUR = 20;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function syncDailyReminder(
  enabled: boolean,
  requestPermission = false
): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return false;

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted' && requestPermission) {
    permissions = await Notifications.requestPermissionsAsync();
  }

  if (permissions.status !== 'granted') return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'LustLock',
      body: 'Take a quiet moment to check in and stay grounded.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: DAILY_REMINDER_HOUR,
      minute: 0,
    },
  });

  return true;
}
