import type {CameraControlsHost} from './camera-controls-host.js';

/** A consumer may supply preview-specific behavior without moving its presentation policy here. */
export interface CameraSettingsPort {
  isCameraRunning(): boolean;
  listCameraDevices?(): unknown | Promise<unknown>;
  selectCamera?(selection: unknown): unknown | Promise<unknown>;
  getCameraSelection?(): unknown;
  getActiveCamera?(): unknown;
  setPreviewMirroring?(mode: string): unknown | Promise<unknown>;
}
export interface CameraControlsOptions {
  owner: string;
  cameraId?: string;
  port?: CameraSettingsPort;
  labels?: Readonly<Record<string, string>>;
  mirroring?: string;
  locale?: string;
}

/** Camera UI shared by all consumers; the GUI only supplies the entry and panel location. */
export function createCameraControls(options: CameraControlsOptions & {
  document: Document;
  host: CameraControlsHost;
  port: CameraSettingsPort;
  requestStart(): Promise<unknown>;
}) {
  const ja = /^ja(?:-|$)/iu.test(options.locale || options.document.documentElement?.lang || globalThis.navigator?.language || '');
  const labels = {
    permission: ja ? 'カメラの許可・開始を待っています。' : 'Waiting to enable the camera.',
    running: ja ? 'カメラは起動しています。' : 'The camera is running.',
    select: ja ? '使用するカメラ' : 'Camera device',
    default: ja ? '既定のカメラ' : 'Default camera',
    front: ja ? '前面カメラ' : 'Front camera',
    back: ja ? '背面カメラ' : 'Back camera',
    mirror: ja ? '左右反転' : 'Mirror preview',
    mirrored: ja ? '左右反転：オン' : 'Mirroring: on',
    unmirrored: ja ? '左右反転：オフ' : 'Mirroring: off',
    ...options.labels
  };
  const panel = options.document.createElement('div');
  panel.setAttribute('data-camera-source-settings', 'true');
  const status = options.document.createElement('p');
  const label = options.document.createElement('label');
  label.textContent = labels.select;
  const select = options.document.createElement('select');
  select.setAttribute('aria-label', labels.select);
  label.appendChild(select);
  const mirror = options.document.createElement('button');
  mirror.type = 'button';
  mirror.setAttribute('aria-label', labels.mirror);
  panel.append(status, label, mirror);
  let enabled = false;
  let disposed = false;
  let generation = 0;
  let mirroring = options.mirroring === 'unmirrored' ? 'unmirrored' : 'mirrored';
  let selectionTokens = new Map<string, unknown>();
  let failureMessage = '';
  const error = (failure: unknown) => {
    failureMessage = failure instanceof Error ? failure.message : String(failure);
    status.textContent = failureMessage;
  };
  const renderMirror = () => {
    mirror.textContent = mirroring === 'mirrored' ? labels.mirrored : labels.unmirrored;
    mirror.setAttribute('aria-pressed', String(mirroring === 'mirrored'));
  };
  const refresh = () => {
    if (disposed) return;
    const running = options.port.isCameraRunning();
    registration.update({visible: enabled, running});
    status.textContent = failureMessage || (running ? labels.running : labels.permission);
    label.hidden = !running || !options.port.selectCamera || !options.port.listCameraDevices;
    mirror.hidden = !running || !options.port.setPreviewMirroring;
    renderMirror();
  };
  const open = async () => {
    failureMessage = '';
    const revision = ++generation;
    refresh();
    if (!options.port.isCameraRunning() || !options.port.listCameraDevices || !options.port.selectCamera) return;
    select.disabled = true;
    try {
      const devices = await options.port.listCameraDevices();
      if (disposed || revision !== generation) return;
      const tokens = new Map<string, unknown>();
      select.replaceChildren();
      const append = (token: string, text: string, value: unknown) => {
        const option = options.document.createElement('option');
        option.value = token;
        option.textContent = text;
        select.appendChild(option);
        tokens.set(token, value);
      };
      for (const preference of ['default', 'front', 'back'] as const) append(preference, labels[preference], preference);
      if (Array.isArray(devices)) devices.forEach((device: {deviceId?: string; label?: string}, index) => {
        if (device.deviceId) append(`device:${index}`, device.label || `${ja ? 'カメラ' : 'Camera'} ${index + 1}`, {deviceId: device.deviceId});
      });
      const active = options.port.getActiveCamera?.() as {deviceId?: string; label?: string} | null;
      if (active?.deviceId && !Array.from(tokens.values()).some(value =>
        typeof value === 'object' && value && (value as {deviceId?: string}).deviceId === active.deviceId)) {
        append('device:current', active.label || (ja ? '現在のカメラ' : 'Current camera'), {deviceId: active.deviceId});
      }
      selectionTokens = tokens;
      const selected = options.port.getCameraSelection?.();
      const deviceId = typeof selected === 'object' && selected ? (selected as {deviceId?: string}).deviceId : null;
      select.value = Array.from(tokens).find(([, value]) => value === selected ||
        (deviceId && typeof value === 'object' && value && (value as {deviceId?: string}).deviceId === deviceId))?.[0] || 'default';
    } catch (failure) { error(failure); }
    finally { if (!disposed && revision === generation) select.disabled = false; }
  };
  const registration = options.host.registerProvider({
    id: `camera-source-settings:${options.owner}`,
    cameraId: options.cameraId || 'default',
    visible: false, kind: 'settings', element: panel, running: options.port.isCameraRunning(),
    onOpen: open,
    onClose: () => { generation++; },
    onStart: async () => {
      failureMessage = '';
      try { await options.requestStart(); refresh(); } catch (failure) { error(failure); }
    }
  });
  const handleSelection = async () => {
    if (disposed || !enabled || !selectionTokens.has(select.value)) return;
    failureMessage = '';
    const revision = generation;
    select.disabled = true;
    try { await options.port.selectCamera?.(selectionTokens.get(select.value)); }
    catch (failure) { error(failure); }
    finally { if (!disposed && revision === generation) select.disabled = false; }
  };
  const handleMirror = async () => {
    if (disposed || !enabled) return;
    failureMessage = '';
    mirror.disabled = true;
    const next = mirroring === 'mirrored' ? 'unmirrored' : 'mirrored';
    try { await options.port.setPreviewMirroring?.(next); mirroring = next; renderMirror(); }
    catch (failure) { error(failure); }
    finally { if (!disposed) mirror.disabled = false; }
  };
  select.addEventListener('change', handleSelection);
  mirror.addEventListener('click', handleMirror);
  const timer = setInterval(refresh, 100);
  refresh();
  return {
    element: panel,
    start() { enabled = true; refresh(); },
    stop() { enabled = false; generation++; registration.update({visible: false}); },
    refresh,
    setMirroring(mode: unknown) { if (mode === 'mirrored' || mode === 'unmirrored') { mirroring = mode; renderMirror(); } },
    dispose() {
      if (disposed) return;
      disposed = true; generation++; clearInterval(timer);
      registration.dispose(); panel.remove();
      select.removeEventListener('change', handleSelection);
      mirror.removeEventListener('click', handleMirror);
    }
  };
}
