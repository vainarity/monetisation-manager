import type { Session, SavedKey } from "./types";

const STORAGE_KEY = "roblox-manager-sessions";
const KEYS_STORAGE_KEY = "roblox-manager-saved-keys";

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function loadSensitiveEntries<T>(key: string): T[] {
  const current = readJson<T[]>(sessionStorage, key);
  if (current) return current;

  const legacy = readJson<T[]>(localStorage, key);
  if (legacy) {
    sessionStorage.setItem(key, JSON.stringify(legacy));
    localStorage.removeItem(key);
    return legacy;
  }

  return [];
}

export function getSessions(): Session[] {
  try {
    const sessions = loadSensitiveEntries<Session>(STORAGE_KEY);
    return sessions.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch {
    return [];
  }
}

export function saveSession(session: Omit<Session, "id" | "lastUsed">): Session {
  const sessions = getSessions();
  const existing = sessions.find(
    (s) => s.universeId === session.universeId && s.apiKey === session.apiKey
  );

  if (existing) {
    existing.experienceName = session.experienceName;
    existing.lastUsed = Date.now();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return existing;
  }

  const newSession: Session = {
    ...session,
    id: crypto.randomUUID(),
    lastUsed: Date.now(),
  };
  sessions.push(newSession);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return newSession;
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSavedKeys(): SavedKey[] {
  try {
    return loadSensitiveEntries<SavedKey>(KEYS_STORAGE_KEY);
  } catch {
    return [];
  }
}

export function addSavedKey(label: string, apiKey: string): SavedKey {
  const keys = getSavedKeys();
  const existing = keys.find((k) => k.apiKey === apiKey);
  if (existing) {
    existing.label = label;
    sessionStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
    return existing;
  }

  const newKey: SavedKey = { id: crypto.randomUUID(), label, apiKey };
  keys.push(newKey);
  sessionStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  return newKey;
}

export function deleteSavedKey(id: string): void {
  const keys = getSavedKeys().filter((k) => k.id !== id);
  sessionStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
}
