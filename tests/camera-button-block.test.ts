import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension} from '../src/extension.js';

/** A stand-in for `<usermedia>`: it records what the block put in it and fires what a browser would. */
function userMediaElement() {
  const listeners = new Map<string, EventListener>();
  const element = {
    style: {} as Record<string, string>,
    children: [] as unknown[],
    stream: null as MediaStream | null,
    constraints: undefined as unknown,
    removed: false,
    setConstraints(constraints: unknown) {
      element.constraints = constraints;
    },
    append(child: unknown) {
      element.children.push(child);
    },
    remove() {
      element.removed = true;
    },
    addEventListener(type: string, listener: EventListener) {
      listeners.set(type, listener);
    },
    emit(type: string, event: Event = new Event(type)) {
      listeners.get(type)?.(event);
    },
    has: (type: string) => listeners.has(type)
  };
  return element;
}

function stream() {
  const stop = vi.fn();
  const track = {
    readyState: 'live' as MediaStreamTrackState,
    getSettings: () => ({deviceId: 'button-camera'}),
    stop,
    addEventListener: vi.fn()
  } as unknown as MediaStreamTrack;
  return {
    active: true,
    getVideoTracks: () => [track],
    getTracks: () => [track],
    stopped: stop
  } as unknown as MediaStream & {stopped: ReturnType<typeof vi.fn>};
}

function video() {
  return {
    muted: false,
    playsInline: false,
    srcObject: null,
    videoWidth: 640,
    videoHeight: 480,
    readyState: 2,
    currentTime: 0,
    play: vi.fn(async () => undefined)
  } as unknown as HTMLVideoElement;
}

/** A stage canvas inside a positioned parent, which is where the button belongs. */
function stageRuntime() {
  const parent = {style: {position: 'relative'} as Record<string, string>, appended: [] as unknown[]} as unknown as Element & {
    appended: unknown[];
    style: Record<string, string>;
  };
  (parent as unknown as {append: (child: unknown) => void}).append = (child: unknown) => {
    (parent as unknown as {appended: unknown[]}).appended.push(child);
  };
  return {runtime: {renderer: {gl: {canvas: {parentElement: parent}}}}, parent};
}

function scratch(runtime: Record<string, unknown>) {
  return {
    vm: {runtime},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    Cast: {
      toString: (value: unknown) => String(value ?? ''),
      toNumber: (value: unknown) => Number(value),
      toBoolean: (value: unknown) => value !== false && value !== 'false' && value !== 0
    },
    translate: (message: string) => message
  };
}

function install({supported = true}: {supported?: boolean} = {}) {
  const element = userMediaElement();
  const stage = stageRuntime();
  const getUserMedia = vi.fn(async () => stream());
  vi.stubGlobal('Scratch', scratch(stage.runtime));
  vi.stubGlobal('navigator', {mediaDevices: {getUserMedia, enumerateDevices: vi.fn()}});
  vi.stubGlobal('document', {
    createElement: vi.fn((tag: string) => {
      if (tag === 'usermedia') return element;
      if (tag === 'button') return {type: '', textContent: ''};
      return video();
    })
  });
  // Detection is `'HTMLUserMediaElement' in globalThis`, so a browser without it has no key at
  // all -- stubbing the name to undefined would still look supported.
  if (supported) vi.stubGlobal('HTMLUserMediaElement', class {});
  else delete (globalThis as Record<string, unknown>).HTMLUserMediaElement;
  return {element, stage, getUserMedia};
}

