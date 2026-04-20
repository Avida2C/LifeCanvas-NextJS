import type {
  JournalEntry,
  Note,
  Task,
  Photo,
  UserSettings,
  TaskList,
  Affirmation,
  UserCreatedQuote,
  Album,
  Reminder,
} from "@/types";
import { getAllPhotos, saveAllPhotos } from "@/lib/photos-idb";
import { canUseAsAlbumCover, newGalleryPhotoId } from "@/lib/media-utils";

const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

/** Keys in localStorage. Photos are stored in IndexedDB (`lifecanvas` DB), not here. */
export const STORAGE_KEY_NAMES = [
  "@lifecanvas_user_settings",
  "@lifecanvas_journal_entries",
  "@lifecanvas_notes",
  "@lifecanvas_tasks",
  "@lifecanvas_favorites",
  "@lifecanvas_affirmations",
  "@lifecanvas_albums",
  "@lifecanvas_reminders",
  "@lifecanvas_task_lists",
  "@lifecanvas_default_quote",
  "@lifecanvas_default_affirmation",
  "@lifecanvas_my_quotes",
] as const;

const KEYS = {
  USER_SETTINGS: "@lifecanvas_user_settings",
  JOURNAL_ENTRIES: "@lifecanvas_journal_entries",
  NOTES: "@lifecanvas_notes",
  TASKS: "@lifecanvas_tasks",
  FAVORITES: "@lifecanvas_favorites",
  AFFIRMATIONS: "@lifecanvas_affirmations",
  MY_QUOTES: "@lifecanvas_my_quotes",
  ALBUMS: "@lifecanvas_albums",
  REMINDERS: "@lifecanvas_reminders",
};

// User Settings
export const getUserSettings = async (): Promise<UserSettings | null> => {
  try {
    const data = await safeStorage.getItem(KEYS.USER_SETTINGS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
};

export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  try {
    await safeStorage.setItem(KEYS.USER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving user settings:', error);
  }
};

/** Removes saved profile (name, theme prefs). User must sign in again from the login screen. */
export const clearUserSettings = async (): Promise<void> => {
  try {
    await safeStorage.removeItem(KEYS.USER_SETTINGS);
  } catch (error) {
    console.error("Error clearing user settings:", error);
  }
};

// Journal Entries
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.JOURNAL_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
};

export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  try {
    const entries = await getJournalEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.unshift(entry);
    }
    
    await safeStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving journal entry:', error);
  }
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  try {
    const entries = await getJournalEntries();
    const filtered = entries.filter(e => e.id !== id);
    await safeStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting journal entry:', error);
  }
};

// Notes
export const getNotes = async (): Promise<Note[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
};

