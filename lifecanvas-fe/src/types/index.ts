// Type definitions for LifeCanvas app

import type { AccentId } from "@/lib/theme";

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  images?: string[]; // Array of image IDs from the gallery
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  images?: string[]; // Array of image IDs from the gallery
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubTask {
  id: number;
  content: string;
  done: boolean;
}

export interface TaskList {
  id: string | null;
  title?: string;
  tasks: SubTask[];
}

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ReminderPriority = 'low' | 'medium' | 'high';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string (start date for recurring)
  time: string; // Time in HH:MM format (start time)
  endTime?: string; // Optional end time in HH:MM format for time ranges
  notificationId?: string;
  createdAt: string;
  // Advanced options
  repeat?: ReminderRepeat;
  priority?: ReminderPriority;
  enableSound?: boolean;
  enableVibration?: boolean;
  advanceNotice?: number; // Minutes before to send additional notification (0 = disabled)
  // Recurring options
  endDate?: string; // ISO date string - when recurring reminder ends (null = no end)
  selectedDays?: number[]; // For weekly/daily: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
}

export interface Quote {
  quote: string;
  author: string;
  exists?: boolean;
  /** From Inspire: saved from Quotes vs Affirmations tab. Omitted = quote (legacy). */
  kind?: "quote" | "affirmation";
}

export interface Affirmation {
  id: string;
  text: string;
  createdAt: string;
}

/** User-authored quote (Created by me); shown with [Quote] / [Author Name] fields. */
export interface UserCreatedQuote {
  id: string;
  quote: string;
  author: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  uri: string;
  createdAt: string;
  albumId?: string; // Optional album ID, null/undefined means 'All Photos'
  name?: string;
  description?: string;
}

export interface Album {
  id: string;
  name: string;
  /** Optional note shown in album management */
  description?: string;
  coverPhotoUri?: string;
  coverPhotoId?: string; // Specific photo ID set as cover
  createdAt: string;
  photoCount: number;
}

export interface UserSettings {
  /** Display name (Me tab). Kept in sync with nickname when set. */
  name: string;
  /** Login-style handle (e.g. demo account). */
  username?: string;
  /** Preferred display name; falls back to `name`. */
  nickname?: string;
  email?: string;
  /** Optional profile photo (data URL), stored locally. */
  avatarDataUrl?: string;
  /** Gallery photo id when avatar is a cropped copy of that item (for Media UI). */
  avatarGalleryPhotoId?: string;
  darkMode: boolean;
  /** Primary / accent palette for light and dark themes. */
  accentColor?: AccentId;
  memberSince?: string;
  timezone?: string;
}

export type RootStackParamList = {
  Login: undefined;
  Main: { screen?: string; params?: unknown } | undefined;
  Editor: { type: 'journal' | 'note'; id?: string };
  NoteView: { id: string };
  JournalView: { id: string };
  TaskEditor: { id?: string };
  Favorites: undefined;
  Settings: undefined;
  Affirmations: undefined;
  AlbumView: { albumId: string; albumName: string };
  JournalsList: undefined;
  Debug: undefined;
};

export type MainTabParamList = {
  Me: undefined;
  Planner: { initialTab?: 'calendar' | 'notes' | 'tasks'; openReminderModal?: boolean } | undefined;
  Create: undefined;
  Media: undefined;
  Inspire: undefined;
};

