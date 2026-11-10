import {describe, expect, it, vi} from 'vitest';
import {cameraPanelStyle, createStandaloneCameraControlsHost} from '../src/standalone-camera-controls-host.js';

const dock = vi.hoisted(() => ({onClick: null as null | (() => unknown),
  update: vi.fn(), focus: vi.fn(), dispose: vi.fn(), placePanel: vi.fn()}));
vi.mock('@kubohiroya/turbowarp-app-shell', () => ({getRuntimeControlsDock: () => ({
  stageControls: {addButton: (options: {onClick(): unknown}) => {
    dock.onClick = options.onClick; return {update: dock.update, focus: dock.focus, dispose: dock.dispose};
  }}, placePanel: dock.placePanel, subscribe: () => () => {}
})}));

class Element extends EventTarget {
  constructor(public tagName = 'div', public namespaceURI: string | null = 'http://www.w3.org/1999/xhtml') { super(); }
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
  createElement(tagName: string) { return new Element(tagName); }
  createElementNS(namespace: string, tagName: string) { return new Element(tagName, namespace); }
}
const find = (root: Element, attribute: string): Element | undefined => root.attributes.has(attribute) ? root : root.children.map(child => find(child, attribute)).find(Boolean);
const visibleText = (element: Element): string => element.textContent + element.children.map(visibleText).join('');
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

  it.each([['ja', '閉じる'], ['en', 'Close']])('draws the %s panel close button as an X icon with a localized title and aria-label', async (locale, label) => {
    const document = new Document();
    const adapter = createStandaloneCameraControlsHost(document as unknown as globalThis.Document, locale);
    adapter.host.registerProvider({id: 'settings', cameraId: 'pose', kind: 'settings', element: new Element(), running: true});
    dock.onClick!(); await settle();
    const panel = find(document.body, 'data-camera-source-panel')!;
    const dismiss = find(panel, 'data-camera-source-panel-close')!;
    expect(dismiss.attributes.get('aria-label')).toBe(label);
    expect(dismiss.attributes.get('title')).toBe(label);
    expect(visibleText(dismiss).trim()).toBe('');
    const [icon] = dismiss.children;
    expect(dismiss.children).toHaveLength(1);
    expect(icon!.tagName).toBe('svg');
    expect(icon!.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(icon!.attributes.get('aria-hidden')).toBe('true');
    expect(icon!.children[0]!.tagName).toBe('path');
    dock.focus.mockClear();
    dismiss.click();
    expect(panel.hidden).toBe(true); expect(dock.focus).toHaveBeenCalledTimes(1);
    adapter.dispose();
  });

  it('themes the panel from host CSS variables with a prefers-color-scheme fallback', async () => {
    for (const name of ['--color-scheme', '--ui-modal-background', '--ui-primary', '--ui-modal-foreground', '--text-primary',
      '--ui-black-transparent', '--input-background', '--ui-tertiary', '--looks-secondary']) {
      expect(cameraPanelStyle).toContain(`var(${name}`);
    }
    expect(cameraPanelStyle).toMatch(/@media \(prefers-color-scheme: dark\)/);
    expect(cameraPanelStyle).toContain('color-scheme:');
    const document = new Document();
    const adapter = createStandaloneCameraControlsHost(document as unknown as globalThis.Document, 'en');
    adapter.host.registerProvider({id: 'settings', cameraId: 'pose', kind: 'settings', element: new Element(), running: true});
    dock.onClick!(); await settle();
    const root = document.body.children[0]!;
    const panel = find(root, 'data-camera-source-panel')!;
    const style = root.children.find(child => child.tagName === 'style')!;
    expect(style.textContent).toBe(cameraPanelStyle);
    for (const element of [root, panel]) {
      const inline = JSON.stringify(element.style);
      expect(inline).not.toMatch(/#fff|#25354a|#617184/i);
      expect(element.style).not.toHaveProperty('background');
    }
    adapter.dispose();
  });
});