export const saveNote = async (note: Note): Promise<void> => {
  try {
    const notes = await getNotes();
    const index = notes.findIndex(n => n.id === note.id);
    
    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.unshift(note);
    }
    
    await safeStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving note:', error);
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    const notes = await getNotes();
    const filtered = notes.filter(n => n.id !== id);
    await safeStorage.setItem(KEYS.NOTES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting note:', error);
  }
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

export const saveTask = async (task: Task): Promise<void> => {
  try {
    const tasks = await getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    
    await safeStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving task:', error);
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    const tasks = await getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    await safeStorage.setItem(KEYS.TASKS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

// Photos (IndexedDB — much larger than localStorage quota)
export const getPhotos = async (): Promise<Photo[]> => {
  try {
    return await getAllPhotos();
  } catch (error) {
    console.error("Error getting photos:", error);
    return [];
  }
};

/** @returns false if storage failed (rare with IndexedDB; still possible if disk is full) */
export const savePhoto = async (photo: Photo): Promise<boolean> => {
  try {
    const photos = await getPhotos();
    photos.unshift(photo);
    await saveAllPhotos(photos);

    if (photo.albumId) {
      await updateAlbumPhotoCount(photo.albumId);
    }
    return true;
  } catch (error) {
    console.error("Error saving photo:", error);
    return false;
  }
};

/**
 * Adds a data-URL image or video to All media (same store as Media tab).
 * Profile and note/journal uploads use this so they appear in the gallery.
 */
export async function saveDataUrlToMediaGallery(
  dataUrl: string,
  options?: { name?: string },
): Promise<boolean> {
  const id = await saveDataUrlToMediaGalleryAndGetId(dataUrl, options);
  return id != null;
}

/**
 * Adds a data-URL image or video to All media and returns the stored media id.
 * Returns null if invalid input or storage fails.
 */
export async function saveDataUrlToMediaGalleryAndGetId(
  dataUrl: string,
  options?: { name?: string; id?: string },
): Promise<string | null> {
  if (
    !dataUrl.startsWith("data:image/") &&
    !dataUrl.startsWith("data:video/")
  ) {
    return null;
  }
  const id = options?.id ?? newGalleryPhotoId();
  const ok = await savePhoto({
    id,
    uri: dataUrl,
    createdAt: new Date().toISOString(),
    name: options?.name,
  });
  return ok ? id : null;
}

export const updatePhoto = async (id: string, updates: Partial<Photo>): Promise<void> => {
  try {
    const photos = await getPhotos();
    const updatedPhotos = photos.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    await saveAllPhotos(updatedPhotos);
  } catch (error) {
    console.error("Error updating photo:", error);
  }
};

/** Remove a deleted gallery image from note/journal body + images[] (lcimg indices remapped). */
function purgeImageUriFromNoteOrJournal(
  content: string,
  images: string[] | undefined,
  deleted: { id: string; uri: string },
): { content: string; images?: string[]; changed: boolean } {
  const imgs = images ?? [];
  const removedIndices = new Set<number>();
  imgs.forEach((u, i) => {
    if (u === deleted.id || u === deleted.uri) removedIndices.add(i);
  });
  const newImages = imgs.filter((u) => u !== deleted.id && u !== deleted.uri);

  const oldToNew = new Map<number, number>();
  imgs.forEach((u, i) => {
    if (removedIndices.has(i)) return;
    const ni = newImages.indexOf(u);
    if (ni >= 0) oldToNew.set(i, ni);
  });

  const lines = content.split("\n");
  const out: string[] = [];
  let changed = removedIndices.size > 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const lc = trimmed.match(/^!\[([^\]]*)\]\(lcimg:(\d+)\)\s*$/);
    if (lc) {
      const idx = Number.parseInt(lc[2], 10);
      if (removedIndices.has(idx)) {
        changed = true;
        continue;
      }
      const newIdx = oldToNew.get(idx);
      if (newIdx === undefined) {
        changed = true;
        continue;
      }
      if (newIdx !== idx) {
        changed = true;
        out.push(line.replace(/\(lcimg:\d+\)/, `(lcimg:${newIdx})`));
      } else {
        out.push(line);
      }
      continue;
    }
    const legacy = trimmed.match(/^!\[([^\]]*)\]\((.+)\)\s*$/);
    if (legacy && legacy[2] === deleted.uri) {
      changed = true;
      continue;
    }
    out.push(line);
  }

  return {
    content: out.join("\n"),
    images: newImages.length > 0 ? newImages : undefined,
    changed,
  };
}

async function purgeReferencesToDeletedMedia(photo: Photo): Promise<void> {
  const uri = photo.uri;
  const deleted = { id: photo.id, uri: photo.uri };

  try {
    const settings = await getUserSettings();
    if (
      settings &&
      (settings.avatarDataUrl === uri ||
        settings.avatarGalleryPhotoId === photo.id)
    ) {
      await saveUserSettings({
        ...settings,
        avatarDataUrl: undefined,
        avatarGalleryPhotoId: undefined,
      });
    }
  } catch (e) {
    console.error("Error clearing avatar for deleted media:", e);
  }

  try {
    const notes = await getNotes();
    let notesChanged = false;
    const nextNotes = notes.map((note) => {
      const r = purgeImageUriFromNoteOrJournal(note.content, note.images, deleted);
      if (!r.changed) return note;
      notesChanged = true;
      return {
        ...note,
        content: r.content,
        images: r.images,
      };
    });
    if (notesChanged) {
      await safeStorage.setItem(KEYS.NOTES, JSON.stringify(nextNotes));
    }
  } catch (e) {
    console.error("Error purging deleted media from notes:", e);
  }

  try {
    const journals = await getJournalEntries();
    let journalsChanged = false;
    const nextJournals = journals.map((entry) => {
      const r = purgeImageUriFromNoteOrJournal(entry.content, entry.images, deleted);
      if (!r.changed) return entry;
      journalsChanged = true;
      return {
        ...entry,
        content: r.content,
        images: r.images,
      };
    });
    if (journalsChanged) {
      await safeStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(nextJournals));
    }
  } catch (e) {
    console.error("Error purging deleted media from journals:", e);
  }

  try {
    const albums = await getAlbums();
    for (const a of albums) {
      if (a.coverPhotoId === photo.id) {
        await updateAlbumPhotoCount(a.id);
      }
    }
  } catch (e) {
    console.error("Error refreshing album covers after delete:", e);
  }
}

