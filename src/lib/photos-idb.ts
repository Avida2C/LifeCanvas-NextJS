import type { Photo } from "@/types";

/** Legacy localStorage key — migrated once into IndexedDB, then removed. */
const LEGACY_LS_KEY = "@lifecanvas_photos";

const DB_NAME = "lifecanvas";
const DB_VERSION = 1;
const STORE = "kv";
const PHOTOS_KEY = "photos";

let dbPromise: Promise<IDBDatabase> | null = null;
let migrationPromise: Promise<void> | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

function readPhotosRaw(): Promise<Photo[]> {
  return getDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(PHOTOS_KEY);
        req.onsuccess = () => {
          const v = req.result as string | Photo[] | undefined;
          if (v == null) resolve([]);
          else if (typeof v === "string") {
            try {
              resolve(JSON.parse(v) as Photo[]);
            } catch {
              resolve([]);
            }
          } else resolve(v);
        };
        req.onerror = () => reject(req.error);
      }),
  );
}

function writePhotosRaw(photos: Photo[]): Promise<void> {
  return getDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE).put(JSON.stringify(photos), PHOTOS_KEY);
      }),
  );
}

/** One-time migration from localStorage → IndexedDB, then drop the legacy key. */
async function ensurePhotosMigrated(): Promise<void> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return;
  }
  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        const current = await readPhotosRaw();
        const legacy = window.localStorage.getItem(LEGACY_LS_KEY);
        if (current.length > 0) {
          if (legacy) window.localStorage.removeItem(LEGACY_LS_KEY);
          return;
        }
        if (legacy) {
          const parsed = JSON.parse(legacy) as Photo[];
          await writePhotosRaw(Array.isArray(parsed) ? parsed : []);
          window.localStorage.removeItem(LEGACY_LS_KEY);
        }
      } catch (e) {
        console.error("Photo storage migration:", e);
      }
    })();
  }
  await migrationPromise;
}

/** Load all photos (large capacity vs. localStorage ~5MB). */
export async function getAllPhotos(): Promise<Photo[]> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return [];
  }
  try {
    await ensurePhotosMigrated();
    return await readPhotosRaw();
  } catch (e) {
    console.error("Error reading photos from IndexedDB:", e);
    return [];
  }
}

/** Fired on window after any gallery save so UIs can reload without a full page refresh. */
export const PHOTOS_CHANGED_EVENT = "lifecanvas:photos-changed";

export function subscribePhotosChanged(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  let id: ReturnType<typeof setTimeout> | null = null;
  const handler = () => {
    if (id != null) clearTimeout(id);
    id = setTimeout(() => {
      id = null;
      onChange();
    }, 0);
  };
  window.addEventListener(PHOTOS_CHANGED_EVENT, handler);
  return () => {
    if (id != null) clearTimeout(id);
    window.removeEventListener(PHOTOS_CHANGED_EVENT, handler);
  };
}

/** Persist full list (same shape as previous JSON-in-localStorage). */
export async function saveAllPhotos(photos: Photo[]): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available");
  }
  await ensurePhotosMigrated();
  await writePhotosRaw(photos);
  window.dispatchEvent(new CustomEvent(PHOTOS_CHANGED_EVENT));
}
