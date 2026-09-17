import {afterEach, describe, expect, it, vi} from 'vitest';
import {CameraSourceExtension} from '../src/extension.js';
import {FrameTimeWatcher, frameTimeFrom} from '../src/frame-time.js';

describe('frameTimeFrom', () => {
  it('prefers the capture time and converts it to epoch microseconds', () => {
    expect(
      frameTimeFrom({captureTime: 250.5, presentationTime: 270, presentedFrames: 9}, 1_700_000_000_000, undefined)
    ).toEqual({timestampUs: 1_700_000_000_250_500, source: 'capture', presentedFrames: 9});
  });

  it('falls back to the presentation time and says so', () => {
    expect(
      frameTimeFrom({presentationTime: 270}, 1000, {timestampUs: 0, source: 'capture', presentedFrames: 4})
    ).toEqual({timestampUs: 1_270_000, source: 'presentation', presentedFrames: 5});
  });

  it('keeps the previous frame when the metadata carries no time', () => {
    const previous = {timestampUs: 1, source: 'capture', presentedFrames: 1} as const;
    expect(frameTimeFrom({}, 1000, previous)).toBe(previous);
  });
});

function frameElement() {
  const callbacks: VideoFrameRequestCallback[] = [];
  let next = 0;
  const element = {
    requestVideoFrameCallback: vi.fn((callback: VideoFrameRequestCallback) => {
      callbacks.push(callback);
      return ++next;
    }),
    cancelVideoFrameCallback: vi.fn()
  };
  const present = (metadata: Record<string, number>) =>
    callbacks.shift()?.(0, metadata as unknown as VideoFrameCallbackMetadata);
  return {element, present};
}

describe('FrameTimeWatcher', () => {
  it('records every presented frame and stops asking once disposed', () => {
    const {element, present} = frameElement();
    const watcher = new FrameTimeWatcher(element, 0);
    expect(watcher.latest()).toBeUndefined();
    present({captureTime: 10, presentedFrames: 1});
    present({captureTime: 43, presentedFrames: 2});
    expect(watcher.latest()).toEqual({timestampUs: 43_000, source: 'capture', presentedFrames: 2});
    watcher.dispose();
    expect(element.cancelVideoFrameCallback).toHaveBeenCalledTimes(1);
  });

  it('records nothing where the browser has no video frame callback', () => {
    const watcher = new FrameTimeWatcher({} as never, 0);
    expect(watcher.latest()).toBeUndefined();
    watcher.dispose();
  });
});

describe('frame sources', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('carry the capture time of the frame presented when they are taken', async () => {
    const {element, present} = frameElement();
    const track = {readyState: 'live', getSettings: () => ({deviceId: 'cam'}), stop: vi.fn(), addEventListener: vi.fn()};
    const stream = {active: true, getVideoTracks: () => [track], getTracks: () => [track]};
    const video = Object.assign({videoWidth: 640, videoHeight: 480, play: vi.fn(async () => undefined)}, element);
    vi.stubGlobal('Scratch', {
      vm: {runtime: {on: vi.fn()}},
      extensions: {unsandboxed: true, register: vi.fn()},
      Cast: {toString: String, toNumber: Number, toBoolean: Boolean},
      translate: (message: string) => message
    });
    vi.stubGlobal('navigator', {mediaDevices: {getUserMedia: vi.fn(async () => stream), enumerateDevices: vi.fn()}});
    vi.stubGlobal('document', {createElement: vi.fn(() => video)});
    vi.stubGlobal('performance', {timeOrigin: 1_000, now: () => 0});

    const extension = new CameraSourceExtension();
    const lease = await extension.acquireCamera({cameraId: 'cam-1'});
    expect(lease.getFrameSource().frameTime).toBeUndefined();

    present({captureTime: 5, presentedFrames: 7});
    expect(lease.getFrameSource().frameTime).toEqual({timestampUs: 1_005_000, source: 'capture', presentedFrames: 7});

    await lease.release();
    expect(element.cancelVideoFrameCallback).toHaveBeenCalled();
  });
});
