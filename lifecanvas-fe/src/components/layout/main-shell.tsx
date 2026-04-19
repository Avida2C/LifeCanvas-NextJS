"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellRing,
  BookMarked,
  BookOpen,
  FileText,
  ImageUp,
  ListChecks,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { MoreView } from "@/components/views/more-view";
import { SearchView } from "@/components/views/search-view";
import { fileToGalleryDataUrl, newGalleryPhotoId } from "@/lib/media-utils";
import { savePhoto } from "@/lib/storage";

const primaryTabs = [
  { href: "/me", label: "Me", Icon: User },
  { href: "/planner", label: "Planner", Icon: BookMarked },
  { href: "/inspire", label: "Inspire", Icon: Send },
] as const;

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  const legalDocPage = useMemo(() => {
    const p = pathname ?? "";
    return p === "/terms" || p === "/privacy";
  }, [pathname]);

  const hideChrome = useMemo(() => {
    const p = pathname ?? "";
    if (
      p === "/editor" ||
      p === "/task-editor" ||
      p === "/settings" ||
      p === "/journals" ||
      p === "/debug"
    ) {
      return true;
    }
    if (
      p.startsWith("/note/") ||
      p.startsWith("/journal/") ||
      p.startsWith("/album/")
    ) {
      return true;
    }
    return false;
  }, [pathname]);

  useEffect(() => {
    if (hideChrome) {
      setMenuOpen(false);
      setSearchOpen(false);
      setMoreOpen(false);
    }
  }, [hideChrome]);

  const openCreateMenu = useCallback(() => {
    setSearchOpen(false);
    setMoreOpen(false);
    setMenuOpen((o) => !o);
  }, []);

  const toggleSearch = useCallback(() => {
    setMenuOpen(false);
    setMoreOpen(false);
    setSearchOpen((o) => !o);
  }, []);

  const toggleMore = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMoreOpen((o) => !o);
  }, []);

  const pickMediaUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files?.length) return;
      let failed = 0;
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await fileToGalleryDataUrl(files[i]);
        const ok = await savePhoto({
          id: newGalleryPhotoId(),
          uri: dataUrl,
          createdAt: new Date().toISOString(),
        });
        if (!ok) failed += 1;
      }
      if (failed > 0) {
        alert(
          failed === files.length
            ? "Could not save media. Try freeing device space or check this site’s storage permission in your browser."
            : `Saved ${files.length - failed} of ${files.length}. If this keeps happening, free space or check browser storage settings.`,
        );
      }
      closeMenu();
      router.push("/media");
    };
    input.click();
  }, [closeMenu, router]);

  const overlayOpen = searchOpen || moreOpen;
  const createOverlayOpen = menuOpen;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <main
        className={
          hideChrome
            ? "min-h-0 flex-1 overflow-y-auto"
            : legalDocPage
              ? "min-h-0 flex-1 overflow-y-auto pb-[calc(4.25rem+env(safe-area-inset-bottom))]"
              : "min-h-0 flex-1 overflow-y-auto pb-24"
        }
      >
        {children}
      </main>

      {!hideChrome && createOverlayOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          aria-hidden
          onClick={closeMenu}
        />
      ) : null}

      {!hideChrome && createOverlayOpen ? (
        <div
          className="fixed z-50 flex w-14 flex-col items-center gap-1 rounded-2xl border-2 p-1 shadow-lg"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            backgroundColor: theme.card,
            borderColor: theme.border,
            bottom: "calc(9.5rem + env(safe-area-inset-bottom))",
          }}
          role="dialog"
          aria-label="Create"
        >
          <button
            type="button"
            onClick={closeMenu}
            className="flex size-7 items-center justify-center rounded-full hover:opacity-80"
            style={{ color: theme.textSecondary }}
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
          <ul className="flex w-full flex-col gap-1">
            <li className="w-full">
              <button
                type="button"
                title="Reminder — set up a reminder"
                aria-label="Create reminder"
                className="flex size-12 w-full items-center justify-center rounded-xl border-2 hover:opacity-90"
                style={{
                  borderColor: theme.border,
                  color: theme.primary,
                  backgroundColor: theme.surface,
                }}
                onClick={() => {
                  closeMenu();
                  router.push("/planner?openReminder=1");
                }}
              >
                <BellRing className="size-5" strokeWidth={2} />
              </button>
            </li>
            <li className="w-full">
              <button
                type="button"
                title="Journal — write about your day"
                aria-label="Create journal entry"
                className="flex size-12 w-full items-center justify-center rounded-xl border-2 hover:opacity-90"
                style={{
                  borderColor: theme.border,
                  color: theme.primary,
                  backgroundColor: theme.surface,
                }}
                onClick={() => {
                  closeMenu();
                  router.push("/editor?type=journal");
                }}
              >
                <BookOpen className="size-5" strokeWidth={2} />
              </button>
            </li>
            <li className="w-full">
              <button
                type="button"
                title="Note — quick thoughts and ideas"
                aria-label="Create note"
                className="flex size-12 w-full items-center justify-center rounded-xl border-2 hover:opacity-90"
                style={{
                  borderColor: theme.border,
                  color: theme.primary,
                  backgroundColor: theme.surface,
                }}
                onClick={() => {
                  closeMenu();
                  router.push("/editor?type=note");
                }}
              >
                <FileText className="size-5" strokeWidth={2} />
              </button>
            </li>
            <li className="w-full">
              <button
                type="button"
                title="Upload — add photos or videos to Media"
                aria-label="Upload photos or videos"
                className="flex size-12 w-full items-center justify-center rounded-xl border-2 hover:opacity-90"
                style={{
                  borderColor: theme.border,
                  color: theme.primary,
                  backgroundColor: theme.surface,
                }}
                onClick={() => {
                  void pickMediaUpload();
                }}
              >
                <ImageUp className="size-5" strokeWidth={2} />
              </button>
            </li>
            <li className="w-full">
              <button
                type="button"
                title="Task list — organize your tasks"
                aria-label="Create task list"
                className="flex size-12 w-full items-center justify-center rounded-xl border-2 hover:opacity-90"
                style={{
                  borderColor: theme.border,
                  color: theme.primary,
                  backgroundColor: theme.surface,
                }}
                onClick={() => {
                  closeMenu();
                  router.push("/task-editor");
                }}
              >
                <ListChecks className="size-5" strokeWidth={2} />
              </button>
            </li>
          </ul>
        </div>
      ) : null}

      {!hideChrome && overlayOpen ? (
        <div
          className="fixed inset-0 z-[42] bg-black/40"
          aria-hidden
          onClick={() => {
            closeSearch();
            closeMore();
          }}
        />
      ) : null}

      {!hideChrome && searchOpen ? (
        <div
          id="search-sheet"
          className="fixed inset-x-0 z-[45] flex max-h-[min(85dvh,calc(100dvh-5.5rem))] flex-col rounded-t-2xl border-2 shadow-2xl"
          style={{
            bottom: "calc(4.25rem + env(safe-area-inset-bottom))",
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <SearchView onDismiss={closeSearch} onNavigate={closeSearch} />
        </div>
      ) : null}

      {!hideChrome && moreOpen ? (
        <aside
          className="fixed inset-y-0 left-0 z-[45] flex w-[min(21rem,90vw)] max-w-full flex-col border-r shadow-2xl"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.divider,
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="More"
        >
          <MoreView onDismiss={closeMore} onNavigate={closeMore} />
        </aside>
      ) : null}

      {!hideChrome ? (
        <button
          type="button"
          onClick={openCreateMenu}
          className="fixed z-35 flex size-14 items-center justify-center rounded-full border-2 shadow-md"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "calc(5rem + env(safe-area-inset-bottom))",
            backgroundColor: theme.primary,
            borderColor: theme.surface,
            color: "#fff",
          }}
          aria-label={menuOpen ? "Close create menu" : "Open create menu"}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
        >
          <Plus className="size-8" strokeWidth={2.5} />
        </button>
      ) : null}

      {!hideChrome ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 border-t-2 pb-[env(safe-area-inset-bottom)]"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div className="mx-auto flex max-w-lg items-end justify-around px-1 pt-3">
            {primaryTabs.map(({ href, label, Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1 pb-2 text-xs"
                  style={{
                    color: active ? theme.primary : theme.textSecondary,
                  }}
                >
                  <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={toggleSearch}
              className="flex flex-col items-center gap-1 pb-2 text-xs"
              style={{
                color: searchOpen ? theme.primary : theme.textSecondary,
              }}
              aria-expanded={searchOpen}
              aria-controls="search-sheet"
              aria-label="Search"
            >
              <Search className="size-6" strokeWidth={searchOpen ? 2.5 : 2} />
              Search
            </button>
            <button
              type="button"
              onClick={toggleMore}
              className="flex flex-col items-center gap-1 pb-2 text-xs"
              style={{
                color: moreOpen ? theme.primary : theme.textSecondary,
              }}
              aria-expanded={moreOpen}
              aria-label="More"
            >
              <MoreHorizontal
                className="size-6"
                strokeWidth={moreOpen ? 2.5 : 2}
              />
              More
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
