import {createBlockEditorService} from '@kubohiroya/turbowarp-extension-data-editor/rjsf';
import {expect, it} from 'vitest';
import {createSourceEditorOptions, registerSourceEditors} from '../src/source-editors.js';
import definitions from '../src/block-definitions.json';
const targets: Record<string, readonly string[]> = {"registerCameraProfile": ["PROFILE_JSON"], "registerCameraProfileAs": ["PROFILE_JSON"]};
it('covers every planned opcode and input against the actual block definitions', () => {
  const options = createSourceEditorOptions();
  const actual = options.flatMap(option => option.opcodes.flatMap(opcode => option.bindings.map(binding => `${opcode.slice(option.extensionId.length + 1)}.${binding.argument}`))).sort();
  expect(actual).toEqual(Object.entries(targets).flatMap(([opcode, arguments_]) => arguments_.map(argument => `${opcode}.${argument}`)).sort());
  for (const [opcode, arguments_] of Object.entries(targets)) {
    const block = definitions.blocks.find(block => block.opcode === opcode);
    expect(block).toBeDefined();
    for (const argument of arguments_) expect(block!.arguments).toHaveProperty(argument);
  }
});
it('skips old hosts, registers only through the optional source API, and removes once', () => {
  expect(() => registerSourceEditors({} )()).not.toThrow();
  expect(() => registerSourceEditors({gui: {blockEditors: {apiVersion: 1}}})()).not.toThrow();
  const seen: unknown[] = [];
  let removals = 0;
  const remove = registerSourceEditors({gui: {blockEditors: {apiVersion: 1, registerSourceEditor: (options: unknown) => {seen.push(options); return () => {removals++;};}}}});
  expect(seen.length).toBe(createSourceEditorOptions().length);
  remove(); remove(); expect(removals).toBe(seen.length);
});
it('keeps decode failures safe and preserves the exact source at owner validation', () => {
  const source = '{private-input broken';
  for (const definition of createSourceEditorOptions()) for (const binding of definition.bindings) {
    expect(() => binding.decode(source)).toThrow();
    const result = binding.validateSource(source, definition.validationContext());
    expect(result.source).toBe(source); expect(result.result.kind).toBe('invalid');
    expect(JSON.stringify(result.result)).not.toContain('private-input');
    expect(binding.variants.length).toBeGreaterThan(0);
  }
});

import {readFileSync} from 'node:fs';
import {serializeCameraInfoYaml} from '../src/calibration/camera-info.js';
import {readCameraProfileDocument} from '../src/calibration/profile.js';
it('uses the raw profile/ROS document without applying normalized values', () => {
 const option = createSourceEditorOptions()[0]!; const binding = option.bindings[0]!;
 const source = readFileSync(new URL('./fixtures/calibration/valid/minimal.json', import.meta.url), 'utf8');
 const data = binding.decode(source); expect(data.source).toBe(source); expect(data.variantId).toBe('twcs');
 const profile = readCameraProfileDocument(data.data); if (!profile.ok) throw Error('Fixture invalid.');
 const yaml = '# camera note\n' + serializeCameraInfoYaml(profile.profile);
 const decoded = binding.decode(yaml); expect(decoded).toMatchObject({source: yaml, variantId: 'ros', format: 'yaml'});
 expect(decoded.data).toHaveProperty('camera_matrix'); expect(decoded.data).not.toHaveProperty('intrinsics');
 expect(binding.validateSource(yaml, option.validationContext()).result.kind).toBe('valid');
});

it('registers and resolves every fully qualified opcode through the actual common service', () => {
  const service = createBlockEditorService();
  const remove = registerSourceEditors({gui: {blockEditors: service.api}});
  const options = createSourceEditorOptions();
  for (const option of options) for (const opcode of option.opcodes) {
    expect(opcode.startsWith(`${option.extensionId}_`)).toBe(true);
    expect(service.registry.resolve(opcode)).toMatchObject({extensionId: option.extensionId, editorId: option.editorId,
      editableArguments: option.bindings.map(binding => binding.argument)});
  }
  remove(); remove();
  for (const option of options) for (const opcode of option.opcodes) expect(service.registry.resolve(opcode)).toBeUndefined();
});
