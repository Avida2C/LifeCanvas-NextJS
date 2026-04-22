/**
 * Web stub: browser push scheduling is not wired. Reminders still persist in storage.
 */
export async function scheduleReminderNotification(
  title: string,
  description: string | undefined,
  date: string,
  time: string,
): Promise<string | null> {
  void title;
  void description;
  void date;
  void time;
  return null;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  void notificationId;
  return;
}
