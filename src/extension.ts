import {featureFlags} from '../config/feature-flags';
import {extensionConfig} from './config';
import definitions from './block-definitions.json';
import type {UsableIntrinsics} from './calibration/adaptation';
import {readCameraConditions, type CameraConditions} from './calibration/conditions';
import {decisiveFindings} from './calibration/compatibility';
import {CameraProfileRegistry, type ProfileAssessment} from './calibration/registry';
import {serializeCameraIntrinsicProfile} from './calibration/profile';
import type {CameraIntrinsicProfileV1, ProfileError} from './calibration/types';
import {
  createRuntimeCapability,
  runtimeCapabilityKey,
  type CameraSourceCapabilityV1
} from './runtime-capability';
import {toFlip, type Flip} from './flip';
import {
  cameraSourceRuntimeKey,
  type CameraAcquireOptions,
  type CameraFrameSource,
  type CameraLease
} from './runtime';

export type {CameraAcquireOptions, CameraFrameSource, CameraLease} from './runtime';
import {createVideoPreview, type CameraRenderer, type VideoPreview} from './video-preview';

type BlockTypeName = 'COMMAND' | 'REPORTER' | 'BOOLEAN';
type ArgumentTypeName = 'STRING';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
  menu?: string;
}

interface MenuDefinition {
  acceptReporters: boolean;
  items: readonly string[];
}

interface BlockDefinition {
  opcode: string;
  feature?: 'calibrationProfilesV1';
  blockType: BlockTypeName;
  text: string;
  arguments: Record<string, DefinitionArgument>;
}


const blockDefinitions = definitions.blocks as readonly BlockDefinition[];
const menuDefinitions = definitions.menus as Readonly<Record<string, MenuDefinition>>;

const defaultCameraId = 'default';

interface CameraSession {
  readonly cameraId: string;
  readonly leases: Set<symbol>;
  readonly previewLeases: Map<symbol, Flip>;
  active: boolean;
  stream: MediaStream | null;
  video: HTMLVideoElement | null;
  preview: VideoPreview | null;
  startPromise: Promise<void> | null;
  activeDeviceId: string;
}

