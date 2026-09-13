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
  stream: MediaStream | null;
  video: HTMLVideoElement | null;
  preview: VideoPreview | null;
  startPromise: Promise<void> | null;
  mirrored: boolean;
  activeDeviceId: string;
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

export class CameraSourceExtension implements TurboWarpExtension {
  private readonly sessions = new Map<string, CameraSession>();
  private readonly blockLeases = new Map<string, CameraLease>();
  private devices: MediaDeviceInfo[] = [];

  public constructor() {
    Scratch.vm.runtime.ext_kubohiroyacamerasource = this;
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
    return Boolean(session?.stream);
  }

  public cameraDeviceIdReporter(args: {CAMERA_ID?: unknown} = {}): string {
    return this.sessions.get(normalizeId(args.CAMERA_ID))?.activeDeviceId ?? '';
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
      if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
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
        if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
      }
    });
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
  }

  private session(cameraId: string): CameraSession {
    const existing = this.sessions.get(cameraId);
    if (existing) return existing;
    const session: CameraSession = {
      cameraId,
      leases: new Set(),
      previewLeases: new Map(),
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
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      session.stream = stream;
      session.video = video;
      this.updateActiveDevice(session);
    })();
    try {
      await session.startPromise;
    } catch (error) {
      this.stopCameraSession(session.cameraId);
      throw error;
    }
  }

  private updateActiveDevice(session: CameraSession): void {
    const track = session.stream?.getVideoTracks()[0] ?? null;
    const settings = track?.getSettings();
    session.activeDeviceId = typeof settings?.deviceId === 'string' ? settings.deviceId : '';
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

  private stopCameraSession(cameraId: string): void {
    const session = this.sessions.get(cameraId);
    if (!session) return;
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
