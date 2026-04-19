"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import type {
  Reminder,
  ReminderPriority,
  ReminderRepeat,
} from "@/types";

export type ReminderSavePayload = Omit<Reminder, "id" | "createdAt">;

function timeToInput(t: string): string {
  if (!t || !t.includes(":")) return "09:00";
  const [h, m] = t.split(":").map(Number);
  return `${h.toString().padStart(2, "0")}:${(m ?? 0).toString().padStart(2, "0")}`;
}

function localDateString(d: Date) {
  const y = d.getFullYear();
  const mo = (d.getMonth() + 1).toString().padStart(2, "0");
  const da = d.getDate().toString().padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function ReminderModalForm({
  date,
  reminder,
  onClose,
  onSave,
}: {
  date: string;
  reminder?: Reminder;
  onClose: () => void;
  onSave: (r: ReminderSavePayload) => void;
}) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(() => reminder?.title ?? "");
  const [description, setDescription] = useState(
    () => reminder?.description ?? "",
  );
  const [selectedDate, setSelectedDate] = useState(
    () => (reminder?.date ?? date) || localDateString(new Date()),
  );
  const [time, setTime] = useState(() => timeToInput(reminder?.time ?? "09:00"));
  const [hasEndTime, setHasEndTime] = useState(() => !!reminder?.endTime);
  const [endTime, setEndTime] = useState(() =>
    timeToInput(reminder?.endTime ?? "10:00"),
  );
  const [repeat, setRepeat] = useState<ReminderRepeat>(
    () => reminder?.repeat ?? "none",
  );
  const [priority, setPriority] = useState<ReminderPriority>(
    () => reminder?.priority ?? "medium",
  );
  const [enableSound, setEnableSound] = useState(
    () => reminder?.enableSound !== false,
  );
  const [enableVibration, setEnableVibration] = useState(
    () => reminder?.enableVibration !== false,
  );
  const [advanceNotice, setAdvanceNotice] = useState(
    () => reminder?.advanceNotice ?? 0,
  );
  const [endDate, setEndDate] = useState(() => reminder?.endDate ?? "");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    () => reminder?.selectedDays ?? [0, 1, 2, 3, 4, 5, 6],
  );

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      }
      return [...prev, day].sort();
    });
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date: selectedDate,
      time,
      endTime: hasEndTime ? endTime : undefined,
      repeat,
      priority,
      enableSound,
      enableVibration,
      advanceNotice,
      endDate: repeat !== "none" && endDate ? endDate : undefined,
      selectedDays:
        repeat === "daily" || repeat === "weekly" ? selectedDays : undefined,
    });
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-2 p-4 shadow-xl sm:rounded-2xl"
        style={{ backgroundColor: theme.card, borderColor: theme.border }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: theme.text }}>
            {reminder ? "Edit reminder" : "New reminder"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1"
            style={{ color: theme.textSecondary }}
            aria-label="Close"
          >
            <X className="size-6" />
          </button>
        </div>

        <label className="block text-sm font-medium" style={{ color: theme.text }}>
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
        />

        <label
          className="mt-3 block text-sm font-medium"
          style={{ color: theme.text }}
        >
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
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium" style={{ color: theme.text }}>
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
          <div>
            <label className="text-sm font-medium" style={{ color: theme.text }}>
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
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasEndTime}
            onChange={(e) => setHasEndTime(e.target.checked)}
          />
          <span style={{ color: theme.text }}>End time</span>
        </label>
        {hasEndTime ? (
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-2 w-full rounded-lg border-2 px-2 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          />
        ) : null}

        <label className="mt-3 block text-sm font-medium" style={{ color: theme.text }}>
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

        {(repeat === "daily" || repeat === "weekly") && (
          <div className="mt-3">
            <p className="text-sm font-medium" style={{ color: theme.text }}>
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
          <div className="mt-3">
            <label className="text-sm font-medium" style={{ color: theme.text }}>
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

        <label className="mt-3 block text-sm font-medium" style={{ color: theme.text }}>
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

        <label className="mt-3 block text-sm font-medium" style={{ color: theme.text }}>
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

        <div className="mt-3 flex flex-col gap-2">
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

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border-2 py-3 font-semibold"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 rounded-lg py-3 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReminderModal({
  visible,
  date,
  onClose,
  onSave,
  reminder,
}: {
  visible: boolean;
  date: string;
  onClose: () => void;
  onSave: (r: ReminderSavePayload) => void;
  reminder?: Reminder;
}) {
  if (!visible) return null;

  return (
    <ReminderModalForm
      key={`${reminder?.id ?? "new"}-${date}`}
      date={date}
      reminder={reminder}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
