import {readFileSync} from 'node:fs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension, requestedCamera} from '../src/extension.js';
import {
  cameraProfileChannelName,
  createIndexedDbCameraProfileStore,
  type CameraProfileStore,
  type StoredCameraProfile
} from '../src/calibration/store.js';

function scratch(runtime: Record<string, unknown> = {}) {
  return {
    vm: {runtime},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    Cast: {
      toString: (value: unknown) => String(value ?? ''),
      toNumber: (value: unknown) => Number(value),
      toBoolean: (value: unknown) => value !== false
    },
    translate: (message: string) => message
  };
}

/** Channels in one test share a bus, the way windows on one origin do. */
class FakeBroadcastChannel {
  public static readonly open = new Set<FakeBroadcastChannel>();
  public onmessage: ((event: {data: unknown}) => void) | null = null;
  public readonly posted: unknown[] = [];
  public closed = false;

  public constructor(public readonly name: string) {
    FakeBroadcastChannel.open.add(this);
  }

  public postMessage(data: unknown): void {
    this.posted.push(data);
    // A channel does not hear its own messages.
    for (const other of FakeBroadcastChannel.open) {
      if (other !== this && other.name === this.name) other.onmessage?.({data});
    }
  }

  public close(): void {
    this.closed = true;
    FakeBroadcastChannel.open.delete(this);
  }
}

function memoryStore(initial: StoredCameraProfile[] = []) {
  const records = new Map(initial.map((record) => [record.profileId, record]));
  let failing = false;
  const store: CameraProfileStore & {records: typeof records; fail(): void} = {
    records,
    fail: () => {
      failing = true;
    },
    list: async () => {
      if (failing) throw new Error('storage is gone');
      return [...records.values()];
    },
    put: async (record) => {
      if (failing) throw new Error('storage is gone');
      records.set(record.profileId, record);
    }
  };
  return store;
}

const minimal = JSON.parse(
  readFileSync(new URL('./fixtures/calibration/valid/minimal.json', import.meta.url), 'utf8')
) as Record<string, unknown>;

/**
 * A profile solved in the calibration app, where the only camera is called `default`.
 *
 * An empty capture block records that the device reported none of the optical controls, which the
 * fake track below also reports, so the only decisive question left is the frame size.
 */
function profile(
  profileId: string,
  calibratedAt: string,
  size: {width: number; height: number} = {width: 640, height: 480},
  extra: Record<string, unknown> = {capture: {}}
): Record<string, unknown> {
  return {
    ...minimal,
    profileId,
    cameraId: 'default',
    calibratedAt,
    image: {...size, undistorted: false},
    intrinsics: {fx: 500, fy: 500, cx: size.width / 2 - 0.5, cy: size.height / 2 - 0.5, skew: 0},
    ...extra
  };
}

function stored(document: Record<string, unknown>): StoredCameraProfile {
  return {
    profileId: String(document['profileId']),
    cameraId: String(document['cameraId']),
    calibratedAt: String(document['calibratedAt']),
    savedAt: '2026-09-17T00:00:00.000Z',
    document: JSON.stringify(document)
  };
}

/** A camera that has delivered a 640x480 frame and reports no optical controls. */
function runningCamera(deviceId = 'cam-1'): void {
  const track = {
    readyState: 'live',
    getSettings: () => ({deviceId}),
    stop: vi.fn(),
    addEventListener: vi.fn()
  };
  const stream = {active: true, getVideoTracks: () => [track], getTracks: () => [track]};
  const video = {videoWidth: 640, videoHeight: 480, play: vi.fn(async () => undefined)};
  vi.stubGlobal('navigator', {
    mediaDevices: {getUserMedia: vi.fn(async () => stream), enumerateDevices: vi.fn()}
  });
  vi.stubGlobal('document', {createElement: vi.fn(() => video)});
}

let runtime: Record<string, unknown>;

beforeEach(() => {
  runtime = {on: vi.fn()};
  vi.stubGlobal('Scratch', scratch(runtime));
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
});

afterEach(() => {
  FakeBroadcastChannel.open.clear();
  vi.unstubAllGlobals();
});