beforeEach(() => {
  install();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the browser's camera button", () => {
  it('declares the blocks that place it', () => {
    const extension = new CameraSourceExtension();
    const info = extension.getInfo() as {blocks: Array<{text: string; opcode: string}>};
    expect(info.blocks.map((block) => block.text)).toEqual(
      expect.arrayContaining([
        "start shared camera [CAMERA_ID] from the browser's camera button",
        'hide the camera button for shared camera [CAMERA_ID]',
        "browser's camera button available?"
      ])
    );
  });

  it('reports whether this browser has the element', () => {
    expect(new CameraSourceExtension().cameraButtonAvailable()).toBe(true);
    install({supported: false});
    expect(new CameraSourceExtension().cameraButtonAvailable()).toBe(false);
  });

  // The whole point of the element: the stream arrives without the extension calling getUserMedia,
  // so the browser owns the prompt and the project never sees a permission dialog of ours.
  it('shares the stream the element returns without calling getUserMedia', async () => {
    const {element, stage, getUserMedia} = install();
    const extension = new CameraSourceExtension();
    const started = extension.startSharedCameraFromCameraButton({CAMERA_ID: 'pose'});
    await Promise.resolve();

    expect((stage.parent as unknown as {appended: unknown[]}).appended).toEqual([element]);
    expect(element.children).toHaveLength(1);
    expect(element.constraints).toEqual({video: {}});

    const shared = stream();
    element.stream = shared;
    element.emit('stream');
    await started;

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(true);
    expect(extension.cameraErrorCode({CAMERA_ID: 'pose'})).toBe('');
    expect(element.removed).toBe(true);
    // #40's contract: an adopted stream's tracks are the caller's to stop, never Camera Source's.
    extension.stopSharedCamera({CAMERA_ID: 'pose'});
    expect(shared.stopped).not.toHaveBeenCalled();
  });

  it('lets the work continue when the operator refuses', async () => {
    const {element, getUserMedia} = install();
    const extension = new CameraSourceExtension();
    const started = extension.startSharedCameraFromCameraButton({CAMERA_ID: 'pose'});
    await Promise.resolve();
    element.emit('cancel');
    await started;

    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(false);
    expect(extension.cameraErrorCode({CAMERA_ID: 'pose'})).toBe('usermedia-cancelled');
    expect(element.removed).toBe(true);
    // The ordinary route is still open, which is what keeps a refusal from ending the work.
    await extension.startSharedCamera({CAMERA_ID: 'pose'});
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(true);
  });

  it('reports what the element failed with', async () => {
    const {element} = install();
    const extension = new CameraSourceExtension();
    const started = extension.startSharedCameraFromCameraButton();
    await Promise.resolve();
    const event = new Event('error') as Event & {error?: unknown};
    event.error = {name: 'NotReadableError', message: 'The camera is in use.'};
    element.emit('error', event);
    await started;

    expect(extension.cameraErrorCode()).toBe('NotReadableError');
    expect(extension.cameraError()).toBe('The camera is in use.');
  });

  it('says so instead of placing anything when the browser has no element', async () => {
    const {element, stage} = install({supported: false});
    const extension = new CameraSourceExtension();
    await extension.startSharedCameraFromCameraButton();

    expect((stage.parent as unknown as {appended: unknown[]}).appended).toEqual([]);
    expect(element.has('stream')).toBe(false);
    expect(extension.cameraErrorCode()).toBe('usermedia-unsupported');
    expect(extension.isCameraRunning()).toBe(false);
  });

  // A packaged work's host adopts the stream before the project starts. The same block in the same
  // project then has nothing to ask for, and asking would only be refused.
  it('joins a stream the host already adopted instead of asking again', async () => {
    const {element, stage} = install();
    const extension = new CameraSourceExtension();
    const hosted = stream();
    await extension.adoptCamera({owner: 'host', cameraId: 'pose', stream: hosted});

    await extension.startSharedCameraFromCameraButton({CAMERA_ID: 'pose'});

    expect((stage.parent as unknown as {appended: unknown[]}).appended).toEqual([]);
    expect(element.has('stream')).toBe(false);
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(true);
    expect(extension.cameraErrorCode({CAMERA_ID: 'pose'})).toBe('');
  });

  it('hides a button that is still waiting', async () => {
    const {element} = install();
    const extension = new CameraSourceExtension();
    const started = extension.startSharedCameraFromCameraButton();
    await Promise.resolve();

    extension.hideCameraButton();
    await started;

    expect(element.removed).toBe(true);
    expect(extension.cameraErrorCode()).toBe('usermedia-cancelled');
  });

  it('takes a waiting button away with the stop sign', async () => {
    const {element} = install();
    const extension = new CameraSourceExtension();
    const started = extension.startSharedCameraFromCameraButton();
    await Promise.resolve();

    extension.stopAllCameras();
    await started;

    expect(element.removed).toBe(true);
  });
});


it('registers the native permission element with a capable Editor instead of placing it on the stage', async () => {
  const {element, stage, getUserMedia} = install();
  const dispose = vi.fn();
  const registerProvider = vi.fn(() => ({dispose, update: vi.fn()}));
  (Scratch as unknown as {gui: unknown}).gui = {cameraControls: {registerProvider}};
  const extension = new CameraSourceExtension();
  const started = extension.startSharedCameraFromCameraButton({CAMERA_ID: 'pose'});
  expect(registerProvider).toHaveBeenCalledWith(expect.objectContaining({cameraId: 'pose', kind: 'permission', element}));
  expect(stage.parent.appended).toEqual([]);
  element.emit('cancel');
  await started;
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(getUserMedia).not.toHaveBeenCalled();
  extension.dispose();
});
