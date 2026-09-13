import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension} from '../src/extension.js';
import type {CameraRenderer} from '../src/video-preview.js';

function scratch(runtime: Record<string, unknown> = {}) {
  return {
    vm: {runtime},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    translate: (message: string) => message
  };
}

function stream(deviceId: string) {
  const stop = vi.fn();
  return {
    getVideoTracks: () => [{getSettings: () => ({deviceId})}],
    getTracks: () => [{stop}]
  } as unknown as MediaStream & {stop: ReturnType<typeof vi.fn>};
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

function renderer() {
  const texture = {} as WebGLTexture;
  const gl = {
    TEXTURE_2D: 0x0de1,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    CLAMP_TO_EDGE: 0x812f,
    LINEAR: 0x2601,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    createTexture: vi.fn(() => texture),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D: vi.fn(),
    deleteTexture: vi.fn()
  } as unknown as WebGLRenderingContext;

  class Skin {
    public readonly id: number;
    public readonly rotationCenter = [0, 0];
    public private = false;

    public constructor(id: number) {
      this.id = id;
    }

    public get size(): readonly number[] {
      return [0, 0];
    }

    public dispose(): void {}
    public emitWasAltered(): void {}
    public getTexture(): WebGLTexture | null {
      return null;
    }
  }

  const skins: CameraRenderer['_allSkins'] = [];
  const getNativeSize = vi.fn<() => readonly [number, number]>(() => [480, 360]);
  const cameraRenderer = {
    gl,
    exports: {Skin},
    _nextSkinId: 0,
    _allSkins: skins,
    createDrawable: vi.fn(() => 10),
    destroyDrawable: vi.fn(),
    destroySkin: vi.fn((skinId: number) => {
      cameraRenderer._allSkins[skinId]?.dispose();
      delete cameraRenderer._allSkins[skinId];
    }),
    getNativeSize,
    markDrawableAsNoninteractive: vi.fn(),
    markSkinAsPrivate: vi.fn(),
    updateDrawablePosition: vi.fn(),
    updateDrawableScale: vi.fn(),
    updateDrawableSkinId: vi.fn(),
    updateDrawableVisible: vi.fn()
  } satisfies CameraRenderer;

  return {cameraRenderer, gl};
}

beforeEach(() => {
  vi.stubGlobal('Scratch', scratch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CameraSourceExtension', () => {
  it('registers a runtime capability', () => {
    const extension = new CameraSourceExtension();
    expect(Scratch.vm.runtime.ext_kubohiroyacamerasource).toBe(extension);
  });

  it('reports block metadata and inactive state', () => {
    const extension = new CameraSourceExtension();
    const info = extension.getInfo() as {name: string; blocks: Array<{text: string}>};
    expect(info.name).toBe('Camera Source');
    expect(info.blocks.map((block) => block.text)).toContain(
      'shared camera [CAMERA_ID] is running?'
    );
    expect(extension.isCameraRunning()).toBe(false);
    expect(extension.cameraDeviceIdReporter()).toBe('');
  });

  it('keeps separate named camera sessions and device constraints', async () => {
    const poseStream = stream('pose-device');
    const qrStream = stream('qr-device');
    const getUserMedia = vi.fn()
      .mockResolvedValueOnce(poseStream)
      .mockResolvedValueOnce(qrStream);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia,
        enumerateDevices: vi.fn()
      }
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();
    const pose = await extension.acquireCamera({cameraId: 'pose', deviceId: 'pose-device'});
    const qr = await extension.acquireCamera({cameraId: 'qr', deviceId: 'qr-device'});

    expect(getUserMedia).toHaveBeenNthCalledWith(1, {
      audio: false,
      video: {deviceId: {exact: 'pose-device'}}
    });
    expect(getUserMedia).toHaveBeenNthCalledWith(2, {
      audio: false,
      video: {deviceId: {exact: 'qr-device'}}
    });
    expect(extension.cameraDeviceIdReporter({CAMERA_ID: 'pose'})).toBe('pose-device');
    expect(extension.cameraDeviceIdReporter({CAMERA_ID: 'qr'})).toBe('qr-device');

    await pose.release();
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(false);
    expect(extension.isCameraRunning({CAMERA_ID: 'qr'})).toBe(true);
    await qr.release();
    expect(extension.isCameraRunning({CAMERA_ID: 'qr'})).toBe(false);
  });

  it('uploads preview frames directly from video and mirrors with drawable scale', async () => {
    const cameraStream = stream('preview-device');
    const sourceVideo = video();
    Object.assign(sourceVideo, {videoWidth: 1280, videoHeight: 720});
    let frameCallback: VideoFrameRequestCallback | undefined;
    const requestVideoFrameCallback = vi.fn((callback: VideoFrameRequestCallback) => {
      frameCallback = callback;
      return 12;
    });
    const cancelVideoFrameCallback = vi.fn();
    Object.assign(sourceVideo, {requestVideoFrameCallback, cancelVideoFrameCallback});
    const {cameraRenderer, gl} = renderer();
    const requestRedraw = vi.fn();
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => sourceVideo)});

    const extension = new CameraSourceExtension();
    const processingLease = await extension.acquireCamera();
    const lease = await extension.acquireCamera({preview: true, mirrored: true});
    const skin = cameraRenderer._allSkins[0];
    expect(skin).toBeDefined();
    expect(lease.getFrameSource().element).toBe(sourceVideo);
    expect(cameraRenderer.updateDrawableScale).toHaveBeenCalledWith(10, [-50, 50]);
    expect(cameraRenderer.markSkinAsPrivate).toHaveBeenCalledWith(0);
    expect(cameraRenderer.markDrawableAsNoninteractive).toHaveBeenCalledWith(10);

    skin?.getTexture([100, 100]);
    expect(gl.texImage2D).toHaveBeenCalledWith(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourceVideo
    );
    skin?.getTexture([100, 100]);
    expect(gl.texImage2D).toHaveBeenCalledTimes(1);

    Object.assign(sourceVideo, {currentTime: 1});
    cameraRenderer.getNativeSize.mockReturnValue([960, 360]);
    frameCallback?.(1, {} as VideoFrameCallbackMetadata);
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [-75, 75]);
    skin?.getTexture([100, 100]);
    expect(gl.texImage2D).toHaveBeenCalledTimes(2);
    expect(requestRedraw).toHaveBeenCalled();

    await lease.release();
    expect(cameraRenderer.destroyDrawable).toHaveBeenCalledWith(10, 'video');
    expect(cameraRenderer.destroySkin).toHaveBeenCalledWith(0);
    expect(cancelVideoFrameCallback).toHaveBeenCalledWith(12);
    expect(extension.isCameraRunning()).toBe(true);
    await processingLease.release();
  });

  it('keeps an opt-in preview until its last preview lease is released', async () => {
    const cameraStream = stream('preview-device');
    const sourceVideo = video();
    const {cameraRenderer} = renderer();
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw: vi.fn()}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => sourceVideo)});

    const extension = new CameraSourceExtension();
    const previewLease = await extension.acquireCamera({preview: true, mirrored: true});
    const sharedPreviewLease = await extension.acquireCamera({preview: true});
    const processingLease = await extension.acquireCamera();

    expect(cameraRenderer.updateDrawableScale).toHaveBeenCalledWith(10, [-75, 75]);
    await previewLease.release();
    expect(cameraRenderer.destroyDrawable).not.toHaveBeenCalled();
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [75, 75]);
    await sharedPreviewLease.release();
    expect(cameraRenderer.destroyDrawable).toHaveBeenCalledTimes(1);
    expect(extension.isCameraRunning()).toBe(true);
    await processingLease.release();
    expect(extension.isCameraRunning()).toBe(false);
  });

  it('does not require a renderer when preview is disabled', async () => {
    const cameraStream = stream('processing-device');
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();
    const lease = await extension.acquireCamera();

    expect(lease.getFrameSource().deviceId).toBe('processing-device');
    await lease.release();
  });

  it('fails preview acquisition clearly when the renderer is unavailable', async () => {
    const cameraStream = stream('preview-device');
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();

    await expect(extension.acquireCamera({preview: true})).rejects.toThrow(
      'Camera preview requires a compatible TurboWarp renderer.'
    );
    expect(extension.isCameraRunning()).toBe(false);
  });

  it('cleans up a partially created preview when renderer setup fails', async () => {
    const cameraStream = stream('preview-device');
    const {cameraRenderer} = renderer();
    cameraRenderer.updateDrawablePosition.mockImplementation(() => {
      throw new Error('renderer setup failed');
    });
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw: vi.fn()}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();

    await expect(extension.acquireCamera({preview: true})).rejects.toThrow('renderer setup failed');
    expect(cameraRenderer.destroyDrawable).toHaveBeenCalledWith(10, 'video');
    expect(cameraRenderer.destroySkin).toHaveBeenCalledWith(0);
    expect(extension.isCameraRunning()).toBe(false);
  });

  it('refreshes and reports camera devices by one-based index', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(async () => [
          {kind: 'audioinput', deviceId: 'mic', label: 'Microphone'},
          {kind: 'videoinput', deviceId: 'pose-device', label: 'Pose Camera'},
          {kind: 'videoinput', deviceId: 'qr-device', label: 'QR Camera'}
        ])
      }
    });
    const extension = new CameraSourceExtension();

    await extension.refreshCameraDevices();

    expect(extension.cameraDeviceCount()).toBe(2);
    expect(extension.cameraDeviceIdAt({INDEX: '2'})).toBe('qr-device');
    expect(extension.cameraDeviceLabelAt({INDEX: '1'})).toBe('Pose Camera');
  });
});