describe('registering a profile under another camera id', () => {
  it('rebinds the document to the camera the project names', () => {
    const extension = new CameraSourceExtension({profileStore: memoryStore()});
    extension.registerCameraProfileAs({
      PROFILE_JSON: JSON.stringify(profile('solved', '2026-09-16T00:00:00Z')),
      CAMERA_ID: 'pose'
    });
    expect(extension.cameraProfileError()).toBe('');
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'pose'})).toBe(true);
    // Rebound, not copied: the calibration app's name for the camera means nothing here.
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'default'})).toBe(false);
    expect(JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'pose'})).cameraId).toBe('pose');
  });

  it('validates the rebound document, so a bad id in the file does not matter', () => {
    const extension = new CameraSourceExtension({profileStore: memoryStore()});
    const document = {...profile('solved', '2026-09-16T00:00:00Z'), cameraId: ''};
    extension.registerCameraProfileAs({PROFILE_JSON: JSON.stringify(document), CAMERA_ID: 'pose'});
    expect(extension.cameraProfileError()).toBe('');
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'pose'})).toBe(true);
  });

  it('sets and clears the profile error like the plain register block', () => {
    const extension = new CameraSourceExtension({profileStore: memoryStore()});
    extension.registerCameraProfileAs({PROFILE_JSON: 'not json', CAMERA_ID: 'pose'});
    expect(extension.cameraProfileError()).toBe('not-an-object');
    const broken = profile('broken', '2026-09-16T00:00:00Z');
    (broken['intrinsics'] as Record<string, unknown>)['fx'] = 'wide';
    extension.registerCameraProfileAs({PROFILE_JSON: JSON.stringify(broken), CAMERA_ID: 'pose'});
    expect(extension.cameraProfileError()).toBe('invalid-type');
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'pose'})).toBe(false);
    extension.registerCameraProfileAs({
      PROFILE_JSON: JSON.stringify(profile('solved', '2026-09-16T00:00:00Z')),
      CAMERA_ID: 'pose'
    });
    expect(extension.cameraProfileError()).toBe('');
  });
});

describe('saving a profile to browser storage', () => {
  it('reports no-profile when nothing is registered for the camera', async () => {
    const store = memoryStore();
    const extension = new CameraSourceExtension({profileStore: store});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'default'})).toBe('');
    await extension.saveCameraProfile({CAMERA_ID: 'default'});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'default'})).toBe('no-profile');
    expect(extension.storedCameraProfileDetail({CAMERA_ID: 'default'})).toBe('');
    expect(store.records.size).toBe(0);
    expect(extension.storedCameraProfilesGeneration()).toBe(0);
  });

  it('writes the registered profile and says which one it wrote', async () => {
    const store = memoryStore();
    const extension = new CameraSourceExtension({profileStore: store});
    const document = profile('solved', '2026-09-16T01:02:03Z', undefined, {
      capture: {},
      device: {label: 'USB Camera'}
    });
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(document)});
    await extension.saveCameraProfile({CAMERA_ID: 'default'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'default'})).toBe('saved');
    const detail = extension.storedCameraProfileDetail({CAMERA_ID: 'default'});
    expect(detail).toContain('solved');
    expect(detail).toContain('2026-09-16T01:02:03Z');
    expect(detail).toContain('USB Camera');
    const record = store.records.get('solved');
    expect(record).toMatchObject({
      profileId: 'solved',
      cameraId: 'default',
      calibratedAt: '2026-09-16T01:02:03Z',
      deviceLabel: 'USB Camera'
    });
    expect(Number.isNaN(Date.parse(record?.savedAt ?? ''))).toBe(false);
    expect(JSON.parse(record?.document ?? '')).toMatchObject({profileId: 'solved'});
  });

  it('reports unavailable when the store fails, and counts no save', async () => {
    const store = memoryStore();
    store.fail();
    const extension = new CameraSourceExtension({profileStore: store});
    extension.registerCameraProfile({
      PROFILE_JSON: JSON.stringify(profile('solved', '2026-09-16T00:00:00Z'))
    });
    await extension.saveCameraProfile({CAMERA_ID: 'default'});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'default'})).toBe('unavailable');
    expect(extension.storedCameraProfilesGeneration()).toBe(0);
  });
});

