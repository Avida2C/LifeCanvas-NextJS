"use client";

import {
  ChevronDown,
  ChevronUp,
  Filter,
  FilterX,
  Pencil,
  Trash2,
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
import { ReminderModal, type ReminderSavePayload } from "@/components/reminder-modal";
import { useTheme } from "@/components/providers/theme-provider";
import { getRecurringDates } from "@/lib/planner-utils";
import {
  cancelNotification,
  scheduleReminderNotification,
} from "@/lib/notifications";
import {
  deleteReminder,
  deleteTaskList,
  getJournalEntries,
  getNotes,
  getReminders,
  getTaskList,
  getTaskLists,
  saveReminder,
  saveTaskList,
} from "@/lib/storage";
import type { Theme } from "@/lib/theme";
import type { JournalEntry, Note, Reminder, TaskList } from "@/types";

type ExpandedReminder = Reminder & { originalId?: string };
type PlannerTab = "calendar" | "notes" | "journals" | "tasks";

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
  const openReminder = searchParams.get("openReminder");
  const tabParam = searchParams.get("tab");
  const activeTab = plannerTabFromParam(tabParam);
  const [notes, setNotes] = useState<Note[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(
    undefined,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [reminderView, setReminderView] = useState<"upcoming" | "past">(
    "upcoming",
  );
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [journalSearchQuery, setJournalSearchQuery] = useState("");
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
  useEffect(() => {
    if (!openReminder) return;
    let cancelled = false;
    void (async () => {
      const t = new Date();
      const d = `${t.getFullYear()}-${(t.getMonth() + 1).toString().padStart(2, "0")}-${t.getDate().toString().padStart(2, "0")}`;
      if (cancelled) return;
      setSelectedDate(d);
      setShowReminderModal(true);
      router.replace("/planner", { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [openReminder, router]);

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
    setEditingReminder(undefined);
    setShowReminderModal(true);
  };

  const handleEditReminder = (r: Reminder) => {
    setEditingReminder(r);
    setSelectedDate(r.date);
    setShowReminderModal(true);
  };

  const handleCloseModal = () => {
    setShowReminderModal(false);
    setEditingReminder(undefined);
  };

  const handleSaveReminder = async (reminderData: ReminderSavePayload) => {
    if (editingReminder) {
      if (editingReminder.notificationId) {
        await cancelNotification(editingReminder.notificationId);
      }
      const notificationId = await scheduleReminderNotification(
        reminderData.title,
        reminderData.description,
        reminderData.date,
        reminderData.time,
      );
      const updated: Reminder = {
        ...editingReminder,
        ...reminderData,
        notificationId: notificationId ?? undefined,
      };
      await saveReminder(updated);
    } else {
      const notificationId = await scheduleReminderNotification(
        reminderData.title,
        reminderData.description,
        reminderData.date,
        reminderData.time,
      );
      const newR: Reminder = {
        id: Date.now().toString(),
        ...reminderData,
        notificationId: notificationId ?? undefined,
        createdAt: new Date().toISOString(),
      };
      await saveReminder(newR);
    }
    setEditingReminder(undefined);
    await loadData();
    handleCloseModal();
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

  const handleDeleteTaskList = async (id: string) => {
    if (!confirm("Delete this task list?")) return;
    await deleteTaskList(id);
    await loadData();
  };

  const expandedReminders: ExpandedReminder[] = useMemo(() => {
    const out: ExpandedReminder[] = [];
    reminders.forEach((reminder) => {
      if (reminder.repeat && reminder.repeat !== "none") {
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

  const filteredNotes = useMemo(() => {
    const q = noteSearchQuery.trim().toLowerCase();
    let list = notes;
    if (q) {
      list = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.content && n.content.toLowerCase().includes(q)),
      );
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  }, [notes, noteSearchQuery]);

  const filteredJournals = useMemo(() => {
    const q = journalSearchQuery.trim().toLowerCase();
    let list = journals;
    if (q) {
      list = journals.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.content && j.content.toLowerCase().includes(q)),
      );
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  }, [journals, journalSearchQuery]);

  const segmentClass = (tab: PlannerTab) =>
    `flex-1 py-2 text-center text-sm font-semibold ${
      activeTab === tab ? "text-white" : ""
    }`;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div
        className="px-4 py-2"
        style={{ backgroundColor: theme.surface }}
      >
        <div
          className="flex overflow-hidden rounded-lg border-2"
          style={{ borderColor: theme.border }}
        >
          {(["notes", "journals", "calendar", "tasks"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() =>
                router.push(`/planner?tab=${tab}`, { scroll: false })
              }
              className={segmentClass(tab)}
              style={{
                backgroundColor: activeTab === tab ? theme.primary : theme.surface,
                color: activeTab === tab ? "#fff" : theme.text,
              }}
            >
              {tab === "notes"
                ? "Notes"
                : tab === "journals"
                  ? "Journal"
                  : tab === "calendar"
                    ? "Calendar"
                    : "Tasks"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "calendar" ? (
        <div className="flex flex-1 flex-col">
          <CustomCalendar
            selectedDate={selectedDate}
            markedDates={markedDates}
            onDayPress={handleDayPress}
          />
          <div className="flex-1 overflow-y-auto p-2">
            <div
              className="border-2 p-3"
              style={{
                backgroundColor: theme.surface,
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
                  className="mb-3 border-2 p-3 text-sm"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.card,
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
                        {filterFromDate} ✕
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
                        {filterToDate} ✕
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
                  <p className="text-4xl">{reminderView === "upcoming" ? "📅" : "📜"}</p>
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
                                {reminder.time}
                                {reminder.endTime ? ` - ${reminder.endTime}` : ""}{" "}
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
                                  className="mt-1 text-[11px] italic"
                                  style={{ color: theme.textSecondary }}
                                >
                                  {reminder.repeat === "daily" && "🔁 Daily"}
                                  {reminder.repeat === "weekly" && "🔁 Weekly"}
                                  {reminder.repeat === "monthly" && "🔁 Monthly"}
                                  {reminder.repeat === "yearly" && "🔁 Yearly"}
                                  {reminder.endDate &&
                                    ` until ${new Date(reminder.endDate).toLocaleDateString()}`}
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
        <div className="flex-1 overflow-y-auto p-2 pb-24">
          {activeTab === "notes" && (
            <>
              <div
                className="mb-2 border-2 p-2"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                <input
                  type="search"
                  placeholder="Search notes..."
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  className="w-full rounded border-2 px-3 py-2"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    color: theme.text,
                  }}
                />
              </div>
              <div
                className="border-2"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                {notes.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-4xl">📝</p>
                    <p className="mt-2 font-bold">No notes yet</p>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-4xl">🔍</p>
                    <p className="mt-2 font-bold">No matches</p>
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/note/${note.id}`}
                      className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
                      style={{ borderColor: theme.divider }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{note.title}</p>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>
                          {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span style={{ color: theme.primary }}>›</span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
          {activeTab === "journals" && (
            <>
              <div
                className="mb-2 border-2 p-2"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                <input
                  type="search"
                  placeholder="Search journals..."
                  value={journalSearchQuery}
                  onChange={(e) => setJournalSearchQuery(e.target.value)}
                  className="w-full rounded border-2 px-3 py-2"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    color: theme.text,
                  }}
                />
              </div>
              <div
                className="border-2"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                {journals.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-4xl">📔</p>
                    <p className="mt-2 font-bold">No journal entries yet</p>
                    <p className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
                      <Link href="/journals" className="font-semibold underline" style={{ color: theme.primary }}>
                        Open Journals
                      </Link>{" "}
                      to add one.
                    </p>
                  </div>
                ) : filteredJournals.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-4xl">🔍</p>
                    <p className="mt-2 font-bold">No matches</p>
                  </div>
                ) : (
                  filteredJournals.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/journal/${entry.id}`}
                      className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
                      style={{ borderColor: theme.divider }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{entry.title}</p>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>
                          {new Date(entry.updatedAt || entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span style={{ color: theme.primary }}>›</span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
          {activeTab === "tasks" && (
            <div>
              {taskLists.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-4xl">✅</p>
                  <p className="mt-2 font-bold">No task lists</p>
                </div>
              ) : (
                taskLists.map((taskList) => (
                  <div
                    key={String(taskList.id)}
                    className="mb-3 border-2 p-3"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    }}
                  >
                    <p className="font-bold">
                      {taskList.title?.trim() || `Task list #${taskList.id}`}
                    </p>
                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      {taskList.tasks.length} task(s)
                    </p>
                    {[...taskList.tasks.filter((t) => !t.done), ...taskList.tasks.filter((t) => t.done)].map(
                      (task) => (
                        <label
                          key={task.id}
                          className="mt-2 flex cursor-pointer items-start gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() =>
                              taskList.id &&
                              void toggleInlineTask(taskList.id, task.id)
                            }
                            className="mt-1"
                          />
                          <span
                            className={task.done ? "line-through opacity-60" : ""}
                          >
                            {task.content || "Empty task"}
                          </span>
                        </label>
                      ),
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: theme.primary }}
                        onClick={() =>
                          router.push(`/task-editor?id=${taskList.id}`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border-2 px-3 py-2 text-sm"
                        style={{ borderColor: theme.border, color: theme.primary }}
                        onClick={() =>
                          taskList.id && void handleDeleteTaskList(taskList.id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
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

      <ReminderModal
        visible={showReminderModal}
        date={selectedDate}
        onClose={handleCloseModal}
        onSave={(payload) => void handleSaveReminder(payload)}
        reminder={editingReminder}
      />
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
