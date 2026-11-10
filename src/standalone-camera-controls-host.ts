import {getRuntimeControlsDock} from '@kubohiroya/turbowarp-app-shell';
import type {CameraControlsHost} from './camera-controls-host.js';

type Provider = Parameters<CameraControlsHost['registerProvider']>[0] & {
  visible: boolean;
  running: boolean;
};

/** A host adapter for packaged HTML, independent of the player's optional control bar. */
const host = '[data-camera-source-entry-host]';
/**
 * Panel colors follow the host theme: TurboWarp publishes its resolved light/dark/auto palette as CSS
 * custom properties on the root element; other hosts fall back to prefers-color-scheme defaults.
 */
export const cameraPanelStyle = `${host} {
--camera-panel-fallback-bg:#fff;--camera-panel-fallback-fg:#25354a;--camera-panel-fallback-border:#617184;
--camera-panel-fallback-input:#fff;--camera-panel-fallback-muted:#575e75;--camera-panel-fallback-accent:#4c97ff;
--camera-panel-fallback-shadow:#0004;--camera-panel-fallback-scheme:light;
--camera-panel-bg:var(--ui-modal-background, var(--ui-primary, var(--camera-panel-fallback-bg)));
--camera-panel-fg:var(--ui-modal-foreground, var(--text-primary, var(--camera-panel-fallback-fg)));
--camera-panel-border:var(--ui-black-transparent, var(--camera-panel-fallback-border));
--camera-panel-input:var(--input-background, var(--ui-secondary, var(--camera-panel-fallback-input)));
--camera-panel-button:var(--ui-tertiary, var(--camera-panel-input));
--camera-panel-muted:var(--text-primary, var(--camera-panel-fallback-muted));
--camera-panel-accent:var(--looks-secondary, var(--link-color, var(--camera-panel-fallback-accent)));
color-scheme:var(--color-scheme, var(--camera-panel-fallback-scheme));
color:var(--camera-panel-fg)}
@media (prefers-color-scheme: dark) {${host} {
--camera-panel-fallback-bg:#1e1e1e;--camera-panel-fallback-fg:#e6e6e6;--camera-panel-fallback-border:#5a5f6b;
--camera-panel-fallback-input:#2a2a2a;--camera-panel-fallback-muted:#b8bcc6;--camera-panel-fallback-accent:#7aa9ff;
--camera-panel-fallback-shadow:#000a;--camera-panel-fallback-scheme:dark}}
${host} [data-camera-source-panel] {background:var(--camera-panel-bg);color:var(--camera-panel-fg);border:1px solid var(--camera-panel-border);box-shadow:0 4px 16px var(--camera-panel-fallback-shadow);color-scheme:inherit}
${host} [data-camera-source-panel] > div:first-child {color:var(--camera-panel-fg)}
${host} [data-camera-source-panel] > select {border:1px solid var(--camera-panel-border);background:var(--camera-panel-input);color:var(--camera-panel-fg)}
${host} option {background:var(--camera-panel-input);color:var(--camera-panel-fg)}
${host} [data-camera-source-settings] {display:flex;flex-direction:column;gap:12px}
${host} [data-camera-source-settings] p {margin:0;color:var(--camera-panel-muted)}
${host} [data-camera-source-settings] label {display:flex;flex-direction:column;gap:4px}
${host} [data-camera-source-settings] select,
${host} [data-camera-source-settings] input,
${host} [data-camera-source-settings] button {min-height:36px;padding:6px 12px;border:1px solid var(--camera-panel-border);border-radius:6px;background:var(--camera-panel-input);color:var(--camera-panel-fg);font:inherit}
${host} [data-camera-source-settings] button {background:var(--camera-panel-button);cursor:pointer}
${host} [data-camera-source-settings] button[aria-pressed="true"] {border-color:var(--camera-panel-accent);box-shadow:inset 0 0 0 1px var(--camera-panel-accent)}
${host} [data-camera-source-settings] button:hover:not(:disabled) {border-color:var(--camera-panel-accent)}
${host} [data-camera-source-settings] [hidden] {display:none}
${host} [data-camera-source-panel-close] {background:transparent;color:inherit}
${host} [data-camera-source-panel-close]:hover {background:color-mix(in srgb, currentColor 12%, transparent)}
${host} button:focus-visible,
${host} select:focus-visible,
${host} input:focus-visible {outline:2px solid var(--camera-panel-accent);outline-offset:1px}`;

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
    borderRadius: '6px',
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
      borderRadius: '8px',
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
    const dismissLabel = ja ? '閉じる' : 'Close';
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.setAttribute('data-camera-source-panel-close', '');
    dismiss.setAttribute('aria-label', dismissLabel);
    dismiss.setAttribute('title', dismissLabel);
    Object.assign(dismiss.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      width: '28px',
      height: '28px',
      padding: '0',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    });
    const svgNs = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(svgNs, 'svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('width', '18');
    icon.setAttribute('height', '18');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const cross = document.createElementNS(svgNs, 'path');
    cross.setAttribute('d', 'M4 4l8 8M12 4l-8 8');
    cross.setAttribute('stroke', 'currentColor');
    cross.setAttribute('stroke-width', '1.6');
    cross.setAttribute('stroke-linecap', 'round');
    cross.setAttribute('fill', 'none');
    icon.appendChild(cross);
    dismiss.appendChild(icon);
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
    style.textContent = cameraPanelStyle;
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
