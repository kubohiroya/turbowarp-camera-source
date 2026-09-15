import {extensionConfig} from './config';
import definitions from './block-definitions.json';
import {createVideoPreview, type CameraRenderer, type VideoPreview} from './video-preview';

type BlockTypeName = 'COMMAND' | 'REPORTER' | 'BOOLEAN';
type ArgumentTypeName = 'STRING';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  arguments: Record<string, DefinitionArgument>;
}

export interface CameraAcquireOptions {
  owner?: string;
  cameraId?: string;
  deviceId?: string;
  video?: MediaTrackConstraints | boolean;
  mirrored?: boolean;
  preview?: boolean;
}

export interface CameraFrameSource {
  readonly kind: 'video';
  readonly element: HTMLVideoElement;
  readonly width: number;
  readonly height: number;
  readonly mirrored: boolean;
  readonly deviceId: string;
}

export interface CameraLease {
  getFrameSource(): CameraFrameSource;
  release(): Promise<void>;
}

const blockDefinitions = definitions.blocks as readonly BlockDefinition[];
const defaultCameraId = 'default';

interface CameraSession {
  readonly cameraId: string;
  readonly leases: Set<symbol>;
  readonly previewLeases: Map<symbol, boolean>;
  active: boolean;
  stream: MediaStream | null;
  video: HTMLVideoElement | null;
  preview: VideoPreview | null;
  startPromise: Promise<void> | null;
  mirrored: boolean;
  activeDeviceId: string;
}

interface BlockPreviewLease {
  readonly lease: CameraLease;
  readonly mirrored: boolean;
}

interface CameraFailure {
  readonly code: string;
  readonly message: string;
}

function mediaDevices(): MediaDevices {
  const devices = globalThis.navigator?.mediaDevices;
  if (!devices || typeof devices.getUserMedia !== 'function') {
    throw new Error('Camera Source requires navigator.mediaDevices.getUserMedia.');
  }
  return devices;
}

function normalizeId(value: unknown, fallback = defaultCameraId): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function optionalText(value: unknown): string {
  return String(value ?? '').trim();
}

function indexFrom(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed - 1 : -1;
}

function videoConstraints(options: CameraAcquireOptions): MediaStreamConstraints {
  if (typeof options.video === 'object' && options.video !== null) {
    return {audio: false, video: options.video};
  }
  if (options.deviceId) {
    return {audio: false, video: {deviceId: {exact: options.deviceId}}};
  }
  return {audio: false, video: options.video ?? true};
}

function cameraFailure(error: unknown): CameraFailure {
  if (error instanceof Error) {
    return {code: error.name || 'Error', message: error.message};
  }
  return {code: 'Error', message: String(error)};
}

export class CameraSourceExtension implements TurboWarpExtension {
  private readonly sessions = new Map<string, CameraSession>();
  private readonly blockLeases = new Map<string, CameraLease>();
  private readonly blockPreviewLeases = new Map<string, BlockPreviewLease>();
  private readonly blockPreviewRevisions = new Map<string, number>();
  private readonly cameraFailures = new Map<string, CameraFailure>();
  private devices: MediaDeviceInfo[] = [];

