"use client";

import type { Theme } from "@/lib/theme";

export type SegmentedTabItem<T extends string> = {
  id: T;
  label: string;
};

/** Generic segmented control shared by Inspire/Planner tabs. */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  theme,
}: {
  tabs: ReadonlyArray<SegmentedTabItem<T>>;
  value: T;
  onChange: (tab: T) => void;
  theme: Theme;
}) {
  return (
    <div className="flex gap-1" role="tablist" aria-orientation="horizontal">
      {tabs.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex-1 border-b-2 py-2 text-center text-sm font-semibold transition-colors"
            style={{
              borderColor: active ? theme.primary : "transparent",
              color: active ? theme.primary : theme.textSecondary,
            }}
            role="tab"
            aria-selected={active}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
