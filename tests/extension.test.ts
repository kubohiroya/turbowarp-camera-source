import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension} from '../src/extension.js';

function scratch() {
  return {
    vm: {runtime: {}},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    translate: (message: string) => message
  };
}

function stream(deviceId: string) {
  const stop = vi.fn();
  return {
    getVideoTracks: () => [{getSettings: () => ({deviceId})}],
    getTracks: () => [{stop}]
  } as unknown as MediaStream & {stop: ReturnType<typeof vi.fn>};
}

function video() {
  return {
    muted: false,
    playsInline: false,
    srcObject: null,
    videoWidth: 640,
    videoHeight: 480,
    play: vi.fn(async () => undefined)
  } as unknown as HTMLVideoElement;
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
    expect(extension.cameraDeviceIdReporter()).toBe('');
  });

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
