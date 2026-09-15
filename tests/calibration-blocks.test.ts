import {readFileSync} from 'node:fs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension} from '../src/extension.js';
import {runtimeCapabilityKey} from '../src/runtime-capability.js';
import definitions from '../src/block-definitions.json';

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

function document(name: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/calibration/valid/${name}`, import.meta.url), 'utf8')
  );
}

let runtime: Record<string, unknown>;

beforeEach(() => {
  runtime = {on: vi.fn()};
  vi.stubGlobal('Scratch', scratch(runtime));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the calibration blocks', () => {
  it('stays out of the palette while the feature is off', () => {
    // Camera acquisition and preview are untouched by the flag; what it gates
    // is the new surface, until it has been exercised against a real
    // calibrator.
    const info = new CameraSourceExtension().getInfo() as {blocks: Array<{opcode: string}>};
    const opcodes = info.blocks.map((block) => block.opcode);
    expect(opcodes).toContain('startSharedCamera');
    expect(opcodes).not.toContain('registerCameraProfile');
  });

  it('implements every calibration opcode it defines', () => {
    const extension = new CameraSourceExtension() as unknown as Record<string, unknown>;
    for (const block of definitions.blocks) {
      expect(typeof extension[block.opcode]).toBe('function');
    }
  });

  it('accepts a profile and reports the camera as calibrated', () => {
    const extension = new CameraSourceExtension();
    const source = document('minimal.json');
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});
    expect(extension.cameraProfileError()).toBe('');
    expect(extension.cameraProfileRegistered({CAMERA_ID: source.cameraId})).toBe(true);
  });

  it('names the member at fault when a profile is refused', () => {
    const extension = new CameraSourceExtension();
    const broken = document('minimal.json');
    (broken.intrinsics as Record<string, unknown>).fx = 'wide';
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(broken)});
    expect(extension.cameraProfileError()).toBe('invalid-type');
    expect(extension.cameraProfileErrorDetail()).toContain('intrinsics.fx');
    expect(extension.cameraProfileRegistered({CAMERA_ID: broken.cameraId})).toBe(false);
  });

  it('reports text that is not JSON as such', () => {
    const extension = new CameraSourceExtension();
    extension.registerCameraProfile({PROFILE_JSON: 'not json'});
    expect(extension.cameraProfileError()).toBe('not-an-object');
  });

  it('says nothing about a camera that has no profile', () => {
    // An uncalibrated camera is an ordinary state. A reporter that threw here
    // would stop the script that read it.
    const extension = new CameraSourceExtension();
    expect(extension.cameraProfileJson({CAMERA_ID: 'ghost'})).toBe('');
    expect(extension.cameraProfileCompatibility({CAMERA_ID: 'ghost'})).toBe('');
    expect(extension.cameraProfileIntrinsicsJson({CAMERA_ID: 'ghost'})).toBe('');
  });

  it('withholds intrinsics while the camera has delivered no frame', () => {
    const extension = new CameraSourceExtension();
    const source = document('minimal.json');
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});
    // Nothing is running, so the size cannot be compared and the verdict is
    // undetermined rather than compatible.
    expect(extension.cameraProfileCompatibility({CAMERA_ID: source.cameraId})).toBe(
      'undetermined'
    );
    expect(extension.cameraProfileIntrinsicsJson({CAMERA_ID: source.cameraId})).toBe('');
  });

  it('reports conditions and a generation without a running camera', () => {
    const extension = new CameraSourceExtension();
    expect(JSON.parse(extension.cameraConditionsJson({CAMERA_ID: 'idle'}))).toMatchObject({
      width: 0,
      height: 0
    });
    expect(extension.cameraConditionsGeneration({CAMERA_ID: 'idle'})).toBe(0);
  });
});

describe('the runtime capability', () => {
  /**
   * The flag set is frozen when `config/feature-flags.ts` is evaluated, so a test that wants the
   * capability has to write the global and then bring the module graph up again. That is the same
   * order a host has to follow: write the flags before the extension bundle runs.
   */
  async function enabledExtension(): Promise<new () => unknown> {
    vi.resetModules();
    (globalThis as Record<string, unknown>)['__TWCS_FEATURE_FLAGS__'] = {
      calibrationProfilesV1: true
    };
    const module = await import('../src/extension.js');
    return module.CameraSourceExtension;
  }

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['__TWCS_FEATURE_FLAGS__'];
    vi.resetModules();
  });

  it('stays unpublished while the feature is off', () => {
    // Consumer extensions are the capability's audience, so leaving the key in place would turn the
    // new path on by default for exactly the callers the flag is meant to keep it off for. An
    // absent key is what a consumer already sees when Camera Source is not loaded at all.
    new CameraSourceExtension();
    expect(runtime[runtimeCapabilityKey]).toBeUndefined();
  });

  it('is published under a versioned key', async () => {
    const Extension = await enabledExtension();
    new Extension();
    const capability = runtime[runtimeCapabilityKey] as {
      version: number;
      requireVersion(version: number): unknown;
      calibratedCameras(): string[];
    };
    expect(capability.version).toBe(1);
    expect(capability.requireVersion(1)).toBe(capability);
    expect(capability.calibratedCameras()).toEqual([]);
  });

  it('refuses a version it does not implement', async () => {
    const Extension = await enabledExtension();
    new Extension();
    const capability = runtime[runtimeCapabilityKey] as {requireVersion(v: number): unknown};
    expect(() => capability.requireVersion(2)).toThrowError(/Unsupported/);
  });

  it('takes a profile from any producer and hands it back', async () => {
    const Extension = await enabledExtension();
    new Extension();
    const capability = runtime[runtimeCapabilityKey] as {
      registerProfile(document: unknown): {ok: boolean};
      profileFor(cameraId: string): {profileId: string} | undefined;
      calibratedCameras(): string[];
    };
    const source = document('full.json');
    expect(capability.registerProfile(source).ok).toBe(true);
    expect(capability.profileFor(source.cameraId as string)?.profileId).toBe(source.profileId);
    expect(capability.calibratedCameras()).toEqual([source.cameraId]);
  });

  it('reports a missing profile as a refusal rather than an empty one', async () => {
    const Extension = await enabledExtension();
    new Extension();
    const capability = runtime[runtimeCapabilityKey] as {
      assessProfile(cameraId: string): {ok: boolean};
    };
    expect(capability.assessProfile('ghost').ok).toBe(false);
  });

  it('withdraws only the capability it published', async () => {
    const Extension = await enabledExtension();
    const first = new Extension() as {dispose(): void};
    const published = runtime[runtimeCapabilityKey];
    expect(published).toBeDefined();

    // A reloaded project builds the replacement before the old instance is disposed. Deleting the
    // key blindly would take the new instance's capability away from every consumer.
    const replacement = {version: 1};
    runtime[runtimeCapabilityKey] = replacement;
    first.dispose();
    expect(runtime[runtimeCapabilityKey]).toBe(replacement);

    runtime[runtimeCapabilityKey] = published;
    first.dispose();
    expect(runtime[runtimeCapabilityKey]).toBeUndefined();
  });
});

describe('state that crosses a project boundary', () => {
  it('keeps profiles and drops the error that named the last attempt', () => {
    const extension = new CameraSourceExtension();
    const source = document('minimal.json');
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});
    extension.registerCameraProfile({PROFILE_JSON: 'not json'});
    expect(extension.cameraProfileError()).not.toBe('');

    // A profile describes a camera and a lens, neither of which belongs to the project that
    // registered it. The error describes the last register call, and once that project is gone a
    // stale message reads as a fresh failure of whatever loaded next.
    const listeners = (runtime['on'] as ReturnType<typeof vi.fn>).mock.calls;
    const boundary = listeners.find(([event]) => event === 'PROJECT_LOADED')?.[1] as () => void;
    boundary();

    expect(extension.cameraProfileError()).toBe('');
    expect(extension.cameraProfileRegistered({CAMERA_ID: source.cameraId as string})).toBe(true);
  });
});
