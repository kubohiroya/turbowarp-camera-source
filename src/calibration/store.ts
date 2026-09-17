/**
 * Profiles kept in the browser between sessions.
 *
 * A cache, not a backup. IndexedDB belongs to one origin in one browser profile, and the browser may
 * evict it; the exported file stays the thing an operator keeps. What this buys is the common case:
 * the calibration app and the app that uses its result are served from the same origin, so a solve
 * saved in one window can be picked up by the other without a file changing hands.
 *
 * The store holds documents and says nothing about whether one fits a camera. That is decided when
 * a profile is restored, against the camera as it is then, by the same validation and compatibility
 * rules every other way in goes through.
 */

export const cameraProfileDatabaseName = 'kubohiroya-camera-source';
export const cameraProfileDatabaseVersion = 1;
export const cameraProfileObjectStoreName = 'camera-profiles';
/** Other windows on the same origin hear about a save here. The message is `{profileId}`. */
export const cameraProfileChannelName = 'kubohiroya-camera-source:camera-profiles';

export interface StoredCameraProfile {
  /** The key. Saving a profile again under the same id replaces the earlier record. */
  readonly profileId: string;
  /** The camera id the document carried when it was saved. A restore rebinds it. */
  readonly cameraId: string;
  readonly calibratedAt: string;
  /** When the record was written, as an ISO 8601 timestamp. */
  readonly savedAt: string;
  readonly deviceLabel?: string;
  /** The profile as `serializeCameraIntrinsicProfile` renders it. Validated again on the way out. */
  readonly document: string;
}

/**
 * Where saved profiles live.
 *
 * Either method rejects when the storage cannot be used. The caller turns that into an answer rather
 * than letting it reach a block, so an unusable store behaves like an empty one that says why.
 */
export interface CameraProfileStore {
  list(): Promise<StoredCameraProfile[]>;
  put(record: StoredCameraProfile): Promise<void>;
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Whether a value read back has the shape of a record.
 *
 * The database outlives this build. Anything another version, or a developer console, left behind is
 * skipped here rather than handed on as if this build had written it.
 */
export function isStoredCameraProfile(value: unknown): value is StoredCameraProfile {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isText(record['profileId']) &&
    isText(record['cameraId']) &&
    isText(record['calibratedAt']) &&
    isText(record['savedAt']) &&
    isText(record['document']) &&
    (record['deviceLabel'] === undefined || isText(record['deviceLabel']))
  );
}

function settle<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

/**
 * The IndexedDB store.
 *
 * The database is opened on first use, not on construction: every project that loads this extension
 * would otherwise create it, including the ones that never save a profile. A failed open is not
 * remembered, so a later call gets another attempt instead of inheriting one bad moment for good.
 */
export function createIndexedDbCameraProfileStore(
  factory: IDBFactory | undefined = globalThis.indexedDB
): CameraProfileStore {
  let opening: Promise<IDBDatabase> | undefined;

  const database = (): Promise<IDBDatabase> => {
    if (!factory) return Promise.reject(new Error('IndexedDB is not available.'));
    if (!opening) {
      const request = factory.open(cameraProfileDatabaseName, cameraProfileDatabaseVersion);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(cameraProfileObjectStoreName)) {
          request.result.createObjectStore(cameraProfileObjectStoreName, {keyPath: 'profileId'});
        }
      };
      opening = settle(request).then((db) => {
        // A later build that raises the version has to be able to upgrade while this window is open.
        db.onversionchange = () => {
          db.close();
          opening = undefined;
        };
        return db;
      });
      opening.catch(() => {
        opening = undefined;
      });
    }
    return opening;
  };

  return {
    async list() {
      const db = await database();
      const store = db
        .transaction(cameraProfileObjectStoreName, 'readonly')
        .objectStore(cameraProfileObjectStoreName);
      const records: unknown[] = await settle(store.getAll());
      return records.filter(isStoredCameraProfile);
    },
    async put(record) {
      const db = await database();
      const transaction = db.transaction(cameraProfileObjectStoreName, 'readwrite');
      transaction.objectStore(cameraProfileObjectStoreName).put(record);
      // Resolved on commit, not on the request: a put that succeeded inside a transaction that then
      // aborted was never saved, and reporting `saved` for it would send the other window looking.
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed.'));
        transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted.'));
      });
    }
  };
}
