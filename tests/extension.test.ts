import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension} from '../src/extension.js';
import type {CameraRenderer} from '../src/video-preview.js';

function scratch(runtime: Record<string, unknown> = {}) {
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

function stream(deviceId: string, settings: Partial<MediaTrackSettings> = {}) {
  const stop = vi.fn();
  let active = true;
  let readyState: MediaStreamTrackState = 'live';
  let endedListener: EventListener | null = null;
  const track = {
    get readyState() {
      return readyState;
    },
    getSettings: () => ({deviceId, ...settings}),
    stop,
    addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === 'ended' && typeof listener === 'function') endedListener = listener;
    })
  } as unknown as MediaStreamTrack;
  return {
    get active() {
      return active;
    },
    getVideoTracks: () => [track],
    getTracks: () => [track],
    stop,
    end: () => {
      active = false;
      readyState = 'ended';
      endedListener?.(new Event('ended'));
    }
  } as unknown as MediaStream & {stop: ReturnType<typeof vi.fn>; end: () => void};
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
    expect(extension.cameraErrorCode()).toBe('');
    expect(extension.cameraError()).toBe('');
    expect(extension.cameraDeviceIdReporter()).toBe('');
    expect(extension.cameraFrameWidth()).toBe(0);
    expect(extension.cameraFrameHeight()).toBe(0);
    expect(extension.cameraFrameRate()).toBe(0);
  });

  it('shows, updates, and hides one block-owned GPU preview lease', async () => {
    const cameraStream = stream('preview-device');
    const sourceVideo = video();
    const {cameraRenderer} = renderer();
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw: vi.fn()}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => sourceVideo)});

    const extension = new CameraSourceExtension();
    await extension.startSharedCamera({CAMERA_ID: 'pose'});
    await extension.showCameraPreview({CAMERA_ID: 'pose', PREVIEW_FLIP: 'horizontal'});
    await extension.showCameraPreview({CAMERA_ID: 'pose', PREVIEW_FLIP: 'horizontal'});

    expect(cameraRenderer.createDrawable).toHaveBeenCalledTimes(1);
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [-75, 75]);

    await extension.showCameraPreview({CAMERA_ID: 'pose', PREVIEW_FLIP: 'none'});
    expect(cameraRenderer.createDrawable).toHaveBeenCalledTimes(1);
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [75, 75]);

    await extension.hideCameraPreview({CAMERA_ID: 'pose'});
    await extension.hideCameraPreview({CAMERA_ID: 'pose'});
    expect(cameraRenderer.destroyDrawable).toHaveBeenCalledTimes(1);
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(true);

    extension.stopSharedCamera({CAMERA_ID: 'pose'});
    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(false);
  });

  it('lets a project choose any flip, including the ones a boolean could not say', async () => {
    const cameraStream = stream('preview-device');
    const sourceVideo = video();
    const {cameraRenderer} = renderer();
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw: vi.fn()}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => sourceVideo)});

    const extension = new CameraSourceExtension();
    await extension.startSharedCamera({CAMERA_ID: 'pose'});
    await extension.showCameraPreview({CAMERA_ID: 'pose', PREVIEW_FLIP: 'vertical'});
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [75, -75]);

    await extension.showCameraPreview({CAMERA_ID: 'pose', PREVIEW_FLIP: 'both'});
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [-75, -75]);

    await extension.showCameraPreview({CAMERA_ID: 'pose', PREVIEW_FLIP: 'none'});
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [75, 75]);
  });

  it('flips rather than not when asked for something outside the vocabulary', async () => {
    // The menu accepts reporters, so the value can be whatever a project computed. Drawing the
    // preview unflipped after a project asked for a flip would read as the camera being wrong.
    const cameraStream = stream('preview-device');
    const sourceVideo = video();
    const {cameraRenderer} = renderer();
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw: vi.fn()}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => sourceVideo)});

    const extension = new CameraSourceExtension();
    await extension.startSharedCamera({CAMERA_ID: 'pose'});
    await extension.showCameraPreview({CAMERA_ID: 'pose', PREVIEW_FLIP: 'sideways'});
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [-75, 75]);
  });

  it('keeps only the latest concurrently requested preview setting', async () => {
    const cameraStream = stream('preview-device');
    const {cameraRenderer} = renderer();
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw: vi.fn()}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();
    await Promise.all([
      extension.showCameraPreview({PREVIEW_FLIP: 'horizontal'}),
      extension.showCameraPreview({PREVIEW_FLIP: 'none'})
    ]);

    expect(cameraRenderer.createDrawable).toHaveBeenCalledTimes(1);
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [75, 75]);
    await extension.hideCameraPreview();
    expect(cameraRenderer.destroyDrawable).toHaveBeenCalledTimes(1);
  });

  it('stops a stream that resolves after project cleanup', async () => {
    let resolveStream: ((value: MediaStream) => void) | undefined;
    const cameraStream = stream('late-device');
    const getUserMedia = vi.fn(
      () => new Promise<MediaStream>((resolve) => {
        resolveStream = resolve;
      })
    );
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia, enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();
    const acquisition = extension.startSharedCamera();
    extension.stopAllCameras();
    resolveStream?.(cameraStream);

    await expect(acquisition).rejects.toThrow('Camera acquisition was cancelled.');
    expect(cameraStream.getTracks()[0]?.stop).toHaveBeenCalledTimes(1);
    expect(extension.isCameraRunning()).toBe(false);
  });

  it('stops the acquired stream when video playback fails', async () => {
    const cameraStream = stream('broken-device');
    const sourceVideo = video();
    sourceVideo.play = vi.fn(async () => {
      throw new Error('playback failed');
    });
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => sourceVideo)});

    const extension = new CameraSourceExtension();

    await expect(extension.startSharedCamera()).rejects.toThrow('playback failed');
    expect(cameraStream.getTracks()[0]?.stop).toHaveBeenCalledTimes(1);
    expect(sourceVideo.srcObject).toBeNull();
    expect(extension.isCameraRunning()).toBe(false);
    expect(extension.cameraErrorCode()).toBe('Error');
    expect(extension.cameraError()).toBe('playback failed');
  });

  it('retains a DOM camera failure by camera id and clears it after a successful retry', async () => {
    const denied = new DOMException('Permission denied', 'NotAllowedError');
    const getUserMedia = vi.fn()
      .mockRejectedValueOnce(denied)
      .mockResolvedValueOnce(stream('pose-device'));
    vi.stubGlobal('navigator', {mediaDevices: {getUserMedia, enumerateDevices: vi.fn()}});
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();

    await expect(extension.startSharedCamera({CAMERA_ID: 'pose'})).rejects.toBe(denied);
    expect(extension.cameraErrorCode({CAMERA_ID: 'pose'})).toBe('NotAllowedError');
    expect(extension.cameraError({CAMERA_ID: 'pose'})).toBe('Permission denied');
    expect(extension.cameraErrorCode({CAMERA_ID: 'other'})).toBe('');

    await extension.startSharedCamera({CAMERA_ID: 'pose'});
    expect(extension.cameraErrorCode({CAMERA_ID: 'pose'})).toBe('');
    expect(extension.cameraError({CAMERA_ID: 'pose'})).toBe('');
  });

  it('reports actual video dimensions and track frame rate', async () => {
    const cameraStream = stream('pose-device', {width: 1920, height: 1080, frameRate: 59.94});
    const sourceVideo = video();
    Object.assign(sourceVideo, {videoWidth: 1280, videoHeight: 720});
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => sourceVideo)});

    const extension = new CameraSourceExtension();
    await extension.startSharedCamera({CAMERA_ID: 'pose'});

    expect(extension.cameraFrameWidth({CAMERA_ID: 'pose'})).toBe(1280);
    expect(extension.cameraFrameHeight({CAMERA_ID: 'pose'})).toBe(720);
    expect(extension.cameraFrameRate({CAMERA_ID: 'pose'})).toBe(59.94);

    Object.assign(sourceVideo, {videoWidth: 0, videoHeight: 0});
    expect(extension.cameraFrameWidth({CAMERA_ID: 'pose'})).toBe(1920);
    expect(extension.cameraFrameHeight({CAMERA_ID: 'pose'})).toBe(1080);
  });

  it('reports an ended video track as stopped and cleans up its preview', async () => {
    const cameraStream = stream('disconnected-device');
    const {cameraRenderer} = renderer();
    vi.stubGlobal('Scratch', scratch({renderer: cameraRenderer, requestRedraw: vi.fn()}));
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();
    await extension.showCameraPreview({CAMERA_ID: 'pose'});

    cameraStream.end();

    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(false);
    expect(cameraRenderer.destroyDrawable).toHaveBeenCalledTimes(1);
    expect(cameraStream.stop).toHaveBeenCalledTimes(1);
  });

  it('ignores a late ended event from a replaced stream', async () => {
    const oldStream = stream('old-device');
    const replacementStream = stream('replacement-device');
    const getUserMedia = vi.fn()
      .mockResolvedValueOnce(oldStream)
      .mockResolvedValueOnce(replacementStream);
    vi.stubGlobal('navigator', {mediaDevices: {getUserMedia, enumerateDevices: vi.fn()}});
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();
    await extension.startSharedCamera({CAMERA_ID: 'pose'});
    extension.stopSharedCamera({CAMERA_ID: 'pose'});
    await extension.startSharedCamera({CAMERA_ID: 'pose'});

    oldStream.end();

    expect(extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(true);
    expect(extension.cameraDeviceIdReporter({CAMERA_ID: 'pose'})).toBe('replacement-device');
  });

  it.each(['PROJECT_STOP_ALL', 'PROJECT_LOADED', 'RUNTIME_DISPOSED'])(
    'cleans up block leases on %s',
    async (event) => {
      const listeners = new Map<string, Set<() => void>>();
      const runtime = {
        ...renderer().cameraRenderer,
        renderer: renderer().cameraRenderer,
        requestRedraw: vi.fn(),
        on: vi.fn((name: string, listener: () => void) => {
          const registered = listeners.get(name) ?? new Set();
          registered.add(listener);
          listeners.set(name, registered);
        }),
        off: vi.fn((name: string, listener: () => void) => listeners.get(name)?.delete(listener))
      };
      const cameraStream = stream('preview-device');
      vi.stubGlobal('Scratch', scratch(runtime));
      vi.stubGlobal('navigator', {
        mediaDevices: {getUserMedia: vi.fn(async () => cameraStream), enumerateDevices: vi.fn()}
      });
      vi.stubGlobal('document', {createElement: vi.fn(() => video())});

      const extension = new CameraSourceExtension();
      await extension.showCameraPreview();
      listeners.get(event)?.forEach((listener) => listener());

      expect(extension.isCameraRunning()).toBe(false);
      expect(cameraStream.getTracks()[0]?.stop).toHaveBeenCalledTimes(1);
    }
  );

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

  it('keeps a restarted session when a lease from the previous session is released', async () => {
    const first = stream('first-device');
    const second = stream('second-device');
    const getUserMedia = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    vi.stubGlobal('navigator', {
      mediaDevices: {getUserMedia, enumerateDevices: vi.fn()}
    });
    vi.stubGlobal('document', {createElement: vi.fn(() => video())});

    const extension = new CameraSourceExtension();
    const previous = await extension.acquireCamera({owner: 'previous', cameraId: 'default'});
    extension.stopAllCameras();
    const current = await extension.acquireCamera({owner: 'current', cameraId: 'default'});

    await previous.release();

    expect(extension.isCameraRunning()).toBe(true);
    expect(extension.cameraDeviceIdReporter()).toBe('second-device');
    expect(current.getFrameSource().deviceId).toBe('second-device');

    await current.release();
    expect(extension.isCameraRunning()).toBe(false);
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
    const lease = await extension.acquireCamera({preview: true, previewFlip: 'horizontal'});
    const skin = cameraRenderer._allSkins[0];
    expect(skin).toBeDefined();
    expect(lease.getFrameSource().element).toBe(sourceVideo);
    // The preview is mirrored; the frames are not. A consumer that read the
    // first fact as the second would hand flipped coordinates to a solve and
    // get back a left-right reflected pose with a small reprojection error.
    expect(lease.getFrameSource().previewFlip).toBe('horizontal');
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
    const altered = vi.spyOn(skin!, 'emitWasAltered');
    frameCallback?.(1, {} as VideoFrameCallbackMetadata);
    expect(cameraRenderer.updateDrawableScale).toHaveBeenLastCalledWith(10, [-75, 75]);
    // The renderer skips the frame when nothing says a drawable changed, and a
    // video is the one skin whose content changes without anybody touching
    // one. Asking the VM for a redraw does not reach it: that flag is the
    // sequencer's. Without this the preview stood still while `draw` ran
    // thirty times a second and returned immediately each time, and only a
    // stage resize -- which marks the renderer itself -- showed the picture
    // moving on.
    expect(altered).toHaveBeenCalled();
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
    const previewLease = await extension.acquireCamera({preview: true, previewFlip: 'horizontal'});
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
