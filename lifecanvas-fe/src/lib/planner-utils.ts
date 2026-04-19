import type { Reminder } from "@/types";

export function getRecurringDates(
  reminder: Reminder,
  maxDays: number = 365,
): string[] {
  const dates: string[] = [];
  const startDate = new Date(reminder.date);
  const endDate = reminder.endDate
    ? new Date(reminder.endDate + "T23:59:59")
    : new Date(startDate.getTime() + maxDays * 24 * 60 * 60 * 1000);
  const currentDate = new Date(startDate);
  const maxIterations = 1000;
  let iterations = 0;

  if (!reminder.repeat || reminder.repeat === "none") {
    return [reminder.date];
  }

  while (currentDate <= endDate && iterations < maxIterations) {
    iterations++;
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayOfWeek = currentDate.getDay();

    if (reminder.repeat === "daily" || reminder.repeat === "weekly") {
      if (reminder.selectedDays?.includes(dayOfWeek)) {
        dates.push(dateStr);
      }
    } else if (reminder.repeat === "monthly") {
      if (currentDate.getDate() === startDate.getDate()) {
        dates.push(dateStr);
      }
    } else if (reminder.repeat === "yearly") {
      if (
        currentDate.getMonth() === startDate.getMonth() &&
        currentDate.getDate() === startDate.getDate()
      ) {
        dates.push(dateStr);
      }
    }

    if (reminder.repeat === "daily") {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (reminder.repeat === "weekly") {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (reminder.repeat === "monthly") {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (reminder.repeat === "yearly") {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
  }

  return dates;
}
