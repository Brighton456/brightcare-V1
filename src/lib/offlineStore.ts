/**
 * Brightcare — Offline Storage Engine
 * Uses IndexedDB for local persistence with sync queue
 */

const DB_NAME = 'brightech_smartcare';
const DB_VERSION = 1;

const STORES = [
  'patients', 'medicines', 'pharmacy_sales', 'pharmacy_sale_items',
  'consultations', 'prescriptions', 'prescription_items', 'lab_tests',
  'bills', 'bill_items', 'staff', 'appointments', 'admissions',
  'beds', 'wards', 'vitals_records', 'nursing_notes', 'notifications',
  'internal_messages', 'departments', 'dropdown_options', 'module_settings',
  'hospitals', 'license_packages', 'license_keys', 'activity_log',
  'sync_queue',
] as const;

type StoreName = typeof STORES[number];

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const store of STORES) {
        if (!database.objectStoreNames.contains(store)) {
          const s = database.createObjectStore(store, { keyPath: 'id' });
          if (store === 'sync_queue') {
            s.createIndex('status', 'status', { unique: false });
            s.createIndex('created_at', 'created_at', { unique: false });
          }
        }
      }
    };
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onerror = () => reject(request.error);
  });
}

export async function offlineGet<T = any>(store: StoreName, id: string): Promise<T | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function offlineGetAll<T = any>(store: StoreName): Promise<T[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function offlinePut<T extends { id: string }>(store: StoreName, data: T): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    tx.objectStore(store).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function offlineDelete(store: StoreName, id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function offlineBulkPut<T extends { id: string }>(store: StoreName, items: T[]): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const item of items) os.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Sync queue — records pending changes to push to cloud
interface SyncEntry {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  status: 'pending' | 'synced' | 'failed';
  created_at: string;
  attempts: number;
}

export async function queueSync(table: string, operation: SyncEntry['operation'], data: any): Promise<void> {
  const entry: SyncEntry = {
    id: crypto.randomUUID(),
    table,
    operation,
    data,
    status: 'pending',
    created_at: new Date().toISOString(),
    attempts: 0,
  };
  await offlinePut('sync_queue', entry);
}

export async function getPendingSyncs(): Promise<SyncEntry[]> {
  const all = await offlineGetAll<SyncEntry>('sync_queue');
  return all.filter(e => e.status === 'pending');
}

export async function markSynced(id: string): Promise<void> {
  const entry = await offlineGet<SyncEntry>('sync_queue', id);
  if (entry) {
    entry.status = 'synced';
    await offlinePut('sync_queue', entry);
  }
}

export async function markFailed(id: string): Promise<void> {
  const entry = await offlineGet<SyncEntry>('sync_queue', id);
  if (entry) {
    entry.attempts += 1;
    entry.status = entry.attempts >= 5 ? 'failed' : 'pending';
    await offlinePut('sync_queue', entry);
  }
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function isElectron(): boolean {
  return !!(window as any).electronAPI?.isElectron;
}

export async function clearStore(store: StoreName): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
