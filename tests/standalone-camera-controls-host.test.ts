import {describe, expect, it, vi} from 'vitest';
import {createStandaloneCameraControlsHost} from '../src/standalone-camera-controls-host.js';

const dock = vi.hoisted(() => ({onClick: null as null | (() => unknown),
  update: vi.fn(), focus: vi.fn(), dispose: vi.fn(), placePanel: vi.fn()}));
vi.mock('@kubohiroya/turbowarp-app-shell', () => ({getRuntimeControlsDock: () => ({
  stageControls: {addButton: (options: {onClick(): unknown}) => {
    dock.onClick = options.onClick; return {update: dock.update, focus: dock.focus, dispose: dock.dispose};
  }}, placePanel: dock.placePanel, subscribe: () => () => {}
})}));

class Element extends EventTarget {
  children: Element[] = [];
  parentNode: Element | null = null;
  style = {};
  attributes = new Map<string, string>();
  hidden = false;
  textContent = '';
  value = '';
  focused = false;
  append(...children: Element[]) { for (const child of children) this.appendChild(child); }
  appendChild(child: Element) { child.remove(); child.parentNode = this; this.children.push(child); return child; }
  removeChild(child: Element) { this.children = this.children.filter(value => value !== child); child.parentNode = null; }
  remove() { this.parentNode?.removeChild(this); }
  replaceChildren(...children: Element[]) { for (const child of [...this.children]) child.remove(); this.append(...children); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  contains(child: Element): boolean { return this === child || this.children.some(value => value.contains(child)); }
  focus() { this.focused = true; }
  click() { this.dispatchEvent(new Event('click')); }
}
class Document extends EventTarget {
  body = new Element();
  fullscreenElement: Element | null = null;
  createElement() { return new Element(); }
}
const find = (root: Element, attribute: string): Element | undefined => root.attributes.has(attribute) ? root : root.children.map(child => find(child, attribute)).find(Boolean);
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

describe('packaged HTML camera entry', () => {
  it('creates one entry only when visible, opens settings and removes all DOM on disposal', async () => {
    const document = new Document();
    const adapter = createStandaloneCameraControlsHost(document as unknown as globalThis.Document, 'ja');
    const element = new Element();
    const onOpen = vi.fn(); const onClose = vi.fn();
    const settings = adapter.host.registerProvider({id: 'settings', cameraId: 'pose', kind: 'settings', element,
      visible: false, running: true, onOpen, onClose});
    expect(document.body.children).toHaveLength(0);
    settings.update({visible: true});
    const root = document.body.children[0]!;
    const entry = {click: () => dock.onClick!()};
    const panel = find(root, 'data-camera-source-panel')!;
    expect(panel.hidden).toBe(true); expect(onOpen).not.toHaveBeenCalled();
    entry.click(); await settle();
    expect(panel.contains(element)).toBe(true); expect(onOpen).toHaveBeenCalledTimes(1);
    const escape = new Event('keydown', {cancelable: true}); Object.assign(escape, {key: 'Escape'});
    document.dispatchEvent(escape);
    expect(panel.hidden).toBe(true); expect(dock.focus).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    settings.dispose(); expect(document.body.children).toHaveLength(0);
    adapter.dispose();
  });

  it('offers permission on the entry click, without retrying when providers switch', async () => {
    const document = new Document();
    const adapter = createStandaloneCameraControlsHost(document as unknown as globalThis.Document, 'ja');
    const onStart = vi.fn();
    const settings = adapter.host.registerProvider({id: 'settings', cameraId: 'pose', kind: 'settings', element: new Element(), onStart});
    const entry = {click: () => dock.onClick!()};
    expect(onStart).not.toHaveBeenCalled(); entry.click(); await settle();
    expect(onStart).toHaveBeenCalledTimes(1);
    const native = new Element();
    const permission = adapter.host.registerProvider({id: 'permission', cameraId: 'pose', kind: 'permission', element: native});
    expect(find(document.body, 'data-camera-source-panel')!.contains(native)).toBe(true);
    permission.dispose(); await settle();
    expect(onStart).toHaveBeenCalledTimes(1);
    settings.update({running: true});
    expect(find(document.body, 'data-camera-source-panel')!.attributes.get('data-camera-mode')).toBe('settings');
    expect(document.body.children).toHaveLength(1); adapter.dispose();
  });

  it('moves its own root into fullscreen and fences stale provider handles', () => {
    const document = new Document();
    const adapter = createStandaloneCameraControlsHost(document as unknown as globalThis.Document, 'ja');
    const old = adapter.host.registerProvider({id: 'same', cameraId: 'pose', kind: 'settings', element: new Element()});
    const next = adapter.host.registerProvider({id: 'same', cameraId: 'pose', kind: 'settings', element: new Element(), running: true});
    old.dispose(); old.update({visible: false});
    expect(document.body.children).toHaveLength(1);
    document.fullscreenElement = new Element(); document.dispatchEvent(new Event('fullscreenchange'));
    expect(document.body.children).toHaveLength(0); expect(document.fullscreenElement.children).toHaveLength(1);
    next.dispose(); expect(document.fullscreenElement.children).toHaveLength(0); adapter.dispose();
  });
});