describe('restoring a stored profile', () => {
  it('registers the newest compatible profile, passing over a newer one that does not fit', async () => {
    runningCamera();
    const store = memoryStore([
      stored(profile('older-fits', '2026-09-01T00:00:00Z')),
      stored(profile('oldest-fits', '2026-08-01T00:00:00Z')),
      stored(profile('newest-wrong-size', '2026-09-10T00:00:00Z', {width: 1280, height: 720}))
    ]);
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.startSharedCamera({CAMERA_ID: 'pose'});

    await extension.restoreStoredCameraProfile({CAMERA_ID: 'pose'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'pose'})).toBe('restored');
    expect(extension.storedCameraProfileDetail({CAMERA_ID: 'pose'})).toContain('older-fits');
    const registered = JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'pose'}));
    expect(registered).toMatchObject({profileId: 'older-fits', cameraId: 'pose'});
    expect(extension.cameraProfileCompatibility({CAMERA_ID: 'pose'})).toBe('compatible');
  });

  it('never registers an undetermined profile', async () => {
    // Nothing is running, so no frame size can be compared and every candidate is undetermined.
    const store = memoryStore([stored(profile('solved', '2026-09-16T00:00:00Z'))]);
    const extension = new CameraSourceExtension({profileStore: store});

    await extension.restoreStoredCameraProfile({CAMERA_ID: 'pose'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'pose'})).toBe('undetermined');
    expect(extension.storedCameraProfileDetail({CAMERA_ID: 'pose'})).toContain('no frame');
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'pose'})).toBe(false);
  });

  it('leaves the existing registration alone when nothing stored is compatible', async () => {
    runningCamera();
    const store = memoryStore([
      stored(profile('wrong-size', '2026-09-16T00:00:00Z', {width: 1280, height: 720}))
    ]);
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.startSharedCamera({CAMERA_ID: 'pose'});
    extension.registerCameraProfileAs({
      PROFILE_JSON: JSON.stringify(profile('in-force', '2026-01-01T00:00:00Z')),
      CAMERA_ID: 'pose'
    });

    await extension.restoreStoredCameraProfile({CAMERA_ID: 'pose'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'pose'})).toBe('incompatible');
    expect(extension.storedCameraProfileDetail({CAMERA_ID: 'pose'})).toContain('1280x720');
    expect(JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'pose'})).profileId).toBe('in-force');
  });

  it('reports none when nothing is stored or nothing stored is a valid profile', async () => {
    const store = memoryStore();
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.restoreStoredCameraProfile({CAMERA_ID: 'pose'});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'pose'})).toBe('none');

    store.records.set('garbage', {...stored(profile('garbage', '2026-09-16T00:00:00Z')), document: '{'});
    await extension.restoreStoredCameraProfile({CAMERA_ID: 'pose'});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'pose'})).toBe('none');
    expect(extension.storedCameraProfileDetail({CAMERA_ID: 'pose'})).toBe('');
  });

  it('reports unavailable when the store fails', async () => {
    const store = memoryStore();
    store.fail();
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.restoreStoredCameraProfile({CAMERA_ID: 'pose'});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'pose'})).toBe('unavailable');
  });

  it('reports unavailable where the browser has no IndexedDB', async () => {
    // The default store, in an environment without `indexedDB`: blocks answer instead of throwing.
    vi.stubGlobal('indexedDB', undefined);
    const extension = new CameraSourceExtension();
    await extension.restoreStoredCameraProfile({CAMERA_ID: 'pose'});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'pose'})).toBe('unavailable');
    await expect(createIndexedDbCameraProfileStore(undefined).list()).rejects.toThrow();
  });
});

/** A profile solved on one particular device, as the calibration app records it. */
function onDevice(profileId: string, calibratedAt: string, deviceId: string): Record<string, unknown> {
  return profile(profileId, calibratedAt, undefined, {capture: {}, device: {label: 'USB Camera', deviceId}});
}

