export const lightTheme = {
  primary: "#ff784a",
  secondary: "#ff9066",
  background: "#f4f5f8",
  surface: "#ffffff",
  card: "#ffffff",
  text: "#2d3748",
  textSecondary: "#92949c",
  border: "#ff784a",
  error: "#e74c3c",
  success: "#2ecc71",
  warning: "#f39c12",
  shadow: "#000000",
  divider: "rgba(0,0,0,0.1)",
  avatarBg: "#ff784a",
  avatarText: "#ffffff",
  statNumber: "#ff784a",
  fabBg: "#ff784a",
  fabIcon: "#ffffff",
  statusBarStyle: "dark-content" as const,
  statusBarBg: "#ffffff",
};

export const darkTheme = {
  primary: "#ff8a65",
  secondary: "#ffab91",
  background: "#121212",
  surface: "#1e1e1e",
  card: "#1e1e1e",
  text: "#f4f4f4",
  textSecondary: "#9d9fa6",
  border: "#ff8a65",
  error: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  shadow: "#000000",
  divider: "rgba(255,255,255,0.1)",
  avatarBg: "#ff8a65",
  avatarText: "#ffffff",
  statNumber: "#ff9066",
  fabBg: "#ff8a65",
  fabIcon: "#ffffff",
  statusBarStyle: "light-content" as const,
  statusBarBg: "#121212",
};

export type Theme = typeof lightTheme | typeof darkTheme;

export type AccentId =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "pink"
  | "purple";

export const DEFAULT_ACCENT: AccentId = "orange";

type AccentPatch = Pick<
  typeof lightTheme,
  "primary" | "secondary" | "border" | "avatarBg" | "statNumber" | "fabBg"
>;

const ACCENT_PATCH: Record<AccentId, { light: AccentPatch; dark: AccentPatch }> = {
  red: {
    light: {
      primary: "#dc2626",
      secondary: "#ef4444",
      border: "#dc2626",
      avatarBg: "#dc2626",
      statNumber: "#dc2626",
      fabBg: "#dc2626",
    },
    dark: {
      primary: "#f87171",
      secondary: "#fca5a5",
      border: "#f87171",
      avatarBg: "#f87171",
      statNumber: "#fca5a5",
      fabBg: "#f87171",
    },
  },
  orange: {
    light: {
      primary: "#ff784a",
      secondary: "#ff9066",
      border: "#ff784a",
      avatarBg: "#ff784a",
      statNumber: "#ff784a",
      fabBg: "#ff784a",
    },
    dark: {
      primary: "#ff8a65",
      secondary: "#ffab91",
      border: "#ff8a65",
      avatarBg: "#ff8a65",
      statNumber: "#ff9066",
      fabBg: "#ff8a65",
    },
  },
  yellow: {
    light: {
      primary: "#ca8a04",
      secondary: "#eab308",
      border: "#ca8a04",
      avatarBg: "#ca8a04",
      statNumber: "#ca8a04",
      fabBg: "#ca8a04",
    },
    dark: {
      primary: "#facc15",
      secondary: "#fde047",
      border: "#facc15",
      avatarBg: "#eab308",
      statNumber: "#fde047",
      fabBg: "#eab308",
    },
  },
  green: {
    light: {
      primary: "#16a34a",
      secondary: "#22c55e",
      border: "#16a34a",
      avatarBg: "#16a34a",
      statNumber: "#16a34a",
      fabBg: "#16a34a",
    },
    dark: {
      primary: "#4ade80",
      secondary: "#86efac",
      border: "#4ade80",
      avatarBg: "#22c55e",
      statNumber: "#86efac",
      fabBg: "#22c55e",
    },
  },
  teal: {
    light: {
      primary: "#0d9488",
      secondary: "#14b8a6",
      border: "#0d9488",
      avatarBg: "#0d9488",
      statNumber: "#0d9488",
      fabBg: "#0d9488",
    },
    dark: {
      primary: "#2dd4bf",
      secondary: "#5eead4",
      border: "#2dd4bf",
      avatarBg: "#14b8a6",
      statNumber: "#5eead4",
      fabBg: "#14b8a6",
    },
  },
  blue: {
    light: {
      primary: "#2563eb",
      secondary: "#3b82f6",
      border: "#2563eb",
      avatarBg: "#2563eb",
      statNumber: "#2563eb",
      fabBg: "#2563eb",
    },
    dark: {
      primary: "#60a5fa",
      secondary: "#93c5fd",
      border: "#60a5fa",
      avatarBg: "#3b82f6",
      statNumber: "#93c5fd",
      fabBg: "#3b82f6",
    },
  },
  pink: {
    light: {
      primary: "#db2777",
      secondary: "#ec4899",
      border: "#db2777",
      avatarBg: "#db2777",
      statNumber: "#db2777",
      fabBg: "#db2777",
    },
    dark: {
      primary: "#f472b6",
      secondary: "#f9a8d4",
      border: "#f472b6",
      avatarBg: "#ec4899",
      statNumber: "#f9a8d4",
      fabBg: "#ec4899",
    },
  },
  purple: {
    light: {
      primary: "#7c3aed",
      secondary: "#8b5cf6",
      border: "#7c3aed",
      avatarBg: "#7c3aed",
      statNumber: "#7c3aed",
      fabBg: "#7c3aed",
    },
    dark: {
      primary: "#a78bfa",
      secondary: "#c4b5fd",
      border: "#a78bfa",
      avatarBg: "#8b5cf6",
      statNumber: "#c4b5fd",
      fabBg: "#8b5cf6",
    },
  },
};

export const ACCENT_OPTIONS: ReadonlyArray<{
  id: AccentId;
  label: string;
  swatch: string;
}> = [
  { id: "red", label: "Red", swatch: "#dc2626" },
  { id: "orange", label: "Orange", swatch: "#ff784a" },
  { id: "yellow", label: "Yellow", swatch: "#ca8a04" },
  { id: "green", label: "Green", swatch: "#16a34a" },
  { id: "teal", label: "Teal", swatch: "#0d9488" },
  { id: "blue", label: "Blue", swatch: "#2563eb" },
  { id: "pink", label: "Pink", swatch: "#db2777" },
  { id: "purple", label: "Purple", swatch: "#7c3aed" },
];

export function buildTheme(isDark: boolean, accent: AccentId): Theme {
  const base = isDark ? darkTheme : lightTheme;
  const patch = ACCENT_PATCH[accent][isDark ? "dark" : "light"];
  return { ...base, ...patch };
}

export function parseAccentId(value: unknown): AccentId {
  if (typeof value === "string" && value in ACCENT_PATCH) {
    return value as AccentId;
  }
  return DEFAULT_ACCENT;
}