interface BlockPreviewLease {
  readonly lease: CameraLease;
  readonly flip: Flip;
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

/**
 * The flip a `show preview` block asked for.
 *
 * The menu accepts reporters, so the value can arrive as any string a project computed. Anything
 * outside the vocabulary falls back to horizontal rather than silently drawing the preview
 * unflipped: a project that asked for a flip and got none would look like the camera was wrong.
 */
function requestedPreviewFlip(args: {PREVIEW_FLIP?: unknown}): Flip {
  return toFlip(args.PREVIEW_FLIP, 'horizontal');
}

/** The preview flip a consumer asked for through the runtime API. */
function previewFlipOf(options: CameraAcquireOptions): Flip {
  return toFlip(options.previewFlip);
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
  private readonly profiles = new CameraProfileRegistry();
  private readonly generations = new Map<string, number>();
  private readonly lastConditions = new Map<string, string>();
  private readonly assessments = new Map<
    string,
    {
      readonly signature: string;
      readonly profile: CameraIntrinsicProfileV1 | undefined;
      readonly assessment: ProfileAssessment | undefined;
    }
  >();
  private readonly calibrationEnabled = featureFlags.calibrationProfilesV1;
  /** The object published on the runtime, kept so disposal can withdraw exactly what it published. */
  private readonly capability: CameraSourceCapabilityV1 | undefined;
  private profileError: ProfileError | undefined;
  private devices: MediaDeviceInfo[] = [];

  public constructor() {
    Scratch.vm.runtime[cameraSourceRuntimeKey] = this;
    // The flag closes the whole new path, not just the palette. Consumer extensions are the main
    // audience for the capability, so publishing it regardless would leave the path on by default
    // for exactly the callers it is meant to be off for. An absent key is a case every consumer
    // already handles: it is what they see when Camera Source is not loaded at all.
    this.capability = this.calibrationEnabled
      ? createRuntimeCapability({
          registerProfile: (document) => this.profiles.register(document),
          forgetProfile: (cameraId) => this.profiles.forget(cameraId),
          profileFor: (cameraId) => this.profiles.get(cameraId),
          calibratedCameras: () => this.profiles.cameraIds(),
          assessProfile: (cameraId) => {
            return this.assessmentOf(cameraId);
          },
          intrinsicsFor: (cameraId) => this.intrinsicsOf(cameraId),
          conditionsFor: (cameraId) => this.conditionsOf(cameraId),
          conditionsGeneration: (cameraId) => this.generationOf(cameraId)
        })
      : undefined;
    if (this.capability) Scratch.vm.runtime[runtimeCapabilityKey] = this.capability;
    Scratch.vm.runtime.on?.('PROJECT_STOP_ALL', this.handleProjectBoundary);
    Scratch.vm.runtime.on?.('PROJECT_LOADED', this.handleProjectBoundary);
    Scratch.vm.runtime.on?.('RUNTIME_DISPOSED', this.dispose);
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      blocks: blockDefinitions
        .filter((block) => block.feature === undefined || this.calibrationEnabled)
        .map((block) => this.toScratchBlock(block)),
      menus: Object.fromEntries(
        Object.entries(menuDefinitions).map(([id, menu]) => [
          id,
          {acceptReporters: menu.acceptReporters, items: [...menu.items]}
        ])
      )
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
        session.previewLeases.set(token, previewFlipOf(options));
        this.ensurePreview(session);
        session.preview?.setFlip(this.previewFlip(session));
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
          session.preview?.setFlip(this.previewFlip(session));
        }
        this.stopWhenUnused(session);
      }
    });
  }

  public async showCameraPreview(
    args: {CAMERA_ID?: unknown; PREVIEW_FLIP?: unknown} = {}
  ): Promise<void> {
    const cameraId = normalizeId(args.CAMERA_ID);
    const flip = requestedPreviewFlip(args);
    const existing = this.blockPreviewLeases.get(cameraId);
    if (existing?.flip === flip) return;
    const revision = this.nextPreviewBlockRevision(cameraId);

    const lease = await this.acquireCamera({
      owner: 'camera-source-preview-block',
      cameraId,
      preview: true,
      previewFlip: flip
    });
    if (this.blockPreviewRevisions.get(cameraId) !== revision) {
      await lease.release();
      return;
    }
    const current = this.blockPreviewLeases.get(cameraId);
    this.blockPreviewLeases.set(cameraId, {lease, flip});
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
    // Only withdraw the capability if it is still the one this instance published. A reloaded
    // project builds a new extension before the old one is disposed, and deleting the key blindly
    // would take the new instance's capability away from every consumer.
    const runtime = Scratch.vm.runtime;
    if (runtime[runtimeCapabilityKey] === this.capability) delete runtime[runtimeCapabilityKey];
    Scratch.vm.runtime.off?.('PROJECT_STOP_ALL', this.handleProjectBoundary);
    Scratch.vm.runtime.off?.('PROJECT_LOADED', this.handleProjectBoundary);
    Scratch.vm.runtime.off?.('RUNTIME_DISPOSED', this.dispose);
  };

  private readonly handleProjectBoundary = (): void => {
    this.stopAllCameras();
    // Profiles survive: one describes a camera and a lens, neither of which belongs to the project
    // that happened to register it, and making an operator import the file again on every load
    // would be the kind of friction that gets worked around rather than followed.
    //
    // The error does not survive. It names what the last register call did, and once the project
    // that made that call is gone there is nothing left for it to be about; a stale message under
    // `camera profile error` reads as a fresh failure of whatever loaded next.
    //
    // The condition generations stay as they are. A consumer compares the integer to decide whether
    // what it derived from a profile is still good, and that question does not change because a
    // project boundary went past.
    this.profileError = undefined;
  };

  public registerCameraProfile(args: {PROFILE_JSON?: unknown} = {}): void {
    const text = Scratch.Cast.toString(args.PROFILE_JSON ?? '');
    let document: unknown;
    try {
      document = JSON.parse(text);
    } catch {
      this.profileError = {
        code: 'not-an-object',
        path: '',
        message: 'The profile is not valid JSON.'
      };
      return;
    }
    const result = this.profiles.register(document);
    this.profileError = result.ok ? undefined : result.error;
  }

  public forgetCameraProfile(args: {CAMERA_ID?: unknown} = {}): void {
    this.profiles.forget(normalizeId(args.CAMERA_ID));
  }

  public cameraProfileRegistered(args: {CAMERA_ID?: unknown} = {}): boolean {
    return this.profiles.has(normalizeId(args.CAMERA_ID));
  }

  public cameraProfileJson(args: {CAMERA_ID?: unknown} = {}): string {
    const profile = this.profiles.get(normalizeId(args.CAMERA_ID));
    return profile ? serializeCameraIntrinsicProfile(profile) : '';
  }

  public cameraProfileError(): string {
    return this.profileError?.code ?? '';
  }

  public cameraProfileErrorDetail(): string {
    if (!this.profileError) return '';
    const {path, message} = this.profileError;
    return path ? `${path}: ${message}` : message;
  }

  public cameraProfileCompatibility(args: {CAMERA_ID?: unknown} = {}): string {
    const cameraId = normalizeId(args.CAMERA_ID);
    return this.assessmentOf(cameraId)?.compatibility.state ?? '';
  }

  public cameraProfileCompatibilityDetail(args: {CAMERA_ID?: unknown} = {}): string {
    const cameraId = normalizeId(args.CAMERA_ID);
    const assessment = this.assessmentOf(cameraId);
    if (assessment === undefined) return '';
    const findings = decisiveFindings(assessment.compatibility);
    if (findings.length === 0) return 'The profile matches the camera as configured.';
    return findings.map((entry) => entry.detail).join(' ');
  }

  public cameraProfileAdaptation(args: {CAMERA_ID?: unknown} = {}): string {
    const cameraId = normalizeId(args.CAMERA_ID);
    return this.assessmentOf(cameraId)?.adaptation.state ?? '';
  }

  public cameraProfileIntrinsicsJson(args: {CAMERA_ID?: unknown} = {}): string {
    const cameraId = normalizeId(args.CAMERA_ID);
    // Withholding intrinsics that do not fit is decided once, in the assessment, so this surface
    // and the runtime capability cannot drift into answering the question differently.
    const usable = this.intrinsicsOf(cameraId);
    return usable === undefined ? '' : JSON.stringify(usable);
  }

  public cameraConditionsJson(args: {CAMERA_ID?: unknown} = {}): string {
    return JSON.stringify(this.conditionsOf(normalizeId(args.CAMERA_ID)));
  }

  public cameraConditionsGeneration(args: {CAMERA_ID?: unknown} = {}): number {
    return this.generationOf(normalizeId(args.CAMERA_ID));
  }

  /** What the track reports about itself right now. Read only. */
  private intrinsicsOf(cameraId: string): UsableIntrinsics | undefined {
    const id = normalizeId(cameraId);
    return this.assessmentOf(id)?.usable;
  }

  private conditionsOf(cameraId: string): CameraConditions {
    const id = normalizeId(cameraId);
    const session = this.sessions.get(id);
    if (!session?.stream) {
      return {width: 0, height: 0, deviceId: '', previewFlip: 'none'};
    }
    const track = session.stream.getVideoTracks()[0];
    let settings: Record<string, unknown> = {};
    try {
      settings = (track?.getSettings() ?? {}) as unknown as Record<string, unknown>;
    } catch {
      settings = {};
    }
    const device = this.devices.find((entry) => entry.deviceId === session.activeDeviceId);
    return readCameraConditions(
      {
        width: session.video?.videoWidth ?? 0,
        height: session.video?.videoHeight ?? 0,
        deviceId: session.activeDeviceId,
        previewFlip: this.previewFlip(session),
        ...(device?.label ? {label: device.label} : {})
      },
      settings
    );
  }

  /**
   * A counter that moves when the geometry does.
   *
   * Derived by comparing the members that affect projection, so it advances on
   * a resolution change or a zoom and stays put for a frame rate change. A
   * consumer holding a placement solved from these conditions compares one
   * number rather than re-checking each of them.
   */
  /**
   * The conditions that decide geometry, as one comparable string.
   *
   * The preview flip is not among them. It changes how the stage draws the frame and nothing about
   * how the lens projects, so folding it in would advance the generation and invalidate consumers'
   * work every time an operator turned the preview over.
   */
  private conditionsSignature(conditions: CameraConditions): string {
    return JSON.stringify([
      conditions.width,
      conditions.height,
      conditions.resizeMode ?? null,
      conditions.zoom ?? null,
      conditions.focusMode ?? null,
      conditions.focusDistance ?? null,
      conditions.deviceId
    ]);
  }

  /**
   * The assessment for a camera, reusing the last one while nothing it depends on has changed.
   *
   * The conditions are read on every call, so this cannot answer with a stale view of the camera.
   * What is skipped is the derivation: judging compatibility builds a finding for every member it
   * compares, each with its own sentence, and these reporters are read from blocks that a project
   * can evaluate on every frame. Reusing the result while the inputs are identical keeps that off
   * the frame budget without putting a staleness window in its place.
   */
  private assessmentOf(cameraId: string): ProfileAssessment | undefined {
    const id = normalizeId(cameraId);
    const conditions = this.conditionsOf(id);
    const signature = this.conditionsSignature(conditions);
    const profile = this.profiles.get(id);
    const cached = this.assessments.get(id);
    // Profile identity, not profileId: registering again replaces the stored object, and a document
    // re-registered under the same id may differ in every other member.
    if (cached && cached.signature === signature && cached.profile === profile) {
      return cached.assessment;
    }
    const assessment = this.profiles.assess(id, conditions);
    this.assessments.set(id, {signature, profile, assessment});
    return assessment;
  }

  private generationOf(cameraId: string): number {
    const id = normalizeId(cameraId);
    const conditions = this.conditionsOf(id);
    const signature = this.conditionsSignature(conditions);
    const previous = this.lastConditions.get(id);
    if (previous === undefined) {
      this.lastConditions.set(id, signature);
      this.generations.set(id, 0);
      return 0;
    }
    if (previous === signature) return this.generations.get(id) ?? 0;
    const next = (this.generations.get(id) ?? 0) + 1;
    this.lastConditions.set(id, signature);
    this.generations.set(id, next);
    return next;
  }

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
      activeDeviceId: ''
    };
    this.sessions.set(cameraId, session);
    return session;
  }

  private async start(session: CameraSession, options: CameraAcquireOptions): Promise<void> {
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
      this.previewFlip(session),
      () => runtime.requestRedraw?.()
    );
  }

  /**
   * How the preview is shown for a camera several consumers may be watching.
   *
   * Any consumer asking for a flipped preview flips it for everyone, which is
   * the same rule the previous boolean followed.
   */
  private previewFlip(session: CameraSession): Flip {
    for (const flip of session.previewLeases.values()) {
      if (flip !== 'none') return flip;
    }
    return 'none';
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
      previewFlip: this.previewFlip(session),
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
    this.assessments.delete(cameraId);
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
            defaultValue: argument.defaultValue,
            ...(argument.menu === undefined ? {} : {menu: argument.menu})
          }
        ])
      )
    };
  }
}
