import { IPTVChannel, PlaylistInfo } from "@/types/iptv";

const DB_NAME = "iptv_indexed_db";
const DB_VERSION = 1;
const CHANNELS_STORE = "custom_channels";
const PLAYLISTS_STORE = "custom_playlists";
const PREFS_STORE = "preferences";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CHANNELS_STORE)) {
        db.createObjectStore(CHANNELS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
        db.createObjectStore(PLAYLISTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PREFS_STORE)) {
        db.createObjectStore(PREFS_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves channels in IndexedDB in bulk
 */
export async function saveChannelsToIndexedDB(channels: IPTVChannel[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(CHANNELS_STORE, "readwrite");
      const store = tx.objectStore(CHANNELS_STORE);
      store.clear(); // Fresh replace of custom channels
      for (const ch of channels) {
        store.put(ch);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn("[IndexedDB] Falling back from channel save:", err);
    return false;
  }
}

/**
 * Retrieves all stored custom channels from IndexedDB
 */
export async function getChannelsFromIndexedDB(): Promise<IPTVChannel[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(CHANNELS_STORE, "readonly");
      const store = tx.objectStore(CHANNELS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn("[IndexedDB] Falling back from channel read:", err);
    return [];
  }
}

/**
 * Saves custom playlist definitions in IndexedDB
 */
export async function savePlaylistsToIndexedDB(playlists: PlaylistInfo[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(PLAYLISTS_STORE, "readwrite");
      const store = tx.objectStore(PLAYLISTS_STORE);
      store.clear();
      for (const p of playlists) {
        store.put(p);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn("[IndexedDB] Falling back from playlist save:", err);
    return false;
  }
}

/**
 * Retrieves all custom playlists from IndexedDB
 */
export async function getPlaylistsFromIndexedDB(): Promise<PlaylistInfo[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(PLAYLISTS_STORE, "readonly");
      const store = tx.objectStore(PLAYLISTS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn("[IndexedDB] Falling back from playlist read:", err);
    return [];
  }
}

/**
 * Saves an arbitrary preference key-value pair in IndexedDB
 */
export async function savePreferenceToIndexedDB<T = unknown>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(PREFS_STORE, "readwrite");
      const store = tx.objectStore(PREFS_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falling back from pref save (${key}):`, err);
    return false;
  }
}

/**
 * Retrieves a preference value by key from IndexedDB
 */
export async function getPreferenceFromIndexedDB<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(PREFS_STORE, "readonly");
      const store = tx.objectStore(PREFS_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? (req.result as T) : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falling back from pref read (${key}):`, err);
    return null;
  }
}

/**
 * Snapshot Metadata cached in IndexedDB
 */
export interface SnapshotMetadata {
  lastUpdated: number;
  version: number;
  totalChannels: number;
  verifiedLiveCount?: number;
  offlineCount?: number;
  verifiedLiveChannelIds?: string[];
  offlineChannelIds?: string[];
}

const SNAPSHOT_META_KEY = "iptv_snapshot_metadata_v1";

/**
 * Saves snapshot metadata to IndexedDB
 */
export async function saveSnapshotMetaToIndexedDB(meta: SnapshotMetadata): Promise<boolean> {
  return savePreferenceToIndexedDB<SnapshotMetadata>(SNAPSHOT_META_KEY, meta);
}

/**
 * Retrieves cached snapshot metadata from IndexedDB
 */
export async function getSnapshotMetaFromIndexedDB(): Promise<SnapshotMetadata | null> {
  return getPreferenceFromIndexedDB<SnapshotMetadata>(SNAPSHOT_META_KEY);
}

