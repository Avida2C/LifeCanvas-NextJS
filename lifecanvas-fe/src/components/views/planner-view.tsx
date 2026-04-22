"use client";

import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  FilterX,
  ListChecks,
  Pencil,
  Pin,
  PinOff,
  Repeat,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CustomCalendar, type MarkedDates } from "@/components/custom-calendar";
import { useTheme } from "@/components/providers/theme-provider";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { getRecurringDates } from "@/lib/planner-utils";
import {
  deleteReminder,
  getJournalEntries,
  getNotes,
  getReminders,
  getTaskList,
  getTaskLists,
  saveJournalEntry,
  saveNote,
  saveTaskList,
} from "@/lib/storage";
import type { Theme } from "@/lib/theme";
import type { JournalEntry, Note, Reminder, TaskList } from "@/types";

type ExpandedReminder = Reminder & { originalId?: string };
type PlannerTab = "calendar" | "notes" | "journals" | "tasks";
const PLANNER_TABS: { id: PlannerTab; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "notes", label: "Notes" },
  { id: "journals", label: "Journals" },
  { id: "tasks", label: "Tasks" },
];

function plannerTabFromParam(tabParam: string | null): PlannerTab {
  if (
    tabParam === "calendar" ||
    tabParam === "notes" ||
    tabParam === "journals" ||
    tabParam === "tasks"
  ) {
    return tabParam;
  }
  return "calendar";
}

function FilterDatePicker({
  pickerMonth,
  pickerYear,
  setPickerMonth,
  setPickerYear,
  selectedDate,
  onSelect,
  onCancel,
  theme,
}: {
  pickerMonth: number;
  pickerYear: number;
  setPickerMonth: (n: number) => void;
  setPickerYear: (n: number) => void;
  selectedDate: string;
  onSelect: (iso: string) => void;
  onCancel: () => void;
  theme: Theme;
}) {
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const firstDay = new Date(pickerYear, pickerMonth, 1).getDay();
  const today = new Date();
  const monthName = new Date(pickerYear, pickerMonth).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );
  const cells: ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`fe-${i}`} className="size-8" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(pickerYear, pickerMonth, day);
    const dateStr = dateObj.toISOString().split("T")[0];
    const isToday = dateObj.toDateString() === today.toDateString();
    const isSelected = selectedDate === dateStr;
    cells.push(
      <button
        key={day}
        type="button"
        onClick={() => onSelect(dateStr)}
        className="flex size-8 items-center justify-center rounded-full text-[13px]"
        style={{
          backgroundColor: isSelected ? theme.primary : "transparent",
          color: isSelected ? "#fff" : theme.text,
          border:
            isToday && !isSelected ? `2px solid ${theme.primary}` : undefined,
        }}
      >
        {day}
      </button>,
    );
  }
  return (
    <div
      className="mt-2 border-2 p-3"
      style={{ backgroundColor: theme.card, borderColor: theme.border }}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="p-1"
          style={{ color: theme.primary }}
          onClick={() => {
            if (pickerMonth === 0) {
              setPickerMonth(11);
              setPickerYear(pickerYear - 1);
            } else setPickerMonth(pickerMonth - 1);
          }}
        >
          ‹
        </button>
        <span className="text-sm font-semibold" style={{ color: theme.text }}>
          {monthName}
        </span>
        <button
          type="button"
          className="p-1"
          style={{ color: theme.primary }}
          onClick={() => {
            if (pickerMonth === 11) {
              setPickerMonth(0);
              setPickerYear(pickerYear + 1);
            } else setPickerMonth(pickerMonth + 1);
          }}
        >
          ›
        </button>
      </div>
      <div className="mb-1 flex justify-around text-[11px] font-bold">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="w-8 text-center" style={{ color: theme.textSecondary }}>
            {d}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap">{cells}</div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 text-sm underline"
        style={{ color: theme.textSecondary }}
      >
        Close
      </button>
    </div>
  );
}