export type PhotoDeleteImpact = {
  usedAsProfile: boolean;
  noteEntriesAffected: number;
  journalEntriesAffected: number;
  albumCoversAffected: number;
};

/** Counts other places that will change if this gallery item is deleted. */
export async function getPhotoDeleteImpact(
  photo: Photo,
): Promise<PhotoDeleteImpact> {
  const uri = photo.uri;
  let usedAsProfile = false;
  try {
    const settings = await getUserSettings();
    usedAsProfile = Boolean(
      settings &&
        (settings.avatarDataUrl === uri ||
          settings.avatarGalleryPhotoId === photo.id),
    );
  } catch {
    // ignore
  }

  let noteEntriesAffected = 0;
  try {
    const notes = await getNotes();
    for (const note of notes) {
      if (purgeImageUriFromNoteOrJournal(note.content, note.images, { id: photo.id, uri }).changed) {
        noteEntriesAffected += 1;
      }
    }
  } catch {
    // ignore
  }

  let journalEntriesAffected = 0;
  try {
    const journals = await getJournalEntries();
    for (const entry of journals) {
      if (
        purgeImageUriFromNoteOrJournal(entry.content, entry.images, { id: photo.id, uri }).changed
      ) {
        journalEntriesAffected += 1;
      }
    }
  } catch {
    // ignore
  }

  let albumCoversAffected = 0;
  try {
    const albums = await getAlbums();
    albumCoversAffected = albums.filter((a) => a.coverPhotoId === photo.id)
      .length;
  } catch {
    // ignore
  }

  return {
    usedAsProfile,
    noteEntriesAffected,
    journalEntriesAffected,
    albumCoversAffected,
  };
}

export const deletePhoto = async (id: string): Promise<void> => {
  try {
    const photos = await getPhotos();
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    const filtered = photos.filter((p) => p.id !== id);
    await saveAllPhotos(filtered);

    await purgeReferencesToDeletedMedia(photo);

    if (photo.albumId) {
      await updateAlbumPhotoCount(photo.albumId);
    }
  } catch (error) {
    console.error("Error deleting photo:", error);
  }
};

// Favorites (quotes)
export const getFavorites = async (): Promise<string[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.FAVORITES);
    if (!data) return [];
    
    const favorites = JSON.parse(data);
    
    // Migrate old format favorites (plain text) to new format (JSON objects)
    const migrated = favorites.map((item: string) => {
      try {
        // Try to parse as JSON - if it works, it's already in new format
        JSON.parse(item);
        return item;
      } catch {
        // Old format (plain text) - convert to new format
        return JSON.stringify({
          quote: item,
          author: 'Unknown',
        });
      }
    });
    
    // Save migrated favorites back
    if (JSON.stringify(favorites) !== JSON.stringify(migrated)) {
      await safeStorage.setItem(KEYS.FAVORITES, JSON.stringify(migrated));
    }
    
    return migrated;
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const addFavorite = async (quoteId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(quoteId)) {
      favorites.push(quoteId);
      await safeStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
};

