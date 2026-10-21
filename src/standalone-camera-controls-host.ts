import {getRuntimeControlsDock} from '@kubohiroya/turbowarp-app-shell';
import type {CameraControlsHost} from './camera-controls-host.js';

type Provider = Parameters<CameraControlsHost['registerProvider']>[0] & {
  visible: boolean;
  running: boolean;
};

/** A host adapter for packaged HTML, independent of the player's optional control bar. */
export function createStandaloneCameraControlsHost(document: Document, locale: string) {
  const ja = /^ja(?:-|$)/iu.test(locale);
  const label = ja ? 'カメラ' : 'Camera';
  const dock = getRuntimeControlsDock({document, locale});
  let dockButton: ReturnType<typeof dock.stageControls.addButton> | null = null;
  let unsubscribeDock: (() => void) | null = null;
  const providers = new Map<string, Provider>();
  let root: HTMLDivElement | null = null;
  let panel: HTMLDivElement;
  let chooser: HTMLSelectElement;
  let content: HTMLDivElement;
  let mounted: Provider | null = null;
  let mountedRunning = false;
  let cameraId = '';
  let open = false;
  let disposed = false;

  const detachContent = () => {
    const previous = mounted;
    mounted = null;
    try {
      previous?.onClose?.();
    } finally {
      if (previous && (previous.element as Node).parentNode === content)
        content.removeChild(previous.element as Node);
    }
  };
  const close = (focus = false) => {
    open = false;
    render();
    if (focus) dockButton?.focus();
  };
  const onKey = (event: KeyboardEvent) => {
    if (open && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  };
  const onPointer = (event: PointerEvent) => {
    if (
      open &&
      root &&
      !root.contains(event.target as Node) &&
      !(event.target as Element).closest?.('[data-runtime-dock-control="camera"]')
    )
      close();
  };
  const onFullscreen = () => {
    if (root) (document.fullscreenElement || document.body).appendChild(root);
  };
  const removeRoot = () => {
    detachContent();
    root?.remove();
    root = null;
    unsubscribeDock?.();
    unsubscribeDock = null;
    dockButton?.dispose();
    dockButton = null;
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('fullscreenchange', onFullscreen);
  };
  const selectProvider = (visible: Provider[]) => {
    const candidates = visible.filter((provider) => provider.cameraId === cameraId);
    return (
      candidates.filter((provider) => provider.kind === 'settings' && provider.running).at(-1) ||
      candidates.find((provider) => provider.kind === 'permission') ||
      candidates.at(-1)
    );
  };
  const buttonStyle = {
    minHeight: '36px',
    padding: '6px 12px',
    border: '1px solid #617184',
    borderRadius: '6px',
    background: '#fff',
    color: '#25354a',
    font: 'inherit',
    cursor: 'pointer',
  };
  const createRoot = () => {
    root = document.createElement('div');
    root.setAttribute('data-camera-source-entry-host', 'standalone');
    Object.assign(root.style, {
      position: 'fixed',
      right: 'auto',
      bottom: 'auto',
      width: '320px',
      zIndex: '2147483647',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      color: '#25354a',
      font: '14px/1.5 sans-serif',
      maxWidth: 'calc(100vw - 32px)',
    });
    panel = document.createElement('div');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', label);
    panel.setAttribute('data-camera-source-panel', 'standalone');
    Object.assign(panel.style, {
      boxSizing: 'border-box',
      width: '320px',
      maxWidth: '100%',
      maxHeight: 'calc(100vh - 96px)',
      overflowY: 'auto',
      padding: '16px',
      border: '1px solid #617184',
      borderRadius: '8px',
      background: '#fff',
      boxShadow: '0 4px 16px #0004',
    });
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    });
    const title = document.createElement('strong');
    title.textContent = label;
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = '×';
    dismiss.setAttribute('aria-label', ja ? '閉じる' : 'Close');
    Object.assign(dismiss.style, buttonStyle);
    dismiss.addEventListener('click', () => close(true));
    header.append(title, dismiss);
    chooser = document.createElement('select');
    chooser.setAttribute('aria-label', ja ? 'カメラID' : 'Camera ID');
    Object.assign(chooser.style, {...buttonStyle, width: '100%', marginBottom: '8px'});
    chooser.addEventListener('change', () => {
      cameraId = chooser.value;
      render();
    });
    content = document.createElement('div');
    panel.append(header, chooser, content);
    dockButton = dock.stageControls.addButton({
      id: 'camera',
      label,
      text: label,
      icon: '📷',
      onClick: () => {
        const starting = !open
          ? selectProvider([...providers.values()].filter((provider) => provider.visible))
          : null;
        open = !open;
        render();
        if (starting?.kind === 'settings' && !starting.running) {
          Promise.resolve()
            .then(() => starting.onStart?.())
            .catch(() => {});
        }
      },
    });
    dockButton.update({visible: true});
    unsubscribeDock = dock.subscribe(() => {
      if (open && root) dock.placePanel(root);
    });
    const style = document.createElement('style');
    style.textContent = `[data-camera-source-entry-host] [data-camera-source-settings] {display:flex;flex-direction:column;gap:12px}
[data-camera-source-entry-host] [data-camera-source-settings] p {margin:0}
[data-camera-source-entry-host] [data-camera-source-settings] label {display:flex;flex-direction:column;gap:4px}
[data-camera-source-entry-host] [data-camera-source-settings] select,
[data-camera-source-entry-host] [data-camera-source-settings] button {min-height:36px;padding:6px 12px;border:1px solid #617184;border-radius:6px;background:#fff;color:#25354a;font:inherit}
[data-camera-source-entry-host] [data-camera-source-settings] [hidden] {display:none}`;
    root.append(style, panel);
    (document.fullscreenElement || document.body).appendChild(root);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('fullscreenchange', onFullscreen);
  };

  function render() {
    if (disposed) return;
    const visible = [...providers.values()].filter((provider) => provider.visible);
    const ids = [...new Set(visible.map((provider) => provider.cameraId))];
    if (!ids.includes(cameraId)) cameraId = ids[0] || '';
    if (!visible.length) {
      open = false;
      removeRoot();
      return;
    }
    if (!root) createRoot();
    const selected = selectProvider(visible)!;
    dockButton?.update({expanded: open});
    panel.hidden = !open;
    if (open && root) dock.placePanel(root);
    chooser.hidden = ids.length < 2;
    chooser.replaceChildren(
      ...ids.map((id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        return option;
      }),
    );
    chooser.value = cameraId;
    panel.setAttribute(
      'data-camera-mode',
      selected.kind === 'permission' || !selected.running ? 'permission' : 'settings',
    );
    if (!open) {
      detachContent();
      return;
    }
    if (mounted !== selected || mountedRunning !== selected.running) {
      detachContent();
      mounted = selected;
      mountedRunning = selected.running;
      content.appendChild(selected.element as Node);
      Promise.resolve()
        .then(() => {
          if (mounted === selected && open) return selected.onOpen?.();
        })
        .catch(() => {});
      if (root) dock.placePanel(root);
    }
  }

  const host: CameraControlsHost = {
    registerProvider(options) {
      if (disposed) throw new Error('The standalone camera host has been disposed');
      const provider: Provider = {
        ...options,
        visible: options.visible !== false,
        running: options.running === true,
      };
      providers.set(options.id, provider);
      render();
      return {
        update(state) {
          if (providers.get(options.id) !== provider) return;
          let changed = false;
          for (const key of ['visible', 'running'] as const) {
            if (typeof state[key] === 'boolean' && provider[key] !== state[key]) {
              provider[key] = state[key];
              changed = true;
            }
          }
          if (changed) render();
        },
        dispose() {
          if (providers.get(options.id) !== provider) return;
          providers.delete(options.id);
          render();
        },
      };
    },
  };
  return {
    host,
    dispose() {
      if (disposed) return;
      disposed = true;
      providers.clear();
      open = false;
      removeRoot();
    },
  };
}
