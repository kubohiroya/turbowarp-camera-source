import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {captureSnapshot} from '../src/snapshot.js';
import {CameraSourceExtension} from '../src/extension.js';

/** A canvas that records what was asked of it and encodes only the types it was told it can. */
function canvasClass(encodable: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']) {
  const made: FakeCanvas[] = [];
  class FakeCanvas {
    public width: number;
    public height: number;
    public readonly transforms: string[] = [];
    public drawn: {image: unknown; box: readonly number[]} | undefined;
    public encodedAs: {type?: string; quality?: number} | undefined;
    public constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      made.push(this);
    }
    public getContext(id: string) {
      if (id !== '2d') return null;
      return {
        save: () => this.transforms.push('save'),
        restore: () => this.transforms.push('restore'),
        translate: (x: number, y: number) => this.transforms.push(`translate(${x},${y})`),
        scale: (x: number, y: number) => this.transforms.push(`scale(${x},${y})`),
        drawImage: (image: unknown, ...box: number[]) => {
          this.drawn = {image, box};
          this.transforms.push('drawImage');
        }
      };
    }
    public async convertToBlob(options: {type?: string; quality?: number} = {}) {
      this.encodedAs = options;
      // What a browser does with a type it cannot encode: it gives back PNG rather than failing.
      const type = encodable.includes(options.type ?? '') ? options.type! : 'image/png';
      return new Blob([new Uint8Array([1, 2, 3, 4])], {type});
    }
  }
  return {FakeCanvas, made};
}

function sourceFrame(width = 640, height = 480, readyState = 2) {
  return {videoWidth: width, videoHeight: height, readyState};
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('capturing one still image', () => {
  it('encodes each type the browser can encode, and says so when it cannot', async () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp'] as const) {
      const {FakeCanvas} = canvasClass();
      vi.stubGlobal('OffscreenCanvas', FakeCanvas);
      const snapshot = await captureSnapshot(sourceFrame(), {type});
      expect(snapshot.type).toBe(type);
      expect(snapshot.bytes).toEqual(new Uint8Array([1, 2, 3, 4]));
    }

    const {FakeCanvas} = canvasClass(['image/jpeg', 'image/png']);
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    await expect(captureSnapshot(sourceFrame(), {type: 'image/webp'})).rejects.toThrow(
      'This browser encoded image/png rather than image/webp.'
    );
  });

  it('defaults to JPEG and reports the frame it drew', async () => {
    const {FakeCanvas, made} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    const before = Date.now();
    const snapshot = await captureSnapshot(sourceFrame(1280, 720));

    expect(snapshot.type).toBe('image/jpeg');
    expect(snapshot.width).toBe(1280);
    expect(snapshot.height).toBe(720);
    expect(snapshot.capturedAt).toBeGreaterThanOrEqual(before);
    expect(made).toHaveLength(1);
    expect(made[0]!.drawn?.box).toEqual([0, 0, 1280, 720]);
  });

  it('keeps the aspect ratio inside both bounds', async () => {
    const {FakeCanvas, made} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);

    const wide = await captureSnapshot(sourceFrame(1600, 1200), {maxWidth: 800});
    expect([wide.width, wide.height]).toEqual([800, 600]);

    const tall = await captureSnapshot(sourceFrame(1600, 1200), {maxHeight: 300});
    expect([tall.width, tall.height]).toEqual([400, 300]);

    // The tighter of the two bounds decides, so neither is exceeded.
    const both = await captureSnapshot(sourceFrame(1600, 1200), {maxWidth: 800, maxHeight: 300});
    expect([both.width, both.height]).toEqual([400, 300]);

    expect(made.at(-1)!.drawn?.box).toEqual([0, 0, 400, 300]);
  });

  it('does not enlarge a frame to fill the bounds it was given', async () => {
    const {FakeCanvas} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    const snapshot = await captureSnapshot(sourceFrame(320, 240), {maxWidth: 4000, maxHeight: 4000});
    expect([snapshot.width, snapshot.height]).toEqual([320, 240]);
  });

  it('captures the camera as it captured, and turns the image over only when asked', async () => {
    const {FakeCanvas, made} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);

    await captureSnapshot(sourceFrame(640, 480));
    expect(made[0]!.transforms).toEqual(['save', 'drawImage', 'restore']);

    await captureSnapshot(sourceFrame(640, 480), {flip: 'horizontal'});
    expect(made[1]!.transforms).toEqual(['save', 'translate(640,0)', 'scale(-1,1)', 'drawImage', 'restore']);

    await captureSnapshot(sourceFrame(640, 480), {flip: 'vertical'});
    expect(made[2]!.transforms).toEqual(['save', 'translate(0,480)', 'scale(1,-1)', 'drawImage', 'restore']);

    await captureSnapshot(sourceFrame(640, 480), {flip: 'both'});
    expect(made[3]!.transforms).toEqual(['save', 'translate(640,480)', 'scale(-1,-1)', 'drawImage', 'restore']);
  });

  it('clamps a quality out of range but refuses one that was never a quality', async () => {
    const {FakeCanvas, made} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);

    await captureSnapshot(sourceFrame(), {quality: 4});
    expect(made[0]!.encodedAs?.quality).toBe(1);
    await captureSnapshot(sourceFrame(), {quality: -1});
    expect(made[1]!.encodedAs?.quality).toBe(0);
    await captureSnapshot(sourceFrame(), {quality: 0.62});
    expect(made[2]!.encodedAs?.quality).toBe(0.62);
    await captureSnapshot(sourceFrame());
    expect(made[3]!.encodedAs).toEqual({type: 'image/jpeg'});

    await expect(captureSnapshot(sourceFrame(), {quality: Number.NaN})).rejects.toThrow(TypeError);
    await expect(
      captureSnapshot(sourceFrame(), {quality: '0.8' as unknown as number})
    ).rejects.toThrow(TypeError);
  });

  it('refuses options that cannot mean anything', async () => {
    const {FakeCanvas} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    await expect(
      captureSnapshot(sourceFrame(), {type: 'image/gif' as unknown as 'image/png'})
    ).rejects.toThrow('Camera snapshot type must be one of image/jpeg, image/png, image/webp.');
    await expect(captureSnapshot(sourceFrame(), {maxWidth: 0})).rejects.toThrow(
      'Camera snapshot maxWidth must be a positive finite number.'
    );
    await expect(captureSnapshot(sourceFrame(), {maxHeight: -10})).rejects.toThrow(
      'Camera snapshot maxHeight must be a positive finite number.'
    );
  });

  it('says what is wrong instead of encoding nothing', async () => {
    const {FakeCanvas, made} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    await expect(captureSnapshot(sourceFrame(640, 480, 0))).rejects.toThrow(
      'The shared camera has not presented a frame yet.'
    );
    await expect(captureSnapshot(sourceFrame(0, 0))).rejects.toThrow(
      'The shared camera is presenting frames of no size.'
    );
    expect(made).toHaveLength(0);
  });

  it('draws into a document canvas where there is no OffscreenCanvas', async () => {
    const {FakeCanvas, made} = canvasClass();
    vi.stubGlobal('OffscreenCanvas', undefined);
    delete (globalThis as Record<string, unknown>).OffscreenCanvas;
    vi.stubGlobal('document', {createElement: (tag: string) => (tag === 'canvas' ? new FakeCanvas(0, 0) : null)});
    const snapshot = await captureSnapshot(sourceFrame(800, 600));
    expect([snapshot.width, snapshot.height]).toEqual([800, 600]);
    expect(made[0]!.width).toBe(800);
  });
});

