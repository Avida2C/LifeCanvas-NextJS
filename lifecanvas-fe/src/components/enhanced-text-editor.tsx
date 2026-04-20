"use client";

import {
  Bold,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Underline,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { fileToEditorImageDataUrl } from "@/lib/media-utils";
import type { Theme } from "@/lib/theme";

export function EnhancedTextEditor({
  value,
  onChange,
  placeholder,
  onImageAdd,
  /** Next index for `![Image](lcimg:N)` when using onImageAdd (must match images[] order). */
  nextImageIndex,
  maxLength,
  maxWords,
  showCharCount,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onImageAdd?: (uri: string) => void;
  nextImageIndex?: number;
  maxLength?: number;
  maxWords?: number;
  showCharCount?: boolean;
}) {
  const { theme } = useTheme();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [sel, setSel] = useState({ start: 0, end: 0 });

  const syncSel = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    setSel({ start: el.selectionStart, end: el.selectionEnd });
  }, []);

  const replaceAll = useCallback(
    (next: string) => {
      onChange(next);
      requestAnimationFrame(() => taRef.current?.focus());
    },
    [onChange],
  );

  const wrapSelection = useCallback(
    (open: string, close: string) => {
      const { start, end } = sel;
      const before = value.slice(0, start);
      const mid = value.slice(start, end);
      const after = value.slice(end);
      const insert = mid ? `${open}${mid}${close}` : `${open}${close}`;
      replaceAll(before + insert + after);
    },
    [value, sel, replaceAll],
  );

  const insertAtCursor = useCallback(
    (chunk: string) => {
      const { start, end } = sel;
      const before = value.slice(0, start);
      const after = value.slice(end);
      replaceAll(before + chunk + after);
    },
    [value, sel, replaceAll],
  );

  const onPickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void (async () => {
        const dataUrl = await fileToEditorImageDataUrl(file);
        const line =
          onImageAdd != null
            ? `\n![Image](lcimg:${nextImageIndex ?? 0})\n`
            : `\n![image](${dataUrl})\n`;
        const { start, end } = sel;
        const before = value.slice(0, start);
        const after = value.slice(end);
        const next = before + line + after;
        onChange(next);
        onImageAdd?.(dataUrl);
      })();
    };
    input.click();
  };

  const charCount = value.length;
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const over =
    (maxLength != null && charCount > maxLength) ||
    (maxWords != null && wordCount > maxWords);

  return (
    <div>
      <div
        className="mb-2 flex flex-wrap gap-1 rounded-lg border-2 p-1"
        style={{ borderColor: theme.border, backgroundColor: theme.surface }}
      >
        <ToolbarBtn theme={theme} label="Bold" onClick={() => wrapSelection("**", "**")}>
          <Bold className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn theme={theme} label="Italic" onClick={() => wrapSelection("*", "*")}>
          <Italic className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn theme={theme} label="Underline" onClick={() => wrapSelection("__", "__")}>
          <Underline className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn theme={theme} label="Bullet" onClick={() => insertAtCursor("\n• ")}>
          <List className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn theme={theme} label="Numbered" onClick={() => insertAtCursor("\n1. ")}>
          <ListOrdered className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn theme={theme} label="Break" onClick={() => insertAtCursor("\n\n")}>
          <Minus className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn theme={theme} label="Image" onClick={onPickImage}>
          <ImagePlus className="size-4" />
        </ToolbarBtn>
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={syncSel}
        onBlur={syncSel}
        placeholder={placeholder}
        rows={14}
        className="w-full rounded-lg border-2 px-3 py-2 font-sans text-base leading-relaxed"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          color: theme.text,
          minHeight: "220px",
        }}
      />
      {showCharCount ? (
        <p
          className="mt-1 text-right text-xs"
          style={{ color: over ? theme.error : theme.textSecondary }}
        >
          {charCount} chars
          {maxLength != null ? ` / ${maxLength}` : ""} · {wordCount} words
          {maxWords != null ? ` / ${maxWords}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  label,
  theme,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  theme: Theme;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="rounded p-2 hover:opacity-80"
      style={{ color: theme.text, backgroundColor: theme.surface }}
    >
      {children}
    </button>
  );
}
