import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCameraControls} from '../src/camera-controls.js';
import {CameraSourceExtension} from '../src/extension.js';
import {requestUserMedia} from '../src/user-media.js';
import type {CameraControlsHost} from '../src/camera-controls-host.js';

class Element extends EventTarget {
  children: Element[] = [];
  style = {};
  textContent = '';
  value = '';
  hidden = false;
  disabled = false;
  attributes = new Map<string, string>();
  stream: unknown;
  error: unknown;
  constraints: unknown;
  removed = false;
  readyState = 2;
  play = vi.fn(async () => {});
  append(...elements: Element[]) { this.children.push(...elements); }
  appendChild(element: Element) { this.children.push(element); }
  replaceChildren() { this.children = []; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  setConstraints(value: unknown) { this.constraints = value; }
  remove() { this.removed = true; }
}
function fixture() {
  const document = {documentElement: {lang: 'ja'}, createElement: () => new Element()} as unknown as Document;
  const providers: Parameters<CameraControlsHost['registerProvider']>[0][] = [];
  const update = vi.fn();
  const dispose = vi.fn();
  const host: CameraControlsHost = {registerProvider(options) { providers.push(options); return {update, dispose}; }};
  return {document, providers, update, dispose, host};
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('shared camera controls', () => {
  it('requires an explicit start offer and uses the native element without stage placement', async () => {
    const f = fixture();
    const request = requestUserMedia({document: f.document, cameraControls: f.host, cameraId: 'pose', label: '許可'});
    const native = f.providers[0]!.element as Element;
    expect(f.providers[0]!.kind).toBe('permission');
    expect(native.style).toEqual({});
    expect(native.constraints).toEqual({video: {}});
    const stream = {getTracks: () => []};
    native.stream = stream;
    native.dispatchEvent(new Event('stream'));
    expect(await request.settled).toEqual({kind: 'stream', stream});
    expect(f.dispose).toHaveBeenCalledTimes(1);
    request.dismiss();
    expect(f.dispose).toHaveBeenCalledTimes(1);
  });

  it('moves device selection and mirroring UI into Camera Source and releases listeners and timers', async () => {
    vi.useFakeTimers();
    const f = fixture();
    let running = false;
    const requestStart = vi.fn(async () => {});
    const selectCamera = vi.fn(async () => {});
    const setPreviewMirroring = vi.fn(async () => {});
    const control = createCameraControls({...f, owner: 'app', cameraId: 'pose', requestStart,
      port: {isCameraRunning: () => running, listCameraDevices: async () => [{deviceId: 'b', label: 'カメラB'}],
        selectCamera, getCameraSelection: () => ({deviceId: 'b'}), setPreviewMirroring}});
    expect(requestStart).not.toHaveBeenCalled();
    expect(f.providers[0]!.visible).toBe(false);
    control.start();
    await f.providers[0]!.onStart!();
    expect(requestStart).toHaveBeenCalledTimes(1);
    running = true;
    control.refresh();
    await f.providers[0]!.onOpen!();
    const root = control.element as unknown as Element;
    const select = root.children[1]!.children[0]!;
    const mirror = root.children[2]!;
    expect(select.value).toBe('device:0');
    select.value = 'front'; select.dispatchEvent(new Event('change')); await settle();
    expect(selectCamera).toHaveBeenCalledWith('front');
    mirror.dispatchEvent(new Event('click')); await settle();
    expect(setPreviewMirroring).toHaveBeenCalledWith('unmirrored');
    expect(mirror.textContent).toBe('左右反転：オフ');
    control.stop();
    expect(f.update).toHaveBeenLastCalledWith({visible: false});
    control.dispose(); control.dispose();
    mirror.dispatchEvent(new Event('click')); await settle();
    expect(setPreviewMirroring).toHaveBeenCalledTimes(1);
    expect(f.dispose).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('discards a device list completed after the panel closed and retains operation errors', async () => {
    vi.useFakeTimers();
    const f = fixture();
    let resolve!: (value: unknown) => void;
    const pending = new Promise(done => { resolve = done; });
    const control = createCameraControls({...f, owner: 'app', requestStart: async () => {}, port: {
      isCameraRunning: () => true, listCameraDevices: () => pending,
      selectCamera: async () => { throw new Error('カメラを変更できません'); }
    }});
    control.start();
    const opened = f.providers[0]!.onOpen!();
    f.providers[0]!.onClose!();
    resolve([{deviceId: 'late'}]); await opened;
    const root = control.element as unknown as Element;
    const select = root.children[1]!.children[0]!;
    expect(select.children).toHaveLength(0);
    await f.providers[0]!.onOpen!();
    select.value = 'front'; select.dispatchEvent(new Event('change')); await settle();
    vi.advanceTimersByTime(500);
    expect(root.children[0]!.textContent).toBe('カメラを変更できません');
    control.dispose();
  });

  it('cancel removes the permission provider and resolves without creating another request', async () => {
    const f = fixture();
    const request = requestUserMedia({document: f.document, cameraControls: f.host, label: '許可'});
    (f.providers[0]!.element as Element).dispatchEvent(new Event('cancel'));
    expect(await request.settled).toEqual({kind: 'cancelled'});
    expect(f.providers).toHaveLength(1);
    expect(f.dispose).toHaveBeenCalledTimes(1);
  });
});

it('a layout-validation error preserves the native element for a later real click', async () => {
  const f = fixture();
  const request = requestUserMedia({document: f.document, cameraControls: f.host, label: '許可'});
  const native = f.providers[0]!.element as Element;
  native.error = new DOMException('Layout validation is pending', 'InvalidStateError');
  native.dispatchEvent(new Event('error'));
  expect(f.dispose).not.toHaveBeenCalled();
  const stream = {getTracks: () => []};
  native.stream = stream;
  native.dispatchEvent(new Event('stream'));
  expect(await request.settled).toEqual({kind: 'stream', stream});
  expect(f.dispose).toHaveBeenCalledTimes(1);
});

// #59: the element answers with a microphone as well as a camera, and no constraint can ask it not
// to. The track is stopped and taken out of the stream before any consumer is handed it.
it('stops and removes the microphone before the stream leaves the element', async () => {
  const f = fixture();
  const request = requestUserMedia({document: f.document, cameraControls: f.host, label: '許可'});
  const native = f.providers[0]!.element as Element;
  const audioStop = vi.fn();
  const videoStop = vi.fn();
  let tracks = [{kind: 'audio', stop: audioStop}, {kind: 'video', stop: videoStop}] as unknown as MediaStreamTrack[];
  native.stream = {
    getTracks: () => tracks,
    getAudioTracks: () => tracks.filter((track) => track.kind === 'audio'),
    getVideoTracks: () => tracks.filter((track) => track.kind === 'video'),
    removeTrack: (track: MediaStreamTrack) => { tracks = tracks.filter((kept) => kept !== track); }
  };
  native.dispatchEvent(new Event('stream'));
  const outcome = await request.settled;

  expect(outcome.kind).toBe('stream');
  const shared = (outcome as Extract<typeof outcome, {kind: 'stream'}>).stream;
  expect(shared.getAudioTracks()).toEqual([]);
  expect(audioStop).toHaveBeenCalledOnce();
  expect(shared.getVideoTracks()).toHaveLength(1);
  expect(videoStop).not.toHaveBeenCalled();
});

it('reads terminal camera errors from the native element', async () => {
  const f = fixture();
  const request = requestUserMedia({document: f.document, cameraControls: f.host, label: '許可'});
  const native = f.providers[0]!.element as Element;
  native.error = new DOMException('Camera is unavailable', 'NotReadableError');
  native.dispatchEvent(new Event('error'));
  expect(await request.settled).toEqual({kind: 'error', code: 'NotReadableError', message: 'Camera is unavailable'});
});


function extensionFixture() {
  vi.useFakeTimers();
  const f = fixture();
  const translate = Object.assign((text: string) => text, {language: 'ja'});
  vi.stubGlobal('Scratch', {gui: {cameraControls: f.host}, vm: {runtime: {}}, translate,
    extensions: {unsandboxed: true}, BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'}, Cast: {toString: String, toBoolean: Boolean, toNumber: Number}});
  vi.stubGlobal('document', f.document);
  vi.stubGlobal('HTMLUserMediaElement', class {});
  vi.stubGlobal('BroadcastChannel', undefined);
  const stopped = vi.fn();
  const track = {readyState: 'live', getSettings: () => ({deviceId: 'a'}), stop: stopped, addEventListener() {}};
  const stream = {active: true, getTracks: () => [track], getVideoTracks: () => [track]} as unknown as MediaStream;
  const extension = new CameraSourceExtension();
  return {...f, stream, stopped, extension};
}

it('disposal releases the controller lease and stops only the stream requested by that controller', async () => {
  const f = extensionFixture();
  const controller = f.extension.registerCameraControls({owner: 'app', cameraId: 'pose'})!;
  controller.start();
  const starting = f.providers[0]!.onStart!();
  const native = f.providers[1]!.element as Element;
  native.stream = f.stream; native.dispatchEvent(new Event('stream'));
  await starting;
  expect(f.extension.isCameraRunning({CAMERA_ID: 'pose'})).toBe(true);
  controller.dispose(); controller.dispose();
  expect(f.stopped).toHaveBeenCalledTimes(1);
  f.extension.dispose();
  expect(vi.getTimerCount()).toBe(0);
});

it('a controller joining an existing external stream does not request or stop it', async () => {
  const f = extensionFixture();
  const external = await f.extension.adoptCamera({owner: 'external', cameraId: 'pose', stream: f.stream});
  const controller = f.extension.registerCameraControls({owner: 'app', cameraId: 'pose'})!;
  controller.start();
  await f.providers[0]!.onStart!();
  expect(f.providers).toHaveLength(1);
  controller.dispose();
  expect(f.stopped).not.toHaveBeenCalled();
  await external.release(); f.extension.dispose();
  expect(f.stopped).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
