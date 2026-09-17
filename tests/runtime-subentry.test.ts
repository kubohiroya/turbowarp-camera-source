import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import packageMetadata from '../package.json';
import * as runtimeEntry from '../src/runtime.js';
import {runtimeCapabilityKey, runtimeCapabilityVersion} from '../src/runtime-capability.js';
import {extensionConfig} from '../src/config.js';

/**
 * The surface other extensions import instead of declaring their own copy.
 *
 * A copy is checked against nothing. `turbowarp-camera-calibration` wrote its own copy of the
 * registry, named a method this extension does not have, and every attempt to publish a profile
 * failed with a version mismatch that had nothing to do with versions -- while its type-check passed
 * throughout. The entry is therefore guarded here rather than trusted to stay right.
 */
describe('the published runtime sub-entry', () => {
  it('is exposed under ./runtime, alongside the bundle and nothing else', () => {
    expect(packageMetadata.exports['./runtime']).toEqual({
      types: './dist/runtime.d.ts',
      import: './dist/runtime.js'
    });
    // No "." entry: the bundle is loaded by URL from TurboWarp rather than imported, and exposing it
    // would let one stray bare import pull the whole extension into a consumer's bundle.
    expect(Object.keys(packageMetadata.exports)).toEqual([
      './camera-source.js',
      './runtime',
      './profile',
      './package.json'
    ]);
  });

  it('publishes exactly the values a consumer is meant to reach for', () => {
    expect(Object.keys(runtimeEntry).sort()).toEqual([
      'cameraSourceCapabilityKey',
      'cameraSourceCapabilityVersion',
      'cameraSourceExtensionId',
      'cameraSourceRuntimeKey',
      'readCameraSourceCapability',
      'readCameraSourceRuntime'
    ]);
  });

  it('costs a consumer nothing beyond those values', () => {
    // The declarations are erased, so the built entry imports nothing at all. This is the property
    // that keeps a consumer from carrying the profile registry, the adaptation arithmetic, or
    // anything else this package happens to hold, merely for naming a type.
    const built = readFileSync(new URL('../dist/runtime.js', import.meta.url), 'utf8');
    expect(built).not.toMatch(/^\s*(import|export)\s[^=]*\bfrom\b/mu);
  });

  it('names one capability key, not two that agree by inspection', () => {
    // The extension publishes under runtimeCapabilityKey and a consumer reads
    // cameraSourceCapabilityKey. They were separate literals; a rename would have moved one.
    expect(runtimeCapabilityKey).toBe(runtimeEntry.cameraSourceCapabilityKey);
    expect(runtimeCapabilityVersion).toBe(runtimeEntry.cameraSourceCapabilityVersion);
  });

  it('agrees with the extension about its own identity', () => {
    expect(runtimeEntry.cameraSourceExtensionId).toBe(extensionConfig.id);
    expect(runtimeEntry.cameraSourceRuntimeKey).toBe(`ext_${extensionConfig.id}`);
  });

  it('narrows a runtime that carries the capability', () => {
    const capability = {requireVersion: () => capability, version: 1};
    expect(
      runtimeEntry.readCameraSourceCapability({
        [runtimeEntry.cameraSourceCapabilityKey]: capability
      })
    ).toBe(capability);
  });

  it('reads a withheld capability as absent rather than throwing', () => {
    // Camera Source loaded with the profile contract off looks exactly like this. It is not an
    // error, and a consumer that reported it as one would stop over an ordinary configuration.
    expect(runtimeEntry.readCameraSourceCapability({})).toBeUndefined();
    expect(runtimeEntry.readCameraSourceCapability(undefined)).toBeUndefined();
    expect(
      runtimeEntry.readCameraSourceCapability({
        [runtimeEntry.cameraSourceCapabilityKey]: {}
      })
    ).toBeUndefined();
  });

  it('separates an absent extension from one that is not offering profiles', () => {
    const runtime = {[runtimeEntry.cameraSourceRuntimeKey]: {acquireCamera: () => undefined}};
    expect(runtimeEntry.readCameraSourceRuntime(runtime)).toBeDefined();
    expect(runtimeEntry.readCameraSourceCapability(runtime)).toBeUndefined();
  });
});
