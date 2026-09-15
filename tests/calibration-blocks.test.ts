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

describe('a profile file an operator already has', () => {
  it('registers a twrmc/camera-calibration document through the ordinary block', () => {
    // The operator knows they calibrated this camera once and kept the result; which of two schemas
    // the file uses is not something they should have to answer before loading it.
    const extension = new CameraSourceExtension();
    const legacy: unknown = JSON.parse(
      readFileSync(new URL('./fixtures/calibration/legacy/valid.json', import.meta.url), 'utf8')
    );
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(legacy)});

    expect(extension.cameraProfileError()).toBe('');
    expect(extension.cameraProfileRegistered({CAMERA_ID: 'stage-left'})).toBe(true);

    const stored = extension.cameraProfileJson({CAMERA_ID: 'stage-left'});
    expect(stored).toContain('twcs/camera-intrinsics');
    // The world pose the old format carried was the extrinsic of whichever sample happened to be
    // last. Carrying it forward would put the camera somewhere it has never been.
    expect(stored).not.toContain('worldFromCamera');
    expect(stored).toContain('twrmc/camera-calibration v1');
  });

  it('still refuses a document written in neither schema', () => {
    const extension = new CameraSourceExtension();
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify({schema: 'something/else'})});
    expect(extension.cameraProfileError()).not.toBe('');
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

  it('reports an uncalibrated camera as absent rather than as a failure', async () => {
    // The safe reading of a failure is to stop, which is the wrong response to nobody having
    // calibrated this camera yet. Absence is reported the way `profileFor` reports it.
    const Extension = await enabledExtension();
    new Extension();
    const capability = runtime[runtimeCapabilityKey] as {
      assessProfile(cameraId: string): unknown;
      profileFor(cameraId: string): unknown;
    };
    expect(capability.assessProfile('ghost')).toBeUndefined();
    expect(capability.profileFor('ghost')).toBeUndefined();
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

describe('withholding intrinsics that do not fit', () => {
  /**
   * The same question asked of both surfaces.
   *
   * The block path used to apply the rule itself while the runtime capability handed back the whole
   * assessment, so an extension reading `profile.intrinsics` got numbers the blocks would have
   * refused. Consumer extensions are the ones that project with these, which made the unguarded
   * surface the one that mattered.
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

  it('gives neither surface numbers while the camera is not running', async () => {
    const Extension = await enabledExtension();
    const extension = new Extension() as {
      registerCameraProfile(args: {PROFILE_JSON: string}): void;
      cameraProfileIntrinsicsJson(args: {CAMERA_ID: string}): string;
    };
    const source = document('full.json');
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});
    const cameraId = source.cameraId as string;

    const capability = runtime[runtimeCapabilityKey] as {
      intrinsicsFor(cameraId: string): unknown;
      assessProfile(cameraId: string): {usable?: unknown; profile: unknown} | undefined;
    };
    const assessed = capability.assessProfile(cameraId);

    // No frame has arrived, so compatibility cannot be settled and nothing may be used.
    expect(extension.cameraProfileIntrinsicsJson({CAMERA_ID: cameraId})).toBe('');
    expect(capability.intrinsicsFor(cameraId)).toBeUndefined();
    expect(assessed?.usable).toBeUndefined();
  });

  it('still shows the stored profile so an operator can see why', async () => {
    const Extension = await enabledExtension();
    const extension = new Extension() as {
      registerCameraProfile(args: {PROFILE_JSON: string}): void;
    };
    const source = document('full.json');
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});

    // Refusing to hand over usable numbers must not also hide what is held: the document and the
    // reasons are what an operator needs to act on.
    const capability = runtime[runtimeCapabilityKey] as {
      assessProfile(
        cameraId: string
      ): {profile: {profileId: string}; compatibility: {state: string}} | undefined;
    };
    const assessed = capability.assessProfile(source.cameraId as string);
    expect(assessed?.profile.profileId).toBe(source.profileId);
    expect(assessed?.compatibility.state).toBe('undetermined');
  });
});

describe('reusing an assessment', () => {
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

  it('answers with the same view while nothing it depends on has changed', async () => {
    const Extension = await enabledExtension();
    const extension = new Extension() as {registerCameraProfile(a: {PROFILE_JSON: string}): void};
    const source = document('full.json');
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});
    const cameraId = source.cameraId as string;

    // These reporters are read from blocks a project can evaluate on every frame, and judging
    // compatibility builds a finding per compared member. The conditions are still read each time;
    // it is the derivation that is reused.
    const capability = runtime[runtimeCapabilityKey] as {
      assessProfile(cameraId: string): unknown;
    };
    const first = capability.assessProfile(cameraId);
    expect(first).toBeDefined();
    expect(capability.assessProfile(cameraId)).toBe(first);
  });

  it('derives again once the profile is replaced', async () => {
    const Extension = await enabledExtension();
    const extension = new Extension() as {registerCameraProfile(a: {PROFILE_JSON: string}): void};
    const source = document('full.json');
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});
    const cameraId = source.cameraId as string;
    const capability = runtime[runtimeCapabilityKey] as {
      assessProfile(cameraId: string): unknown;
    };
    const first = capability.assessProfile(cameraId);
    expect(first).toBeDefined();

    // Registered again under the same id: a document may differ in every member but the name, so
    // the reuse is keyed on the stored object rather than on its id.
    extension.registerCameraProfile({PROFILE_JSON: JSON.stringify(source)});
    expect(capability.assessProfile(cameraId)).not.toBe(first);
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

