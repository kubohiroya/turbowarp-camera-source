const videoLayer = 'video';
const haveCurrentData = 2;

interface RendererSkin {
  readonly id: number;
  readonly size: readonly number[];
  readonly rotationCenter: number[];
  private: boolean;
  dispose(): void;
  emitWasAltered(): void;
  getTexture(scale: readonly number[]): WebGLTexture | null;
}

interface RendererSkinConstructor {
  new (id: number, renderer: CameraRenderer): RendererSkin;
}

interface VideoSkinConstructor {
  new (
    id: number,
    renderer: CameraRenderer,
    video: HTMLVideoElement,
    onFrame: FrameCallback
  ): RendererSkin;
}

interface RendererExports {
  Skin: RendererSkinConstructor;
}

export interface CameraRenderer {
  readonly gl: WebGLRenderingContext;
  readonly exports?: RendererExports;
  _nextSkinId: number;
  _allSkins: Array<RendererSkin | undefined>;
  createDrawable(group: string): number | undefined;
  destroyDrawable(drawableId: number, group: string): void;
  destroySkin(skinId: number): void;
  getNativeSize(): readonly [number, number];
  markDrawableAsNoninteractive?(drawableId: number): void;
  markSkinAsPrivate?(skinId: number): void;
  updateDrawablePosition(drawableId: number, position: readonly [number, number]): void;
  updateDrawableScale(drawableId: number, scale: readonly [number, number]): void;
  updateDrawableSkinId(drawableId: number, skinId: number): void;
  updateDrawableVisible(drawableId: number, visible: boolean): void;
}

export interface VideoPreview {
  dispose(): void;
  setMirrored(mirrored: boolean): void;
}

type FrameCallback = (metricsChanged: boolean) => void;

function videoSkinClass(renderer: CameraRenderer): VideoSkinConstructor {
  const BaseSkin = renderer.exports?.Skin;
  if (typeof BaseSkin !== 'function') {
    throw new Error('Camera preview requires renderer.exports.Skin.');
  }

  return class VideoSkin extends BaseSkin {
    private readonly video: HTMLVideoElement;
    private readonly onFrame: FrameCallback;
    private texture: WebGLTexture | null = null;
    private textureSize: [number, number] = [0, 0];
    private dirty = true;
    private disposed = false;
    private videoFrameCallbackId: number | null = null;
    private animationFrameId: number | null = null;
    private lastCurrentTime = Number.NaN;

    public constructor(
      id: number,
      skinRenderer: CameraRenderer,
      video: HTMLVideoElement,
      onFrame: FrameCallback
    ) {
      super(id, skinRenderer);
      this.video = video;
      this.onFrame = onFrame;
      this.private = true;
      this.syncMetrics();
      this.scheduleFrame();
    }

    public override get size(): readonly number[] {
      return this.textureSize;
    }

    public override getTexture(): WebGLTexture | null {
      if (
        this.disposed ||
        this.video.readyState < haveCurrentData ||
        this.video.videoWidth === 0 ||
        this.video.videoHeight === 0
      ) {
        return null;
      }

      const metricsChanged = this.syncMetrics();
      if (metricsChanged) this.onFrame(true);
      if (!this.dirty && this.video.currentTime === this.lastCurrentTime) return this.texture;

      const gl = renderer.gl;
      if (!this.texture) {
        this.texture = gl.createTexture();
        if (!this.texture) throw new Error('Camera preview could not create a WebGL texture.');
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
      }

      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          this.video
        );
      } finally {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      }
      this.dirty = false;
      this.lastCurrentTime = this.video.currentTime;
      return this.texture;
    }

    public override dispose(): void {
      this.disposed = true;
      if (this.videoFrameCallbackId !== null && this.video.cancelVideoFrameCallback) {
        this.video.cancelVideoFrameCallback(this.videoFrameCallbackId);
      }
      if (this.animationFrameId !== null && typeof globalThis.cancelAnimationFrame === 'function') {
        globalThis.cancelAnimationFrame(this.animationFrameId);
      }
      if (this.texture) renderer.gl.deleteTexture(this.texture);
      this.texture = null;
      super.dispose();
    }

    public useNearest(): boolean {
      return false;
    }

    public updateSilhouette(): void {
      // Preview drawables are noninteractive. Avoid reading video pixels back to the CPU.
    }

    private syncMetrics(): boolean {
      const width = this.video.videoWidth;
      const height = this.video.videoHeight;
      if (width === this.textureSize[0] && height === this.textureSize[1]) return false;
      this.textureSize = [width, height];
      this.rotationCenter[0] = width / 2;
      this.rotationCenter[1] = height / 2;
      return true;
    }

    private readonly handleVideoFrame: VideoFrameRequestCallback = () => {
      if (this.disposed) return;
      this.dirty = true;
      this.onFrame(this.syncMetrics());
      this.scheduleFrame();
    };

    private readonly handleAnimationFrame: FrameRequestCallback = () => {
      if (this.disposed) return;
      if (this.video.currentTime !== this.lastCurrentTime) {
        this.dirty = true;
        this.onFrame(this.syncMetrics());
      }
      this.scheduleFrame();
    };

    private scheduleFrame(): void {
      if (typeof this.video.requestVideoFrameCallback === 'function') {
        this.videoFrameCallbackId = this.video.requestVideoFrameCallback(this.handleVideoFrame);
      } else if (typeof globalThis.requestAnimationFrame === 'function') {
        this.animationFrameId = globalThis.requestAnimationFrame(this.handleAnimationFrame);
      }
    }
  };
}