/** The lease side: capturing has to reuse the stream the lease already holds. */
function extensionFixture() {
  const stop = vi.fn();
  const track = {
    readyState: 'live' as MediaStreamTrackState,
    getSettings: () => ({deviceId: 'snapshot-camera'}),
    stop,
    addEventListener: vi.fn()
  } as unknown as MediaStreamTrack;
  const cameraStream = {
    active: true,
    getTracks: () => [track],
    getVideoTracks: () => [track]
  } as unknown as MediaStream;
  const videoElement = {
    muted: false,
    playsInline: false,
    srcObject: null as unknown,
    videoWidth: 640,
    videoHeight: 480,
    readyState: 2,
    currentTime: 0,
    play: vi.fn(async () => undefined)
  };
  const getUserMedia = vi.fn(async () => cameraStream);
  const {FakeCanvas, made} = canvasClass();
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  vi.stubGlobal('Scratch', {
    vm: {runtime: {}},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    Cast: {toString: String, toNumber: Number, toBoolean: Boolean},
    translate: (message: string) => message
  });
  vi.stubGlobal('navigator', {mediaDevices: {getUserMedia, enumerateDevices: vi.fn()}});
  vi.stubGlobal('document', {createElement: vi.fn(() => videoElement)});
  vi.stubGlobal('BroadcastChannel', undefined);
  return {getUserMedia, videoElement, made, stop};
}

describe('capturing through a lease', () => {
  let fixture: ReturnType<typeof extensionFixture>;

  beforeEach(() => {
    fixture = extensionFixture();
  });

  it('captures the stream the lease already holds without opening a second camera', async () => {
    const extension = new CameraSourceExtension();
    const lease = await extension.acquireCamera({owner: 'live-camera'});
    expect(fixture.getUserMedia).toHaveBeenCalledOnce();

    const snapshot = await lease.captureFrame!({type: 'image/png', maxWidth: 320});

    expect(fixture.getUserMedia).toHaveBeenCalledOnce();
    expect(snapshot.type).toBe('image/png');
    expect([snapshot.width, snapshot.height]).toEqual([320, 240]);
    // The element drawn is the session's own, which is the shared one the frame source hands out.
    expect(fixture.made[0]!.drawn?.image).toBe(lease.getFrameSource().element);

    await lease.release();
    extension.dispose();
  });

  it('a second lease on the same camera captures the same stream', async () => {
    const extension = new CameraSourceExtension();
    const first = await extension.acquireCamera({owner: 'publisher', cameraId: 'pose'});
    const second = await extension.acquireCamera({owner: 'qr', cameraId: 'pose'});
    expect(fixture.getUserMedia).toHaveBeenCalledOnce();

    await first.captureFrame!();
    await second.captureFrame!();
    expect(fixture.made).toHaveLength(2);
    expect(fixture.made[0]!.drawn?.image).toBe(fixture.made[1]!.drawn?.image);

    // Capturing changed nothing about ownership: the camera runs until the last lease goes.
    await first.release();
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(true);
    expect(fixture.stop).not.toHaveBeenCalled();
    await second.release();
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(false);
    expect(fixture.stop).toHaveBeenCalledOnce();
    extension.dispose();
  });

  it('refuses to capture through a released lease', async () => {
    const extension = new CameraSourceExtension();
    const lease = await extension.acquireCamera({owner: 'live-camera'});
    await lease.release();
    await expect(lease.captureFrame!()).rejects.toThrow('This camera lease has been released.');
    extension.dispose();
  });
});