  public constructor() {
    Scratch.vm.runtime.ext_kubohiroyacamerasource = this;
    Scratch.vm.runtime.on?.('PROJECT_STOP_ALL', this.handleProjectBoundary);
    Scratch.vm.runtime.on?.('PROJECT_LOADED', this.handleProjectBoundary);
    Scratch.vm.runtime.on?.('RUNTIME_DISPOSED', this.dispose);
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
    };
  }

  public isCameraRunning(args: {CAMERA_ID?: unknown} = {}): boolean {
    const session = this.sessions.get(normalizeId(args.CAMERA_ID));
    return session?.stream ? this.isStreamRunning(session.stream) : false;
  }

  public cameraErrorCode(args: {CAMERA_ID?: unknown} = {}): string {
    return this.cameraFailures.get(normalizeId(args.CAMERA_ID))?.code ?? '';
  }

  public cameraError(args: {CAMERA_ID?: unknown} = {}): string {
    return this.cameraFailures.get(normalizeId(args.CAMERA_ID))?.message ?? '';
  }

  public cameraDeviceIdReporter(args: {CAMERA_ID?: unknown} = {}): string {
    return this.sessions.get(normalizeId(args.CAMERA_ID))?.activeDeviceId ?? '';
  }

  public cameraFrameWidth(args: {CAMERA_ID?: unknown} = {}): number {
    const session = this.sessions.get(normalizeId(args.CAMERA_ID));
    if (!session?.stream) return 0;
    return session.video?.videoWidth || this.trackSetting(session, 'width');
  }

  public cameraFrameHeight(args: {CAMERA_ID?: unknown} = {}): number {
    const session = this.sessions.get(normalizeId(args.CAMERA_ID));
    if (!session?.stream) return 0;
    return session.video?.videoHeight || this.trackSetting(session, 'height');
  }

  public cameraFrameRate(args: {CAMERA_ID?: unknown} = {}): number {
    const session = this.sessions.get(normalizeId(args.CAMERA_ID));
    return session?.stream ? this.trackSetting(session, 'frameRate') : 0;
  }

  public async startSharedCamera(args: {CAMERA_ID?: unknown; DEVICE_ID?: unknown} = {}): Promise<void> {
    const cameraId = normalizeId(args.CAMERA_ID);
    if (this.blockLeases.has(cameraId)) return;
    const deviceId = optionalText(args.DEVICE_ID);
    const options: CameraAcquireOptions = {owner: 'camera-source-block', cameraId};
    if (deviceId) options.deviceId = deviceId;
    const lease = await this.acquireCamera(options);
    this.blockLeases.set(cameraId, lease);
  }

  public async acquireCamera(options: CameraAcquireOptions = {}): Promise<CameraLease> {
    const cameraId = normalizeId(options.cameraId);
    const session = this.session(cameraId);
    const token = Symbol(String(options.owner ?? 'camera-lease'));
    if (session.startPromise) {
      await session.startPromise;
    } else if (!session.stream) {
      await this.start(session, options);
    }
    session.leases.add(token);
    try {
      if (options.preview === true) {
        session.previewLeases.set(token, options.mirrored === true);
        this.ensurePreview(session);
        session.preview?.setMirrored(this.previewMirrored(session));
      }
    } catch (error) {
      session.leases.delete(token);
      session.previewLeases.delete(token);
      this.stopWhenUnused(session);
      this.cameraFailures.set(cameraId, cameraFailure(error));
      throw error;
    }
    let released = false;
    return Object.freeze({
      getFrameSource: () => this.getFrameSource(session),
      release: async () => {
        if (released) return;
        released = true;
        session.leases.delete(token);
        session.previewLeases.delete(token);
        if (session.previewLeases.size === 0) {
          session.preview?.dispose();
          session.preview = null;
        } else {
          session.preview?.setMirrored(this.previewMirrored(session));
        }
        this.stopWhenUnused(session);
      }
    });
  }

  public async showCameraPreview(
    args: {CAMERA_ID?: unknown; MIRRORED?: unknown} = {}
  ): Promise<void> {
    const cameraId = normalizeId(args.CAMERA_ID);
    const mirrored = Scratch.Cast.toBoolean(args.MIRRORED ?? true);
    const existing = this.blockPreviewLeases.get(cameraId);
    if (existing?.mirrored === mirrored) return;
    const revision = this.nextPreviewBlockRevision(cameraId);

    const lease = await this.acquireCamera({
      owner: 'camera-source-preview-block',
      cameraId,
      preview: true,
      mirrored
    });
    if (this.blockPreviewRevisions.get(cameraId) !== revision) {
      await lease.release();
      return;
    }
    const current = this.blockPreviewLeases.get(cameraId);
    this.blockPreviewLeases.set(cameraId, {lease, mirrored});
    await current?.lease.release();
  }

  public async hideCameraPreview(args: {CAMERA_ID?: unknown} = {}): Promise<void> {
    const cameraId = normalizeId(args.CAMERA_ID);
    this.nextPreviewBlockRevision(cameraId);
    const existing = this.blockPreviewLeases.get(cameraId);
    if (!existing) return;
    this.blockPreviewLeases.delete(cameraId);
    await existing.lease.release();
  }

  public stopSharedCamera(args: {CAMERA_ID?: unknown} = {}): void {
    this.stopCameraSession(normalizeId(args.CAMERA_ID));
  }

  public async refreshCameraDevices(): Promise<void> {
    this.devices = (await mediaDevices().enumerateDevices()).filter(
      (device) => device.kind === 'videoinput'
    );
  }

  public cameraDeviceCount(): number {
    return this.devices.length;
  }

  public cameraDeviceIdAt(args: {INDEX?: unknown}): string {
    return this.devices[indexFrom(args.INDEX)]?.deviceId ?? '';
  }

  public cameraDeviceLabelAt(args: {INDEX?: unknown}): string {
    return this.devices[indexFrom(args.INDEX)]?.label ?? '';
  }

  public stopAllCameras(): void {
    for (const cameraId of [...this.sessions.keys()]) {
      this.stopCameraSession(cameraId);
    }
    this.blockLeases.clear();
    this.blockPreviewLeases.clear();
  }

  public readonly dispose = (): void => {
    this.stopAllCameras();
    Scratch.vm.runtime.off?.('PROJECT_STOP_ALL', this.handleProjectBoundary);
    Scratch.vm.runtime.off?.('PROJECT_LOADED', this.handleProjectBoundary);
    Scratch.vm.runtime.off?.('RUNTIME_DISPOSED', this.dispose);
  };

  private readonly handleProjectBoundary = (): void => {
    this.stopAllCameras();
  };

  private session(cameraId: string): CameraSession {
    const existing = this.sessions.get(cameraId);
    if (existing) return existing;
    const session: CameraSession = {
      cameraId,
      leases: new Set(),
      previewLeases: new Map(),
      active: true,
      stream: null,
      video: null,
      preview: null,
      startPromise: null,
      mirrored: false,
      activeDeviceId: ''
    };
    this.sessions.set(cameraId, session);
    return session;
  }

  private async start(session: CameraSession, options: CameraAcquireOptions): Promise<void> {
    session.mirrored = options.mirrored === true;
    session.startPromise = (async () => {
      const stream = await mediaDevices().getUserMedia(videoConstraints(options));
      let video: HTMLVideoElement | null = null;
      try {
        if (!session.active) throw new Error('Camera acquisition was cancelled.');
        video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();
        if (!session.active) throw new Error('Camera acquisition was cancelled.');
        session.stream = stream;
        session.video = video;
        this.watchStreamEnd(session, stream);
        this.updateActiveDevice(session);
        this.cameraFailures.delete(session.cameraId);
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        if (video) video.srcObject = null;
        throw error;
      }
    })();
    try {
      await session.startPromise;
    } catch (error) {
      if (this.sessions.get(session.cameraId) === session) {
        this.stopCameraSession(session.cameraId);
      }
      this.cameraFailures.set(session.cameraId, cameraFailure(error));
      throw error;
    }
  }

  private nextPreviewBlockRevision(cameraId: string): number {
    const revision = (this.blockPreviewRevisions.get(cameraId) ?? 0) + 1;
    this.blockPreviewRevisions.set(cameraId, revision);
    return revision;
  }

  private isStreamRunning(stream: MediaStream): boolean {
    return stream.active !== false && stream.getVideoTracks().some((track) => track.readyState !== 'ended');
  }

  private watchStreamEnd(session: CameraSession, stream: MediaStream): void {
    const handleEnded = (): void => {
      if (this.sessions.get(session.cameraId) !== session || session.stream !== stream) return;
      if (!this.isStreamRunning(stream)) this.stopCameraSession(session.cameraId);
    };
    for (const track of stream.getVideoTracks()) {
      track.addEventListener('ended', handleEnded, {once: true});
    }
  }

  private updateActiveDevice(session: CameraSession): void {
    const track = session.stream?.getVideoTracks()[0] ?? null;
    const settings = track?.getSettings();
    session.activeDeviceId = typeof settings?.deviceId === 'string' ? settings.deviceId : '';
  }

  private trackSetting(
    session: CameraSession,
    name: 'width' | 'height' | 'frameRate'
  ): number {
    const value = session.stream?.getVideoTracks()[0]?.getSettings()[name];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private ensurePreview(session: CameraSession): void {
    if (session.preview || !session.video) return;
    const runtime = Scratch.vm.runtime;
    session.preview = createVideoPreview(
      runtime.renderer as CameraRenderer | undefined,
      session.video,
      this.previewMirrored(session),
      () => runtime.requestRedraw?.()
    );
  }

  private previewMirrored(session: CameraSession): boolean {
    return [...session.previewLeases.values()].some(Boolean);
  }

  private getFrameSource(session: CameraSession): CameraFrameSource {
    if (!session.video || !session.stream) {
      throw new Error('Shared camera is not running.');
    }
    return Object.freeze({
      kind: 'video',
      element: session.video,
      width: session.video.videoWidth,
      height: session.video.videoHeight,
      mirrored: session.mirrored,
      deviceId: session.activeDeviceId
    });
  }

  private stopWhenUnused(session: CameraSession): void {
    // A lease released after its session was replaced must not stop the
    // session that now owns the camera id.
    if (this.sessions.get(session.cameraId) !== session) return;
    if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
  }

  private stopCameraSession(cameraId: string): void {
    const session = this.sessions.get(cameraId);
    if (!session) return;
    session.active = false;
    this.nextPreviewBlockRevision(cameraId);
    session.preview?.dispose();
    session.stream?.getTracks().forEach((track) => track.stop());
    if (session.video) session.video.srcObject = null;
    session.stream = null;
    session.video = null;
    session.startPromise = null;
    session.preview = null;
    session.activeDeviceId = '';
    session.leases.clear();
    session.previewLeases.clear();
    this.sessions.delete(cameraId);
    this.blockLeases.delete(cameraId);
    this.blockPreviewLeases.delete(cameraId);
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: Scratch.BlockType[block.blockType],
      text: Scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {
            type: Scratch.ArgumentType[argument.type],
            defaultValue: argument.defaultValue
          }
        ])
      )
    };
  }
}