function assertRenderer(renderer: CameraRenderer | undefined): asserts renderer is CameraRenderer {
  if (
    !renderer ||
    !Array.isArray(renderer._allSkins) ||
    !Number.isInteger(renderer._nextSkinId) ||
    typeof renderer.createDrawable !== 'function' ||
    typeof renderer.destroyDrawable !== 'function' ||
    typeof renderer.destroySkin !== 'function' ||
    typeof renderer.getNativeSize !== 'function'
  ) {
    throw new Error('Camera preview requires a compatible TurboWarp renderer.');
  }
}

export function createVideoPreview(
  renderer: CameraRenderer | undefined,
  video: HTMLVideoElement,
  mirrored: boolean,
  requestRedraw: () => void
): VideoPreview {
  assertRenderer(renderer);
  const VideoSkin = videoSkinClass(renderer);
  const skinId = renderer._nextSkinId++;
  let drawableId: number | undefined;
  let disposed = false;
  let previewMirrored = mirrored;
  let lastLayout = '';

  const updateLayout = (): void => {
    if (drawableId === undefined || video.videoWidth === 0 || video.videoHeight === 0) return;
    const [stageWidth, stageHeight] = renderer.getNativeSize();
    const layout = [video.videoWidth, video.videoHeight, stageWidth, stageHeight, previewMirrored].join(':');
    if (layout === lastLayout) return;
    const scale = Math.max(stageWidth / video.videoWidth, stageHeight / video.videoHeight) * 100;
    renderer.updateDrawableScale(drawableId, [previewMirrored ? -scale : scale, scale]);
    lastLayout = layout;
  };

  const skin = new VideoSkin(skinId, renderer, video, (metricsChanged) => {
    if (metricsChanged) skin.emitWasAltered();
    updateLayout();
    requestRedraw();
  });
  renderer._allSkins[skinId] = skin;

  try {
    drawableId = renderer.createDrawable(videoLayer);
    if (drawableId === undefined) throw new Error('Camera preview could not create a video drawable.');
    renderer.updateDrawableSkinId(drawableId, skinId);
    renderer.updateDrawablePosition(drawableId, [0, 0]);
    updateLayout();
    renderer.updateDrawableVisible(drawableId, true);
    renderer.markSkinAsPrivate?.(skinId);
    renderer.markDrawableAsNoninteractive?.(drawableId);
    requestRedraw();
  } catch (error) {
    try {
      if (drawableId !== undefined) renderer.destroyDrawable(drawableId, videoLayer);
    } finally {
      renderer.destroySkin(skinId);
    }
    throw error;
  }

  return Object.freeze({
    setMirrored: (nextMirrored: boolean) => {
      if (disposed || previewMirrored === nextMirrored) return;
      previewMirrored = nextMirrored;
      updateLayout();
      requestRedraw();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      try {
        if (drawableId !== undefined) renderer.destroyDrawable(drawableId, videoLayer);
      } finally {
        try {
          renderer.destroySkin(skinId);
        } finally {
          requestRedraw();
        }
      }
    }
  });
}
