"use client";

import { Save, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { getTaskList, saveTaskList } from "@/lib/storage";
import type { SubTask, TaskList } from "@/types";

function TaskEditorInner() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? undefined;

  const [title, setTitle] = useState("");
  const [taskList, setTaskList] = useState<TaskList>({
    id: null,
    tasks: [{ id: 0, content: "", done: false }],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const loaded = await getTaskList(id);
      if (loaded) {
        setTaskList(loaded);
        setTitle(loaded.title || "");
      }
    })();
  }, [id]);

  const addTask = () => {
    const lastId =
      taskList.tasks.length > 0
        ? Math.max(...taskList.tasks.map((t) => t.id))
        : -1;
    const newTask: SubTask = { id: lastId + 1, content: "", done: false };
    setTaskList({ ...taskList, tasks: [...taskList.tasks, newTask] });
  };

  const removeTask = (taskId: number) => {
    const filtered = taskList.tasks.filter((t) => t.id !== taskId);
    setTaskList({
      ...taskList,
      tasks:
        filtered.length === 0 ? [{ id: 0, content: "", done: false }] : filtered,
    });
  };

  const updateContent = (taskId: number, content: string) => {
    setTaskList({
      ...taskList,
      tasks: taskList.tasks.map((t) =>
        t.id === taskId ? { ...t, content } : t,
      ),
    });
  };

  const toggleDone = (taskId: number) => {
    setTaskList({
      ...taskList,
      tasks: taskList.tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t,
      ),
    });
  };

  const handleSave = async () => {
    setLoading(true);
    await saveTaskList({
      ...taskList,
      title: title.trim() || undefined,
    });
    setLoading(false);
    router.back();
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Task editor"
        theme={theme}
        actions={[
          {
            icon: Save,
            label: "Save",
            onClick: () => void handleSave(),
            disabled: loading,
          },
        ]}
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        <div
          className="border-2 p-3"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <p className="mb-2 text-sm font-bold" style={{ color: theme.text }}>
            List name
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Groceries"
            className="w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          />
        </div>
        {taskList.tasks.map((task) => (
          <div
            key={task.id}
            className="border-2 p-3"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <div className="flex items-start gap-2">
              {taskList.tasks.length > 1 && (
                <button
                  type="button"
                  className="text-red-500"
                  onClick={() => removeTask(task.id)}
                  aria-label="Remove"
                >
                  <X className="size-5" strokeWidth={2} aria-hidden />
                </button>
              )}
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task.id)}
                className="mt-2"
              />
              <input
                value={task.content}
                onChange={(e) => updateContent(task.id, e.target.value)}
                placeholder="Task"
                className="min-w-0 flex-1 rounded-lg border-2 px-3 py-2"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  color: theme.text,
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTask}
          className="w-full rounded-lg border-2 py-2 font-semibold"
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          + Add task
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border-2 py-3"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSave()}
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

export function TaskEditorView() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <TaskEditorInner />
    </Suspense>
  );
}
