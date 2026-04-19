"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";

function isEditableTarget(node: EventTarget | null) {
  if (!(node instanceof Element)) return false;
  return Boolean(
    node.closest(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable]:not([contenteditable="false"])'
    )
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
