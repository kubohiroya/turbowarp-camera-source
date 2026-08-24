import {extensionConfig} from './config';
import definitions from './block-definitions.json';

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
  video?: MediaTrackConstraints | boolean;
  mirrored?: boolean;
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

function mediaDevices(): MediaDevices {
  const devices = globalThis.navigator?.mediaDevices;
  if (!devices || typeof devices.getUserMedia !== 'function') {
    throw new Error('Camera Source requires navigator.mediaDevices.getUserMedia.');
  }
  return devices;
}

function videoConstraints(options: CameraAcquireOptions): MediaStreamConstraints {
  return {audio: false, video: options.video ?? true};
}

export class CameraSourceExtension implements TurboWarpExtension {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private readonly leases = new Set<symbol>();
  private startPromise: Promise<void> | null = null;
  private mirrored = false;
  private activeDeviceId = '';

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

  public isCameraRunning(): boolean {
    return this.stream !== null;
  }

  public cameraDeviceIdReporter(): string {
    return this.activeDeviceId;
  }

  public async startSharedCamera(): Promise<void> {
    const lease = await this.acquireCamera({owner: 'camera-source-block'});
    await lease.release();
  }

  public async acquireCamera(options: CameraAcquireOptions = {}): Promise<CameraLease> {
    const token = Symbol(String(options.owner ?? 'camera-lease'));
    if (this.startPromise) {
      await this.startPromise;
    } else if (!this.stream) {
      await this.start(options);
    }
    this.leases.add(token);
    let released = false;
    return Object.freeze({
      getFrameSource: () => this.getFrameSource(),
      release: async () => {
        if (released) return;
        released = true;
        this.leases.delete(token);
        if (this.leases.size === 0) this.stopSharedCamera();
      }
    });
  }

  public stopSharedCamera(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.video) this.video.srcObject = null;
    this.stream = null;
    this.video = null;
    this.startPromise = null;
    this.activeDeviceId = '';
  }

  private async start(options: CameraAcquireOptions): Promise<void> {
    this.mirrored = options.mirrored === true;
    this.startPromise = (async () => {
      const stream = await mediaDevices().getUserMedia(videoConstraints(options));
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      this.stream = stream;
      this.video = video;
      this.updateActiveDevice();
    })();
    try {
      await this.startPromise;
    } catch (error) {
      this.stopSharedCamera();
      throw error;
    }
  }

  private updateActiveDevice(): void {
    const track = this.stream?.getVideoTracks()[0] ?? null;
    const settings = track?.getSettings();
    this.activeDeviceId = typeof settings?.deviceId === 'string' ? settings.deviceId : '';
  }

  private getFrameSource(): CameraFrameSource {
    if (!this.video || !this.stream) {
      throw new Error('Shared camera is not running.');
    }
    return Object.freeze({
      kind: 'video',
      element: this.video,
      width: this.video.videoWidth,
      height: this.video.videoHeight,
      mirrored: this.mirrored,
      deviceId: this.activeDeviceId
    });
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