function PlannerViewInner() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = plannerTabFromParam(tabParam);
  const [notes, setNotes] = useState<Note[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [refreshing, setRefreshing] = useState(false);
  const [reminderView, setReminderView] = useState<"upcoming" | "past">(
    "upcoming",
  );
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [fromPickerMonth, setFromPickerMonth] = useState(new Date().getMonth());
  const [fromPickerYear, setFromPickerYear] = useState(
    new Date().getFullYear(),
  );
  const [toPickerMonth, setToPickerMonth] = useState(new Date().getMonth());
  const [toPickerYear, setToPickerYear] = useState(new Date().getFullYear());
  const commitPlannerData = useCallback(
    (
      notesData: Note[],
      journalsData: JournalEntry[],
      taskListsData: TaskList[],
      remindersData: Reminder[],
    ) => {
      setNotes(notesData);
      setJournals(journalsData);
      setTaskLists(taskListsData);
      setReminders(remindersData);
      const marks: MarkedDates = {};
      // Mark every generated occurrence so repeating reminders appear on the calendar.
      remindersData.forEach((reminder) => {
        getRecurringDates(reminder, 730).forEach((date) => {
          marks[date] = { marked: true, dotColor: theme.primary };
        });
      });
      setMarkedDates(marks);
      setSelectedDate((prev) => {
        if (prev) return prev;
        const t = new Date();
        return `${t.getFullYear()}-${(t.getMonth() + 1).toString().padStart(2, "0")}-${t.getDate().toString().padStart(2, "0")}`;
      });
    },
    [theme.primary],
  );

  const loadData = useCallback(async () => {
    const [notesData, journalsData, taskListsData, remindersData] = await Promise.all([
      getNotes(),
      getJournalEntries(),
      getTaskLists(),
      getReminders(),
    ]);
    commitPlannerData(notesData, journalsData, taskListsData, remindersData);
  }, [commitPlannerData]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [notesData, journalsData, taskListsData, remindersData] = await Promise.all([
        getNotes(),
        getJournalEntries(),
        getTaskLists(),
        getReminders(),
      ]);
      if (cancelled) return;
      commitPlannerData(notesData, journalsData, taskListsData, remindersData);
    })();
    return () => {
      cancelled = true;
    };
  }, [commitPlannerData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDayPress = (dateString: string) => {
    setSelectedDate(dateString);
    router.push(`/reminder-editor?date=${dateString}`);
  };

  const handleEditReminder = (r: Reminder) => {
    setSelectedDate(r.date);
    router.push(`/reminder-editor?id=${r.id}`);
  };

  const toggleInlineTask = async (listId: string, taskId: number) => {
    const tl = await getTaskList(listId);
    if (!tl) return;
    const tasks = tl.tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t,
    );
    await saveTaskList({ ...tl, tasks });
    await loadData();
  };

  const expandedReminders: ExpandedReminder[] = useMemo(() => {
    const out: ExpandedReminder[] = [];
    reminders.forEach((reminder) => {
      if (reminder.repeat && reminder.repeat !== "none") {
        // Expand recurring reminders into concrete instances for list grouping/sorting.
        getRecurringDates(reminder, 730).forEach((date) => {
          out.push({
            ...reminder,
            originalId: reminder.id,
            date,
          });
        });
      } else {
        out.push(reminder);
      }
    });
    return out;
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return expandedReminders.filter((reminder) => {
      const reminderDate = new Date(reminder.date);
      const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
      if (filterFromDate || filterToDate) {
        const fromD = filterFromDate ? new Date(filterFromDate) : new Date(0);
        const toD = filterToDate
          ? new Date(filterToDate)
          : new Date("2100-01-01");
        if (reminderDate < fromD || reminderDate > toD) return false;
      }
      if (reminderView === "upcoming") {
        // Default scope: only upcoming two weeks unless user asks to show all.
        if (!showAllUpcoming && !filterFromDate && !filterToDate) {
          return (
            reminderDateTime >= now && reminderDateTime <= twoWeeksFromNow
          );
        }
        return reminderDateTime >= now;
      }
      if (!showAllPast && !filterFromDate && !filterToDate) {
        return reminderDateTime < now && reminderDateTime >= twoWeeksAgo;
      }
      return reminderDateTime < now;
    });
  }, [
    expandedReminders,
    filterFromDate,
    filterToDate,
    reminderView,
    showAllUpcoming,
    showAllPast,
  ]);

  const sortedReminders = useMemo(() => {
    return [...filteredReminders].sort((a, b) => {
      const dc = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dc !== 0) {
        return reminderView === "upcoming" ? dc : -dc;
      }
      return reminderView === "upcoming"
        ? a.time.localeCompare(b.time)
        : b.time.localeCompare(a.time);
    });
  }, [filteredReminders, reminderView]);

  const remindersByDate = useMemo(() => {
    const g: Record<string, ExpandedReminder[]> = {};
    sortedReminders.forEach((r) => {
      if (!g[r.date]) g[r.date] = [];
      g[r.date].push(r);
    });
    return g;
  }, [sortedReminders]);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      ),
    [notes],
  );

  const sortedJournals = useMemo(
    () =>
      [...journals].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      ),
    [journals],
  );

  const pinnedNotes = useMemo(
    () => sortedNotes.filter((note) => note.isPinned),
    [sortedNotes],
  );
  const unpinnedNotes = useMemo(
    () => sortedNotes.filter((note) => !note.isPinned),
    [sortedNotes],
  );

  const pinnedJournals = useMemo(
    () => sortedJournals.filter((entry) => entry.isPinned),
    [sortedJournals],
  );
  const unpinnedJournals = useMemo(
    () => sortedJournals.filter((entry) => !entry.isPinned),
    [sortedJournals],
  );

  const pinnedTaskLists = useMemo(
    () => taskLists.filter((list) => list.isPinned),
    [taskLists],
  );
  const unpinnedTaskLists = useMemo(
    () => taskLists.filter((list) => !list.isPinned),
    [taskLists],
  );

  const toggleNotePinned = async (noteId: string) => {
    const existing = notes.find((item) => item.id === noteId);
    if (!existing) return;
    const updated = { ...existing, isPinned: !existing.isPinned };
    // Optimistic UI update; persist in background.
    setNotes((prev) => prev.map((item) => (item.id === noteId ? updated : item)));
    await saveNote(updated);
  };

  const toggleJournalPinned = async (entryId: string) => {
    const existing = journals.find((item) => item.id === entryId);
    if (!existing) return;
    const updated = { ...existing, isPinned: !existing.isPinned };
    setJournals((prev) => prev.map((item) => (item.id === entryId ? updated : item)));
    await saveJournalEntry(updated);
  };

  const toggleTaskListPinned = async (listId: string) => {
    const existing = taskLists.find((item) => item.id === listId);
    if (!existing) return;
    const updated = { ...existing, isPinned: !existing.isPinned };
    setTaskLists((prev) => prev.map((item) => (item.id === listId ? updated : item)));
    await saveTaskList(updated);
  };

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div
        className="px-4 py-2"
        style={{ backgroundColor: theme.surface }}
      >
        <SegmentedTabs
          tabs={PLANNER_TABS}
          value={activeTab}
          theme={theme}
          onChange={(tab) => router.push(`/planner?tab=${tab}`, { scroll: false })}
        />
      </div>

      {activeTab === "calendar" ? (
        <div className="flex flex-1 flex-col">
          <CustomCalendar
            selectedDate={selectedDate}
            markedDates={markedDates}
            onDayPress={handleDayPress}
          />
          <div className="flex-1 overflow-y-auto pb-24">
            <div
              className="mx-4 mt-4 rounded-2xl border-2 p-4"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex flex-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReminderView("upcoming");
                      setShowAllUpcoming(false);
                      setShowAllPast(false);
                      setShowFilter(false);
                      setFilterFromDate("");
                      setFilterToDate("");
                    }}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold"
                    style={{
                      backgroundColor:
                        reminderView === "upcoming"
                          ? theme.primary
                          : theme.card,
                      color: reminderView === "upcoming" ? "#fff" : theme.text,
                    }}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReminderView("past");
                      setShowAllUpcoming(false);
                      setShowAllPast(false);
                      setShowFilter(false);
                      setFilterFromDate("");
                      setFilterToDate("");
                    }}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold"
                    style={{
                      backgroundColor:
                        reminderView === "past" ? theme.primary : theme.card,
                      color: reminderView === "past" ? "#fff" : theme.text,
                    }}
                  >
                    History
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFilter(!showFilter);
                    if (showFilter) {
                      setFilterFromDate("");
                      setFilterToDate("");
                    }
                  }}
                  className="rounded-lg p-2"
                  style={{ color: showFilter ? theme.primary : theme.textSecondary }}
                  aria-label="Filter"
                >
                  {showFilter ? <FilterX className="size-5" /> : <Filter className="size-5" />}
                </button>
              </div>

              {showFilter && (
                <div
                  className="mb-3 rounded-xl border-2 p-3 text-sm"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  }}
                >
                  <p className="mb-2 font-bold">Date range</p>
                  <div className="mb-2">
                    <span style={{ color: theme.textSecondary }}>From: </span>
                    {filterFromDate ? (
                      <button
                        type="button"
                        onClick={() => setFilterFromDate("")}
                        style={{ color: theme.primary }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {filterFromDate}
                          <X className="size-3.5 shrink-0" aria-hidden />
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowFromDatePicker(!showFromDatePicker);
                          setShowToDatePicker(false);
                        }}
                        style={{ color: theme.primary }}
                      >
                        Pick
                      </button>
                    )}
                  </div>
                  {showFromDatePicker && (
                    <FilterDatePicker
                      pickerMonth={fromPickerMonth}
                      pickerYear={fromPickerYear}
                      setPickerMonth={setFromPickerMonth}
                      setPickerYear={setFromPickerYear}
                      selectedDate={filterFromDate}
                      onSelect={(iso) => {
                        setFilterFromDate(iso);
                        setShowFromDatePicker(false);
                      }}
                      onCancel={() => setShowFromDatePicker(false)}
                      theme={theme}
                    />
                  )}
                  <div className="mb-2">
                    <span style={{ color: theme.textSecondary }}>To: </span>
                    {filterToDate ? (
                      <button
                        type="button"
                        onClick={() => setFilterToDate("")}
                        style={{ color: theme.primary }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {filterToDate}
                          <X className="size-3.5 shrink-0" aria-hidden />
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowToDatePicker(!showToDatePicker);
                          setShowFromDatePicker(false);
                        }}
                        style={{ color: theme.primary }}
                      >
                        Pick
                      </button>
                    )}
                  </div>
                  {showToDatePicker && (
                    <FilterDatePicker
                      pickerMonth={toPickerMonth}
                      pickerYear={toPickerYear}
                      setPickerMonth={setToPickerMonth}
                      setPickerYear={setToPickerYear}
                      selectedDate={filterToDate}
                      onSelect={(iso) => {
                        setFilterToDate(iso);
                        setShowToDatePicker(false);
                      }}
                      onCancel={() => setShowToDatePicker(false)}
                      theme={theme}
                    />
                  )}
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => {
                      setFilterFromDate("");
                      setFilterToDate("");
                      setShowFromDatePicker(false);
                      setShowToDatePicker(false);
                    }}
                  >
                    Clear all
                  </button>
                </div>
              )}

              {sortedReminders.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="flex justify-center" aria-hidden>
                    {reminderView === "upcoming" ? (
                      <Calendar
                        className="size-14"
                        strokeWidth={1.25}
                        style={{ color: theme.textSecondary }}
                      />
                    ) : (
                      <ScrollText
                        className="size-14"
                        strokeWidth={1.25}
                        style={{ color: theme.textSecondary }}
                      />
                    )}
                  </div>
                  <p className="mt-2 font-bold">{reminderView === "upcoming" ? "No upcoming reminders" : "No past reminders"}</p>
                  <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
                    {reminderView === "upcoming"
                      ? "Tap a date on the calendar to add one."
                      : "Completed reminders appear here."}
                  </p>
                </div>
              ) : (
                <>
                  {Object.keys(remindersByDate).map((date) => (
                    <div key={date} className="mb-4">
                      <p
                        className="mb-2 text-xs font-bold uppercase tracking-wide"
                        style={{ color: theme.textSecondary }}
                      >
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {remindersByDate[date].map((reminder, index) => {
                        const isRecurring = !!(
                          reminder.repeat && reminder.repeat !== "none"
                        );
                        const uniqueKey = reminder.originalId
                          ? `${reminder.originalId}-${reminder.date}`
                          : `${reminder.id}-${index}`;
                        return (
                          <div
                            key={uniqueKey}
                            className="mb-3 flex border-l-4 py-2 pl-3"
                            style={{
                              borderColor:
                                reminderView === "past"
                                  ? theme.textSecondary
                                  : theme.primary,
                              opacity: reminderView === "past" ? 0.75 : 1,
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold">
                                {reminder.allDay
                                  ? "All day"
                                  : `${reminder.time}${reminder.endTime ? ` - ${reminder.endTime}` : ""}`}{" "}
                                • {reminder.title}
                              </p>
                              {reminder.description ? (
                                <p
                                  className="text-xs"
                                  style={{ color: theme.textSecondary }}
                                >
                                  {reminder.description}
                                </p>
                              ) : null}
                              {isRecurring ? (
                                <p
                                  className="mt-1 flex flex-wrap items-center gap-1 text-[11px] italic"
                                  style={{ color: theme.textSecondary }}
                                >
                                  <Repeat className="size-3 shrink-0" aria-hidden />
                                  <span>
                                    {reminder.repeat === "daily" && "Daily"}
                                    {reminder.repeat === "weekly" && "Weekly"}
                                    {reminder.repeat === "monthly" && "Monthly"}
                                    {reminder.repeat === "yearly" && "Yearly"}
                                    {reminder.endDate &&
                                      ` until ${new Date(reminder.endDate).toLocaleDateString()}`}
                                  </span>
                                </p>
                              ) : null}
                            </div>
                            {reminderView === "upcoming" && (
                              <div className="flex shrink-0">
                                <button
                                  type="button"
                                  className="p-1"
                                  style={{ color: theme.primary }}
                                  onClick={() => {
                                    const orig = reminder.originalId
                                      ? reminders.find(
                                          (x) => x.id === reminder.originalId,
                                        )
                                      : reminder;
                                    if (orig) handleEditReminder(orig);
                                  }}
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 text-red-500"
                                  onClick={async () => {
                                    const idToDelete =
                                      reminder.originalId || reminder.id;
                                    const rDel = reminders.find(
                                      (x) => x.id === idToDelete,
                                    );
                                    if (rDel?.notificationId) {
                                      await cancelNotification(
                                        rDel.notificationId,
                                      );
                                    }
                                    await deleteReminder(idToDelete);
                                    await loadData();
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {!filterFromDate && !filterToDate && (
                    <div className="flex justify-center py-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-sm font-medium"
                        style={{ color: theme.primary }}
                        onClick={() =>
                          reminderView === "upcoming"
                            ? setShowAllUpcoming(!showAllUpcoming)
                            : setShowAllPast(!showAllPast)
                        }
                      >
                        {reminderView === "upcoming" ? (
                          showAllUpcoming ? (
                            <>
                              Show less <ChevronUp className="size-4" />
                            </>
                          ) : (
                            <>
                              Show all upcoming <ChevronDown className="size-4" />
                            </>
                          )
                        ) : showAllPast ? (
                          <>
                            Show less <ChevronUp className="size-4" />
                          </>
                        ) : (
                          <>
                            Show all history <ChevronDown className="size-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {activeTab === "notes" && (
            <>
              {notes.length === 0 ? (
                <div
                  className="rounded-2xl border-2 p-3"
                  style={{ backgroundColor: theme.card, borderColor: theme.border }}
                >
                  <div className="py-16 text-center">
                    <div className="flex justify-center" aria-hidden>
                      <FileText
                        className="size-14"
                        strokeWidth={1.25}
                        style={{ color: theme.textSecondary }}
                      />
                    </div>
                    <p className="mt-2 font-bold">No notes yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedNotes.length > 0 && (
                    <>
                      <p className="px-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                        Pinned
                      </p>
                      {pinnedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center gap-2 rounded-xl border-2 px-3 py-2.5"
                          style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          }}
                        >
                          <Link href={`/note/${note.id}`} className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{note.title || "Untitled note"}</p>
                            <p
                              className="mt-1 line-clamp-2 text-sm"
                              style={{ color: theme.textSecondary }}
                            >
                              {note.content?.trim() || "No preview available yet."}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                              {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                              {note.images?.length ? ` · ${note.images.length} image${note.images.length === 1 ? "" : "s"}` : ""}
                            </p>
                          </Link>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg p-1.5"
                            style={{ color: theme.primary }}
                            onClick={() => void toggleNotePinned(note.id)}
                            aria-label="Unpin note"
                          >
                            <PinOff className="size-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  {unpinnedNotes.length > 0 && (
                    <>
                      {pinnedNotes.length > 0 ? (
                        <p className="px-1 pt-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                          Notes
                        </p>
                      ) : null}
                      {unpinnedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center gap-2 rounded-xl border-2 px-3 py-2.5"
                          style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          }}
                        >
                          <Link href={`/note/${note.id}`} className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{note.title || "Untitled note"}</p>
                            <p
                              className="mt-1 line-clamp-2 text-sm"
                              style={{ color: theme.textSecondary }}
                            >
                              {note.content?.trim() || "No preview available yet."}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                              {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                              {note.images?.length ? ` · ${note.images.length} image${note.images.length === 1 ? "" : "s"}` : ""}
                            </p>
                          </Link>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg p-1.5"
                            style={{ color: theme.textSecondary }}
                            onClick={() => void toggleNotePinned(note.id)}
                            aria-label="Pin note"
                          >
                            <Pin className="size-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {activeTab === "journals" && (
            <>
              {journals.length === 0 ? (
                <div
                  className="rounded-2xl border-2 p-3"
                  style={{ backgroundColor: theme.card, borderColor: theme.border }}
                >
                  <div className="py-16 text-center">
                    <div className="flex justify-center" aria-hidden>
                      <BookOpen
                        className="size-14"
                        strokeWidth={1.25}
                        style={{ color: theme.textSecondary }}
                      />
                    </div>
                    <p className="mt-2 font-bold">No journal entries yet</p>
                    <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
                      <Link href="/journals" className="font-semibold underline" style={{ color: theme.primary }}>
                        Open Journals
                      </Link>{" "}
                      to add one.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedJournals.length > 0 && (
                    <>
                      <p className="px-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                        Pinned
                      </p>
                      {pinnedJournals.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2 rounded-xl border-2 px-3 py-2.5"
                          style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          }}
                        >
                          <Link href={`/journal/${entry.id}`} className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{entry.title || "Untitled journal entry"}</p>
                            <p
                              className="mt-1 line-clamp-2 text-sm italic"
                              style={{ color: theme.textSecondary }}
                            >
                              {entry.content?.trim() || "No preview available yet."}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                              {new Date(entry.updatedAt || entry.createdAt).toLocaleString()}
                              {entry.images?.length ? ` · ${entry.images.length} image${entry.images.length === 1 ? "" : "s"}` : ""}
                            </p>
                          </Link>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg p-1.5"
                            style={{ color: theme.primary }}
                            onClick={() => void toggleJournalPinned(entry.id)}
                            aria-label="Unpin journal entry"
                          >
                            <PinOff className="size-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  {unpinnedJournals.length > 0 && (
                    <>
                      {pinnedJournals.length > 0 ? (
                        <p className="px-1 pt-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                          Journals
                        </p>
                      ) : null}
                      {unpinnedJournals.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2 rounded-xl border-2 px-3 py-2.5"
                          style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          }}
                        >
                          <Link href={`/journal/${entry.id}`} className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{entry.title || "Untitled journal entry"}</p>
                            <p
                              className="mt-1 line-clamp-2 text-sm italic"
                              style={{ color: theme.textSecondary }}
                            >
                              {entry.content?.trim() || "No preview available yet."}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                              {new Date(entry.updatedAt || entry.createdAt).toLocaleString()}
                              {entry.images?.length ? ` · ${entry.images.length} image${entry.images.length === 1 ? "" : "s"}` : ""}
                            </p>
                          </Link>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg p-1.5"
                            style={{ color: theme.textSecondary }}
                            onClick={() => void toggleJournalPinned(entry.id)}
                            aria-label="Pin journal entry"
                          >
                            <Pin className="size-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {activeTab === "tasks" && (
            <div className="space-y-3">
              {taskLists.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex justify-center" aria-hidden>
                    <ListChecks
                      className="size-14"
                      strokeWidth={1.25}
                      style={{ color: theme.textSecondary }}
                    />
                  </div>
                  <p className="mt-2 font-bold">No task lists</p>
                </div>
              ) : (
                [...pinnedTaskLists, ...unpinnedTaskLists].map((taskList, index) => (
                  (() => {
                    const orderedTasks = [
                      ...taskList.tasks.filter((t) => !t.done),
                      ...taskList.tasks.filter((t) => t.done),
                    ];
                    const visibleTasks = orderedTasks.slice(0, 4);
                    const remainingCount = Math.max(0, orderedTasks.length - visibleTasks.length);
                    const completedCount = taskList.tasks.filter((t) => t.done).length;
                    return (
                      <div key={String(taskList.id)}>
                        {index === 0 && pinnedTaskLists.length > 0 && (
                          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                            Pinned
                          </p>
                        )}
                        {index === pinnedTaskLists.length && unpinnedTaskLists.length > 0 && pinnedTaskLists.length > 0 && (
                          <p className="mb-2 mt-1 px-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                            Task lists
                          </p>
                        )}
                        <div
                          className="rounded-2xl border-2 p-4"
                          style={{
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          }}
                        >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold">
                            {taskList.title?.trim() || `Task list #${taskList.id}`}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="shrink-0 rounded-lg p-1.5"
                              style={{
                                color: taskList.isPinned ? theme.primary : theme.textSecondary,
                              }}
                              onClick={() =>
                                taskList.id && void toggleTaskListPinned(taskList.id)
                              }
                              aria-label={taskList.isPinned ? "Unpin task list" : "Pin task list"}
                            >
                              {taskList.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                            </button>
                            <button
                              type="button"
                              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: theme.primary }}
                              onClick={() =>
                                router.push(`/task/${taskList.id}`)
                              }
                            >
                              Open
                            </button>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>
                          {taskList.tasks.length} task(s)
                          {" · "}
                          {completedCount} completed
                        </p>
                        {visibleTasks.map((task) => (
                          <div
                            key={task.id}
                            className="mt-2 flex items-start gap-2"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                taskList.id && void toggleInlineTask(taskList.id, task.id)
                              }
                              className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-xs"
                              style={{
                                borderColor: task.done ? theme.primary : theme.border,
                                color: task.done ? "#fff" : theme.textSecondary,
                                backgroundColor: task.done ? theme.primary : "transparent",
                              }}
                              aria-label={task.done ? "Mark as not done" : "Mark as done"}
                            >
                              {task.done ? "✓" : ""}
                            </button>
                            <span
                              className={task.done ? "line-through opacity-60" : ""}
                            >
                              {task.content || "Empty task"}
                            </span>
                            {task.deadline ? (
                              <span
                                className="ml-1 text-xs"
                                style={{ color: theme.textSecondary }}
                              >
                                ({new Date(`${task.deadline}T00:00:00`).toLocaleDateString()})
                              </span>
                            ) : null}
                          </div>
                        ))}
                        {remainingCount > 0 ? (
                          <p className="mt-2 text-xs font-medium" style={{ color: theme.textSecondary }}>
                            +{remainingCount} other{remainingCount === 1 ? "" : "s"} in the list
                          </p>
                        ) : null}
                        </div>
                      </div>
                    );
                  })()
                ))
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="mt-4 w-full py-2 text-sm"
            style={{ color: theme.textSecondary }}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      )}

    </div>
  );
}

export function PlannerView() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading planner…</div>}>
      <PlannerViewInner />
    </Suspense>
  );
}