describe('restoring a stored profile for the camera\'s device', () => {
  it('passes over a newer compatible profile from another camera of the same model', async () => {
    runningCamera('device-b');
    const store = memoryStore([
      stored(onDevice('camera-a', '2026-09-17T00:00:00Z', 'device-a')),
      stored(onDevice('camera-b', '2026-09-16T00:00:00Z', 'device-b'))
    ]);
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.startSharedCamera({CAMERA_ID: 'cam-2'});

    // The unscoped restore cannot tell them apart and takes the newest.
    await extension.restoreStoredCameraProfile({CAMERA_ID: 'cam-2'});
    expect(JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'cam-2'})).profileId).toBe('camera-a');
    expect(extension.cameraProfileOnDevice({CAMERA_ID: 'cam-2'})).toBe(false);

    await extension.restoreStoredCameraProfileForDevice({CAMERA_ID: 'cam-2'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'cam-2'})).toBe('restored');
    expect(JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'cam-2'}))).toMatchObject({
      profileId: 'camera-b',
      cameraId: 'cam-2'
    });
    expect(extension.cameraProfileOnDevice({CAMERA_ID: 'cam-2'})).toBe(true);
  });

  it('reports none, counting the other devices, and keeps the registration', async () => {
    runningCamera('device-c');
    const store = memoryStore([
      stored(onDevice('camera-a', '2026-09-17T00:00:00Z', 'device-a')),
      stored(profile('no-device', '2026-09-16T00:00:00Z'))
    ]);
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.startSharedCamera({CAMERA_ID: 'cam-3'});
    extension.registerCameraProfileAs({
      PROFILE_JSON: JSON.stringify(onDevice('in-force', '2026-01-01T00:00:00Z', 'device-c')),
      CAMERA_ID: 'cam-3'
    });

    await extension.restoreStoredCameraProfileForDevice({CAMERA_ID: 'cam-3'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'cam-3'})).toBe('none');
    expect(extension.storedCameraProfileDetail({CAMERA_ID: 'cam-3'})).toContain('2 saved profile(s)');
    expect(JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'cam-3'})).profileId).toBe('in-force');
  });

  it('still fails closed on the camera\'s own profile when it no longer fits', async () => {
    runningCamera('device-a');
    const store = memoryStore([
      stored(
        profile('camera-a', '2026-09-17T00:00:00Z', {width: 1280, height: 720}, {
          capture: {},
          device: {deviceId: 'device-a'}
        })
      )
    ]);
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.startSharedCamera({CAMERA_ID: 'cam-1'});

    await extension.restoreStoredCameraProfileForDevice({CAMERA_ID: 'cam-1'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'cam-1'})).toBe('incompatible');
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'cam-1'})).toBe(false);
  });

  it('is undetermined while the camera is not running', async () => {
    const store = memoryStore([stored(onDevice('camera-a', '2026-09-17T00:00:00Z', 'device-a'))]);
    const extension = new CameraSourceExtension({profileStore: store});

    await extension.restoreStoredCameraProfileForDevice({CAMERA_ID: 'cam-1'});

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'cam-1'})).toBe('undetermined');
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'cam-1'})).toBe(false);
  });
});

describe('binding a profile to the camera\'s device', () => {
  it('records the device in a compatible profile, so a save can be restored for that device', async () => {
    runningCamera('device-b');
    const store = memoryStore();
    const extension = new CameraSourceExtension({profileStore: store});
    await extension.startSharedCamera({CAMERA_ID: 'cam-2'});
    // Solved in another browser, whose device id means nothing here.
    extension.registerCameraProfileAs({
      PROFILE_JSON: JSON.stringify(onDevice('from-file', '2026-09-10T00:00:00Z', 'elsewhere')),
      CAMERA_ID: 'cam-2'
    });
    expect(extension.cameraProfileOnDevice({CAMERA_ID: 'cam-2'})).toBe(false);

    extension.bindCameraProfileToDevice({CAMERA_ID: 'cam-2'});

    expect(extension.cameraProfileOnDevice({CAMERA_ID: 'cam-2'})).toBe(true);
    expect(JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'cam-2'})).device).toEqual({
      label: 'USB Camera',
      deviceId: 'device-b'
    });
    await extension.saveCameraProfile({CAMERA_ID: 'cam-2'});
    extension.forgetCameraProfile({CAMERA_ID: 'cam-2'});
    await extension.restoreStoredCameraProfileForDevice({CAMERA_ID: 'cam-2'});
    expect(extension.storedCameraProfileResult({CAMERA_ID: 'cam-2'})).toBe('restored');
  });

  it('leaves a profile that does not fit the camera unbound', async () => {
    runningCamera('device-b');
    const extension = new CameraSourceExtension({profileStore: memoryStore()});
    await extension.startSharedCamera({CAMERA_ID: 'cam-2'});
    extension.registerCameraProfileAs({
      PROFILE_JSON: JSON.stringify(profile('wrong-size', '2026-09-10T00:00:00Z', {width: 1280, height: 720})),
      CAMERA_ID: 'cam-2'
    });

    extension.bindCameraProfileToDevice({CAMERA_ID: 'cam-2'});

    expect(extension.cameraProfileOnDevice({CAMERA_ID: 'cam-2'})).toBe(false);
    expect(JSON.parse(extension.cameraProfileJson({CAMERA_ID: 'cam-2'})).device).toBeUndefined();
  });

  it('does nothing without a registered profile or a running camera', () => {
    const extension = new CameraSourceExtension({profileStore: memoryStore()});
    extension.bindCameraProfileToDevice({CAMERA_ID: 'cam-2'});
    extension.registerCameraProfileAs({
      PROFILE_JSON: JSON.stringify(profile('solved', '2026-09-10T00:00:00Z')),
      CAMERA_ID: 'cam-2'
    });
    extension.bindCameraProfileToDevice({CAMERA_ID: 'cam-2'});
    expect(extension.cameraProfileOnDevice({CAMERA_ID: 'cam-2'})).toBe(false);
  });
});