export const removeFavorite = async (quoteId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter(id => id !== quoteId);
    await safeStorage.setItem(KEYS.FAVORITES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

// Get a specific journal entry by ID
export const getJournalEntry = async (id: string): Promise<JournalEntry | undefined> => {
  const entries = await getJournalEntries();
  return entries.find(entry => entry.id === id);
};

// Get a specific note by ID
export const getNote = async (id: string): Promise<Note | undefined> => {
  const notes = await getNotes();
  return notes.find(note => note.id === id);
};

// Get a specific task by ID
export const getTask = async (id: string): Promise<Task | undefined> => {
  const tasks = await getTasks();
  return tasks.find(task => task.id === id);
};

// TaskList operations (for the original Angular-style task editor)
export const getTaskLists = async (): Promise<TaskList[]> => {
  try {
    const data = await safeStorage.getItem('@lifecanvas_task_lists');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting task lists:', error);
    return [];
  }
};

export const saveTaskList = async (taskList: TaskList): Promise<void> => {
  try {
    const taskLists = await getTaskLists();
    
    if (taskList.id === null) {
      // Create new task list
      const maxId = taskLists.length > 0 
        ? Math.max(...taskLists.map(tl => parseInt(tl.id || '0'))) + 1
        : 1;
      taskList.id = maxId.toString();
      taskLists.push(taskList);
    } else {
      // Update existing task list
      const index = taskLists.findIndex(tl => tl.id === taskList.id);
      if (index !== -1) {
        taskLists[index] = taskList;
      } else {
        taskLists.push(taskList);
      }
    }
    
    await safeStorage.setItem('@lifecanvas_task_lists', JSON.stringify(taskLists));
  } catch (error) {
    console.error('Error saving task list:', error);
  }
};

export const getTaskList = async (id: string): Promise<TaskList | undefined> => {
  const taskLists = await getTaskLists();
  return taskLists.find(tl => tl.id === id);
};

export const deleteTaskList = async (id: string): Promise<void> => {
  try {
    const taskLists = await getTaskLists();
    const filtered = taskLists.filter(tl => tl.id !== id);
    await safeStorage.setItem('@lifecanvas_task_lists', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting task list:', error);
  }
};

// Default Quote (for profile)
export const getDefaultQuote = async (): Promise<string | null> => {
  try {
    const data = await safeStorage.getItem('@lifecanvas_default_quote');
    return data;
  } catch (error) {
    console.error('Error getting default quote:', error);
    return null;
  }
};

export const setDefaultQuote = async (quoteText: string | null): Promise<void> => {
  try {
    if (quoteText === null) {
      await safeStorage.removeItem('@lifecanvas_default_quote');
    } else {
      await safeStorage.setItem('@lifecanvas_default_quote', quoteText);
    }
  } catch (error) {
    console.error('Error setting default quote:', error);
  }
};

// Affirmations
export const getAffirmations = async (): Promise<Affirmation[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.AFFIRMATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting affirmations:', error);
    return [];
  }
};

export const saveAffirmation = async (text: string): Promise<void> => {
  try {
    const affirmations = await getAffirmations();
    const newAffirmation: Affirmation = {
      id: Date.now().toString(),
      text,
      createdAt: new Date().toISOString(),
    };
    affirmations.push(newAffirmation);
    await safeStorage.setItem(KEYS.AFFIRMATIONS, JSON.stringify(affirmations));
  } catch (error) {
    console.error('Error saving affirmation:', error);
  }
};

export const updateAffirmation = async (id: string, text: string): Promise<void> => {
  try {
    const affirmations = await getAffirmations();
    const updated = affirmations.map(a => 
      a.id === id ? { ...a, text } : a
    );
    await safeStorage.setItem(KEYS.AFFIRMATIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating affirmation:', error);
  }
};

export const deleteAffirmation = async (id: string): Promise<void> => {
  try {
    const affirmations = await getAffirmations();
    const filtered = affirmations.filter(a => a.id !== id);
    await safeStorage.setItem(KEYS.AFFIRMATIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting affirmation:', error);
  }
};

// User-created quotes (Created by me)
export const getMyQuotes = async (): Promise<UserCreatedQuote[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.MY_QUOTES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting my quotes:', error);
    return [];
  }
};

export const addMyQuote = async (quote: string, author: string): Promise<void> => {
  try {
    const list = await getMyQuotes();
    const next: UserCreatedQuote = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      quote: quote.trim(),
      author: author.trim() || 'Unknown',
      createdAt: new Date().toISOString(),
    };
    list.unshift(next);
    await safeStorage.setItem(KEYS.MY_QUOTES, JSON.stringify(list));
  } catch (error) {
    console.error('Error saving my quote:', error);
  }
};

export const updateMyQuote = async (id: string, quote: string, author: string): Promise<void> => {
  try {
    const list = await getMyQuotes();
    const updated = list.map((q) =>
      q.id === id
        ? { ...q, quote: quote.trim(), author: author.trim() || 'Unknown' }
        : q,
    );
    await safeStorage.setItem(KEYS.MY_QUOTES, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating my quote:', error);
  }
};

export const deleteMyQuote = async (id: string): Promise<void> => {
  try {
    const list = await getMyQuotes();
    await safeStorage.setItem(
      KEYS.MY_QUOTES,
      JSON.stringify(list.filter((q) => q.id !== id)),
    );
  } catch (error) {
    console.error('Error deleting my quote:', error);
  }
};

// Default Affirmation (for profile)
export const getDefaultAffirmation = async (): Promise<string | null> => {
  try {
    const data = await safeStorage.getItem('@lifecanvas_default_affirmation');
    return data;
  } catch (error) {
    console.error('Error getting default affirmation:', error);
    return null;
  }
};

export const setDefaultAffirmation = async (affirmationText: string | null): Promise<void> => {
  try {
    if (affirmationText === null) {
      await safeStorage.removeItem('@lifecanvas_default_affirmation');
    } else {
      await safeStorage.setItem('@lifecanvas_default_affirmation', affirmationText);
    }
  } catch (error) {
    console.error('Error setting default affirmation:', error);
  }
};

// Albums
export const getAlbums = async (): Promise<Album[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.ALBUMS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting albums:', error);
    return [];
  }
};

export const saveAlbum = async (album: Album): Promise<void> => {
  try {
    const albums = await getAlbums();
    const existingIndex = albums.findIndex(a => a.id === album.id);
    
    if (existingIndex >= 0) {
      albums[existingIndex] = album;
    } else {
      albums.push(album);
    }
    
    await safeStorage.setItem(KEYS.ALBUMS, JSON.stringify(albums));
  } catch (error) {
    console.error('Error saving album:', error);
  }
};

export const createAlbum = async (name: string): Promise<Album> => {
  const newAlbum: Album = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
    photoCount: 0,
  };
  await saveAlbum(newAlbum);
  return newAlbum;
};

export const updateAlbum = async (
  id: string,
  updates: Partial<Pick<Album, "name" | "description">>,
): Promise<void> => {
  try {
    const albums = await getAlbums();
    const i = albums.findIndex((a) => a.id === id);
    if (i < 0) return;
    const cur = albums[i];
    const name =
      updates.name !== undefined ? (updates.name.trim() || cur.name) : cur.name;
    const description =
      updates.description !== undefined
        ? updates.description.trim() || undefined
        : cur.description;
    albums[i] = { ...cur, name, description };
    await safeStorage.setItem(KEYS.ALBUMS, JSON.stringify(albums));
  } catch (error) {
    console.error("Error updating album:", error);
  }
};

export const deleteAlbum = async (id: string): Promise<void> => {
  try {
    const albums = await getAlbums();
    const filtered = albums.filter(a => a.id !== id);
    await safeStorage.setItem(KEYS.ALBUMS, JSON.stringify(filtered));
    
    // Remove albumId from all photos in this album
    const photos = await getPhotos();
    const updatedPhotos = photos.map((p) =>
      p.albumId === id ? { ...p, albumId: undefined } : p,
    );
    await saveAllPhotos(updatedPhotos);
  } catch (error) {
    console.error('Error deleting album:', error);
  }
};

export const updateAlbumPhotoCount = async (albumId: string): Promise<void> => {
  try {
    const [albums, photos] = await Promise.all([getAlbums(), getPhotos()]);
    const album = albums.find(a => a.id === albumId);
    
    if (album) {
      const photoCount = photos.filter(p => p.albumId === albumId).length;
      const inAlbum = (p: Photo) => p.albumId === albumId;
      const firstStillInAlbum = photos.find((p) => inAlbum(p) && canUseAsAlbumCover(p.uri));

      // If album has a specific cover photo set, use that when it's a still image
      if (album.coverPhotoId) {
        const coverPhoto = photos.find(p => p.id === album.coverPhotoId);
        if (coverPhoto && inAlbum(coverPhoto) && canUseAsAlbumCover(coverPhoto.uri)) {
          album.coverPhotoUri = coverPhoto.uri;
        } else if (firstStillInAlbum) {
          album.coverPhotoId = firstStillInAlbum.id;
          album.coverPhotoUri = firstStillInAlbum.uri;
        } else {
          const anyInAlbum = photos.find(inAlbum);
          album.coverPhotoId = undefined;
          album.coverPhotoUri = anyInAlbum?.uri;
        }
      } else {
        // Prefer first still image; otherwise fall back to any item for thumbnails
        const firstPhoto = firstStillInAlbum ?? photos.find(inAlbum);
        album.coverPhotoUri = firstPhoto?.uri;
      }
      
      album.photoCount = photoCount;
      
      await saveAlbum(album);
    }
  } catch (error) {
    console.error('Error updating album photo count:', error);
  }
};

export const setAlbumCover = async (albumId: string, photoId: string): Promise<void> => {
  try {
    const albums = await getAlbums();
    const album = albums.find(a => a.id === albumId);
    
    if (album) {
      const photos = await getPhotos();
      const photo = photos.find(p => p.id === photoId);
      
      if (photo && canUseAsAlbumCover(photo.uri)) {
        album.coverPhotoId = photoId;
        album.coverPhotoUri = photo.uri;
        await saveAlbum(album);
      }
    }
  } catch (error) {
    console.error('Error setting album cover:', error);
  }
};

export const movePhotoToAlbum = async (photoId: string, albumId: string | null): Promise<void> => {
  try {
    const photos = await getPhotos();
    const photo = photos.find(p => p.id === photoId);
    const oldAlbumId = photo?.albumId;
    
    const updatedPhotos = photos.map((p) =>
      p.id === photoId ? { ...p, albumId: albumId || undefined } : p,
    );
    await saveAllPhotos(updatedPhotos);
    
    // Update photo counts for affected albums
    if (oldAlbumId) {
      await updateAlbumPhotoCount(oldAlbumId);
    }
    if (albumId) {
      await updateAlbumPhotoCount(albumId);
    }
  } catch (error) {
    console.error('Error moving photo to album:', error);
  }
};

export const getAlbumPhotos = async (albumId: string): Promise<Photo[]> => {
  try {
    const photos = await getPhotos();
    return photos.filter(p => p.albumId === albumId);
  } catch (error) {
    console.error('Error getting album photos:', error);
    return [];
  }
};

// Reminders
export const getReminders = async (): Promise<Reminder[]> => {
  try {
    const data = await safeStorage.getItem(KEYS.REMINDERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting reminders:', error);
    return [];
  }
};

export const saveReminder = async (reminder: Reminder): Promise<void> => {
  try {
    const reminders = await getReminders();
    const existingIndex = reminders.findIndex(r => r.id === reminder.id);
    
    if (existingIndex >= 0) {
      reminders[existingIndex] = reminder;
    } else {
      reminders.push(reminder);
    }
    
    await safeStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error saving reminder:', error);
  }
};

export const deleteReminder = async (id: string): Promise<void> => {
  try {
    const reminders = await getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    await safeStorage.setItem(KEYS.REMINDERS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting reminder:', error);
  }
};

export const getRemindersForDate = async (date: string): Promise<Reminder[]> => {
  try {
    const reminders = await getReminders();
    return reminders.filter(r => r.date === date);
  } catch (error) {
    console.error('Error getting reminders for date:', error);
    return [];
  }
};

