"use client";

import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import {
  cancelNotification,
  scheduleReminderNotification,
} from "@/lib/notifications";
import { getReminders, saveReminder } from "@/lib/storage";
import type { Reminder, ReminderPriority, ReminderRepeat } from "@/types";

function localDateString(d: Date) {
  const y = d.getFullYear();
  const mo = (d.getMonth() + 1).toString().padStart(2, "0");
  const da = d.getDate().toString().padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/** Normalizes persisted reminder times into HH:mm for input controls. */
function timeToInput(t: string): string {
  if (!t || !t.includes(":")) return "09:00";
  const [h, m] = t.split(":").map(Number);
  return `${h.toString().padStart(2, "0")}:${(m ?? 0).toString().padStart(2, "0")}`;
}

function ReminderEditorInner() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? undefined;
  const dateParam = searchParams.get("date");

  const [existingReminder, setExistingReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dateParam || localDateString(new Date()),
  );
  const [allDay, setAllDay] = useState(false);
  const [time, setTime] = useState("09:00");
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endTime, setEndTime] = useState("10:00");
  const [repeat, setRepeat] = useState<ReminderRepeat>("none");
  const [priority, setPriority] = useState<ReminderPriority>("medium");
  const [enableSound, setEnableSound] = useState(true);
  const [enableVibration, setEnableVibration] = useState(true);
  const [advanceNotice, setAdvanceNotice] = useState(0);
  const [endDate, setEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const reminder = (await getReminders()).find((item) => item.id === id);
      if (!reminder) return;
      setExistingReminder(reminder);
      setTitle(reminder.title);
      setDescription(reminder.description ?? "");
      setSelectedDate(reminder.date);
      setAllDay(Boolean(reminder.allDay));
      setTime(timeToInput(reminder.time));
      setHasEndTime(Boolean(reminder.endTime));
      setEndTime(timeToInput(reminder.endTime ?? "10:00"));
      setRepeat(reminder.repeat ?? "none");
      setPriority(reminder.priority ?? "medium");
      setEnableSound(reminder.enableSound !== false);
      setEnableVibration(reminder.enableVibration !== false);
      setAdvanceNotice(reminder.advanceNotice ?? 0);
      setEndDate(reminder.endDate ?? "");
      setSelectedDays(reminder.selectedDays ?? [0, 1, 2, 3, 4, 5, 6]);
    })();
  }, [id]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      }
      return [...prev, day].sort();
    });
  };

  const handleSave = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    const reminderPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      date: selectedDate,
      allDay,
      time,
      endTime: !allDay && hasEndTime ? endTime : undefined,
      repeat,
      priority,
      enableSound,
      enableVibration,
      advanceNotice,
      endDate: repeat !== "none" && endDate ? endDate : undefined,
      selectedDays:
        repeat === "daily" || repeat === "weekly" ? selectedDays : undefined,
    };
    if (existingReminder) {
      if (existingReminder.notificationId) {
        await cancelNotification(existingReminder.notificationId);
      }
      const notificationId = await scheduleReminderNotification(
        reminderPayload.title,
        reminderPayload.description,
        reminderPayload.date,
        reminderPayload.time,
      );
      await saveReminder({
        ...existingReminder,
        ...reminderPayload,
        notificationId: notificationId ?? undefined,
      });
    } else {
      const notificationId = await scheduleReminderNotification(
        reminderPayload.title,
        reminderPayload.description,
        reminderPayload.date,
        reminderPayload.time,
      );
      await saveReminder({
        id: Date.now().toString(),
        ...reminderPayload,
        notificationId: notificationId ?? undefined,
        createdAt: new Date().toISOString(),
      });
    }
    setLoading(false);
    router.back();
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Reminder"
        theme={theme}
        actions={[
          {
            icon: Save,
            label: "Save",
            onClick: () => void handleSave(),
            disabled: loading || !title.trim(),
          },
        ]}
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="text-sm font-bold" style={{ color: theme.text }}>
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            placeholder="Reminder title"
          />
        </div>

        <div>
          <label className="text-sm font-bold" style={{ color: theme.text }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            placeholder="Optional details"
          />
        </div>

        <div>
          <label className="text-sm font-bold" style={{ color: theme.text }}>
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 px-2 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <span style={{ color: theme.text }}>All day</span>
        </label>

        {!allDay ? (
          <div>
            <label className="text-sm font-bold" style={{ color: theme.text }}>
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 px-2 py-2"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
              }}
            />
          </div>
        ) : null}

        {!allDay ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasEndTime}
              onChange={(e) => setHasEndTime(e.target.checked)}
            />
            <span style={{ color: theme.text }}>End time</span>
          </label>
        ) : null}

        {!allDay && hasEndTime ? (
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border-2 px-2 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          />
        ) : null}

        <div>
          <label className="text-sm font-bold" style={{ color: theme.text }}>
            Repeat
          </label>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as ReminderRepeat)}
            className="mt-1 w-full rounded-lg border-2 px-2 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {(repeat === "daily" || repeat === "weekly") && (
          <div>
            <p className="text-sm font-bold" style={{ color: theme.text }}>
              Days
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {dayLabels.map((label, idx) => (
                <button
                  key={label + idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className="size-9 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: selectedDays.includes(idx)
                      ? theme.primary
                      : theme.surface,
                    color: selectedDays.includes(idx) ? "#fff" : theme.text,
                    border: `2px solid ${theme.border}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {repeat !== "none" ? (
          <div>
            <label className="text-sm font-bold" style={{ color: theme.text }}>
              Repeat end date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 px-2 py-2"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
              }}
            />
          </div>
        ) : null}

        <div>
          <label className="text-sm font-bold" style={{ color: theme.text }}>
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as ReminderPriority)}
            className="mt-1 w-full rounded-lg border-2 px-2 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold" style={{ color: theme.text }}>
            Advance notice (minutes, 0 = off)
          </label>
          <input
            type="number"
            min={0}
            value={advanceNotice}
            onChange={(e) => setAdvanceNotice(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border-2 px-2 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          />
        </div>

        <div
          className="space-y-2 rounded-xl border-2 p-3"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
            <input
              type="checkbox"
              checked={enableSound}
              onChange={(e) => setEnableSound(e.target.checked)}
            />
            Sound (for future notifications)
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
            <input
              type="checkbox"
              checked={enableVibration}
              onChange={(e) => setEnableVibration(e.target.checked)}
            />
            Vibration (for future notifications)
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border-2 py-3 font-semibold"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || !title.trim()}
            className="flex-1 rounded-lg py-3 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
          >
            {id ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReminderEditorView() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ReminderEditorInner />
    </Suspense>
  );
}