describe('the camera requested by the page', () => {
  it('names the device exactly and the size and rate as ideal', () => {
    expect(requestedCamera('?token=abc&cameraDeviceId=device-b&cameraWidth=1280&cameraHeight=720&cameraFrameRate=30')).toEqual({
      deviceId: 'device-b',
      video: {
        deviceId: {exact: 'device-b'},
        width: {ideal: 1280},
        height: {ideal: 720},
        frameRate: {ideal: 30}
      }
    });
  });

  it('asks for nothing it was not given, and ignores a size that is not a positive number', () => {
    expect(requestedCamera('')).toEqual({});
    expect(requestedCamera('?cameraWidth=wide&cameraHeight=0')).toEqual({});
    expect(requestedCamera('?cameraWidth=640')).toEqual({video: {width: {ideal: 640}}});
  });

  it('starts the camera with those constraints', async () => {
    runningCamera('device-b');
    vi.stubGlobal('location', {search: '?cameraDeviceId=device-b&cameraWidth=640&cameraHeight=480'});
    const extension = new CameraSourceExtension({profileStore: memoryStore()});

    await extension.startRequestedSharedCamera({CAMERA_ID: 'default'});

    const getUserMedia = (globalThis.navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mock.calls;
    expect(getUserMedia[0]?.[0]).toEqual({
      audio: false,
      video: {deviceId: {exact: 'device-b'}, width: {ideal: 640}, height: {ideal: 480}}
    });
    expect(extension.cameraDeviceIdReporter({CAMERA_ID: 'default'})).toBe('device-b');
  });
});

describe('the stored profiles generation', () => {
  it('moves on a save here and on a save announced by another window', async () => {
    const store = memoryStore();
    const calibration = new CameraSourceExtension({profileStore: store});
    const camera = new CameraSourceExtension({profileStore: store});
    expect(camera.storedCameraProfilesGeneration()).toBe(0);

    calibration.registerCameraProfile({
      PROFILE_JSON: JSON.stringify(profile('solved', '2026-09-16T00:00:00Z'))
    });
    await calibration.saveCameraProfile({CAMERA_ID: 'default'});

    expect(calibration.storedCameraProfilesGeneration()).toBe(1);
    expect(camera.storedCameraProfilesGeneration()).toBe(1);
    const channel = [...FakeBroadcastChannel.open].find((entry) => entry.posted.length > 0);
    expect(channel?.name).toBe(cameraProfileChannelName);
    expect(channel?.posted).toEqual([{profileId: 'solved'}]);
  });

  it('survives a project boundary that clears the result', async () => {
    const extension = new CameraSourceExtension({profileStore: memoryStore()});
    extension.registerCameraProfile({
      PROFILE_JSON: JSON.stringify(profile('solved', '2026-09-16T00:00:00Z'))
    });
    await extension.saveCameraProfile({CAMERA_ID: 'default'});

    const listeners = (runtime['on'] as ReturnType<typeof vi.fn>).mock.calls;
    const boundary = listeners.find(([event]) => event === 'PROJECT_LOADED')?.[1] as () => void;
    boundary();

    expect(extension.storedCameraProfileResult({CAMERA_ID: 'default'})).toBe('');
    expect(extension.storedCameraProfilesGeneration()).toBe(1);
  });

  it('stops listening once disposed', () => {
    const extension = new CameraSourceExtension({profileStore: memoryStore()});
    const [channel] = [...FakeBroadcastChannel.open];
    extension.dispose();
    expect(channel?.closed).toBe(true);
  });
});
