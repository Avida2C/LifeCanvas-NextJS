"use client";

import type { ReactNode } from "react";
import { Suspense, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const EMBED_PARAM = "embed";
const EMBED_VALUE = "1";
/** Viewport width at which the app is shown inside a phone-sized iframe. */
const DESKTOP_MIN_WIDTH_PX = 768;
const FRAME_MAX_W = 430;
const FRAME_MAX_H = 932;

const desktopMediaQuery = `(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`;

function buildEmbedSrc(pathname: string, searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams.toString());
  next.set(EMBED_PARAM, EMBED_VALUE);
  const qs = next.toString();
  return qs.length > 0 ? `${pathname}?${qs}` : `${pathname}?${EMBED_PARAM}=${EMBED_VALUE}`;
}

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(desktopMediaQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopMediaQuery).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );
}

/** Decorative side button (mute / volume style). */
function SideButton({
  heightClass,
  className = "",
}: {
  heightClass: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`w-[3px] rounded-sm bg-linear-to-b from-neutral-500 via-neutral-600 to-neutral-700 ${heightClass} ${className}`}
    />
  );
}

/** Shows phone-like framed preview on desktop, plain app shell on mobile. */
function DesktopMobileFrameInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get(EMBED_PARAM) === EMBED_VALUE;
  const isDesktop = useIsDesktop();

  const shell = (
    <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
  );

  if (isEmbed || !isDesktop) {
    return shell;
  }

  const src = buildEmbedSrc(pathname, searchParams);

  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden p-6">
      {/* Studio-style backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#0c0e14] via-[#12151f] to-[#0a0b10]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(99,102,241,0.22),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_80%,rgba(14,165,233,0.12),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_0%_60%,rgba(167,139,250,0.1),transparent_45%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.4] mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/25"
      />

      <div
        className="relative z-10 shrink-0"
        style={{
          width: `min(100%, ${FRAME_MAX_W}px)`,
          height: `min(${FRAME_MAX_H}px, calc(100dvh - 3rem))`,
          maxWidth: FRAME_MAX_W,
          maxHeight: FRAME_MAX_H,
        }}
      >
        {/* Left rail — volume / action buttons */}
        <div className="pointer-events-none absolute -left-[5px] top-[20%] z-10 flex flex-col gap-2">
          <SideButton heightClass="h-7" className="rounded-l-md rounded-r-[1px]" />
          <SideButton heightClass="h-12" className="rounded-l-md rounded-r-[1px]" />
          <SideButton heightClass="h-12" className="rounded-l-md rounded-r-[1px]" />
        </div>
        {/* Right rail — power */}
        <div className="pointer-events-none absolute -right-[5px] top-[24%] z-10 flex flex-col">
          <SideButton heightClass="h-16" className="rounded-r-md rounded-l-[1px]" />
        </div>

        {/* Device body: brushed metal / graphite shell */}
        <div className="flex size-full flex-col overflow-hidden rounded-[2.65rem] border border-neutral-700/90 bg-linear-to-b from-[#4a4a4f] via-[#353538] to-[#252528] p-[11px] ring-1 ring-inset ring-white/6">
          {/* Inner faceplate + screen stack */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.05rem] border border-black/50 bg-[#0a0a0a]">
            {/* Top bezel + dynamic island */}
            <div className="relative flex h-11 shrink-0 items-end justify-center bg-[#0a0a0a] pb-2">
              <div
                aria-hidden
                className="flex h-[31px] w-[112px] items-center justify-center rounded-full bg-black ring-1 ring-neutral-800/90"
              >
                <div className="h-2 w-8 rounded-full bg-neutral-900/90" />
              </div>
            </div>

            {/* Display */}
            <div className="min-h-0 flex-1 bg-black px-1.5 pb-1.5">
              <div className="size-full overflow-hidden rounded-b-[1.35rem] rounded-t-[0.65rem] bg-black ring-1 ring-neutral-900">
                <iframe
                  title="LifeCanvas"
                  src={src}
                  className="block size-full border-0"
                  style={{ maxWidth: FRAME_MAX_W, maxHeight: FRAME_MAX_H }}
                />
              </div>
            </div>

            {/* Bottom bezel + home indicator */}
            <div className="flex h-10 shrink-0 items-center justify-center bg-[#0a0a0a]">
              <div
                aria-hidden
                className="h-[5px] w-[134px] rounded-full bg-neutral-600/70"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DesktopMobileFrame({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<div className="flex min-h-dvh flex-1 flex-col">{children}</div>}
    >
      <DesktopMobileFrameInner>{children}</DesktopMobileFrameInner>
    </Suspense>
  );
}
