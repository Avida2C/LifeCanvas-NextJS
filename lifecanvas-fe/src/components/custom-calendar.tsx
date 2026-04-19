"use client";

import { useState, type ReactNode } from "react";
import { useTheme } from "@/components/providers/theme-provider";

export type MarkedDates = Record<
  string,
  { marked: boolean; dotColor?: string }
>;

export function CustomCalendar({
  selectedDate,
  markedDates,
  onDayPress,
}: {
  selectedDate: string;
  markedDates: MarkedDates;
  onDayPress: (dateString: string) => void;
}) {
  const { theme } = useTheme();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const formatDateString = (year: number, month: number, day: number) => {
    const monthStr = (month + 1).toString().padStart(2, "0");
    const dayStr = day.toString().padStart(2, "0");
    return `${year}-${monthStr}-${dayStr}`;
  };

  const isToday = (year: number, month: number, day: number) => {
    const t = new Date();
    return (
      t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
    );
  };

  const isSelected = (year: number, month: number, day: number) =>
    selectedDate === formatDateString(year, month, day);

  const isMarked = (year: number, month: number, day: number) =>
    markedDates[formatDateString(year, month, day)]?.marked ?? false;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );
  const isCurrentMonth =
    currentYear === now.getFullYear() && currentMonth === now.getMonth();

  const cells: ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = formatDateString(currentYear, currentMonth, day);
    const dayIsToday = isToday(currentYear, currentMonth, day);
    const dayIsSelected = isSelected(currentYear, currentMonth, day);
    const dayIsMarked = isMarked(currentYear, currentMonth, day);
    cells.push(
      <button
        key={day}
        type="button"
        onClick={() => onDayPress(dateString)}
        className="relative flex aspect-square items-center justify-center rounded-full text-[15px]"
        style={{
          backgroundColor: dayIsSelected
            ? theme.primary
            : dayIsToday && !dayIsSelected
              ? theme.surface
              : "transparent",
          color: dayIsSelected ? "#fff" : theme.text,
          fontWeight: dayIsToday && !dayIsSelected ? 700 : 400,
        }}
      >
        {day}
        {dayIsMarked ? (
          <span
            className="absolute bottom-1 size-1.5 rounded-full"
            style={{
              backgroundColor: dayIsSelected
                ? "#fff"
                : markedDates[dateString]?.dotColor || theme.primary,
            }}
          />
        ) : null}
      </button>,
    );
  }

  return (
    <section
      className="w-full border-b-2 p-4"
      style={{ backgroundColor: theme.card, borderColor: theme.border }}
    >
      <div
        className="mb-4 flex items-center justify-between border-b pb-4"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="min-w-[44px] p-2 text-3xl font-bold"
          style={{ color: theme.primary }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <button type="button" onClick={goToToday} className="flex-1 text-center">
          <div className="text-lg font-bold" style={{ color: theme.text }}>
            {monthName}
          </div>
          {!isCurrentMonth ? (
            <div className="mt-1 text-[10px]" style={{ color: theme.textSecondary }}>
              Tap to go to today
            </div>
          ) : null}
        </button>
        <button
          type="button"
          onClick={goToNextMonth}
          className="min-w-[44px] p-2 text-3xl font-bold"
          style={{ color: theme.primary }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="mb-3 grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold"
            style={{ color: theme.textSecondary }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
      <p
        className="mt-5 text-center text-xs italic"
        style={{ color: theme.textSecondary }}
      >
        Tap any date to create a reminder
      </p>
    </section>
  );
}
