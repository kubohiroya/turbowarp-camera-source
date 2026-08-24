import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension} from '../src/extension.js';

function scratch() {
  return {
    vm: {runtime: {}},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    translate: (message: string) => message
  };
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
    expect(info.blocks.map((block) => block.text)).toContain('shared camera is running?');
    expect(extension.isCameraRunning()).toBe(false);
    expect(extension.cameraDeviceIdReporter()).toBe('');
  });
});
