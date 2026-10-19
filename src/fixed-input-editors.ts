import type {FixedInputBinding, FixedInputEditorOptions, FixedBlockSnapshot, JsonValue, LiteralValue} from '@kubohiroya/turbowarp-extension-data-editor';
import {fixedInputBundle} from './fixed-input-schema.js';

const invalid = () => [{message: 'Invalid fixed input.'}];
function enumBinding(opcode: string, argument: string, choices: readonly string[], normalization: 'none'|'trim'|'trim-lower'): FixedInputBinding {
  const project = (value: JsonValue|LiteralValue) => {
    if (typeof value !== 'string') return value;
    const normalized = normalization === 'none' ? value : normalization === 'trim' ? value.trim() : value.trim().toLowerCase();
    return choices.includes(normalized) ? normalized : value;
  };
  return {argument, schemaBundle: fixedInputBundle(opcode, argument), control: {label: argument, kind: 'enum', choices: choices.map(value=>({value}))},
    read: project,
    encode(value) { if(typeof value !== 'string' || !choices.includes(value)) throw new TypeError('Choose a known value.'); return value; },
    validateCandidate(candidate, _context, finalSnapshot) {
      try {return typeof candidate === 'string' && choices.includes(candidate) && ownerCheck(opcode, argument, candidate, finalSnapshot) ? [] : invalid();}
      catch {return invalid();}
    }};
}
// Per-field schema constraints are checked by the common prepared engine against the exact candidate.
// Clamp/fallback and device/session prerequisites remain runtime behavior, never editor providers.
function ownerCheck(_opcode: string, _argument: string, _candidate: LiteralValue, _snapshot: FixedBlockSnapshot): boolean { void [_opcode, _argument, _candidate, _snapshot]; return true; }

const extensionId = 'kubohiroyacamerasource';
const validationContext = () => ({consumerId:'turbowarp-camera-source', nowMs:0, settings:null});
export const fixedInputEditors: readonly FixedInputEditorOptions[] = [
  {apiVersion: 1, extensionId, editorId: 'showCameraPreview-fixed', opcodes: [`${extensionId}_showCameraPreview`],
    contractId: 'turbowarp-camera-source/showCameraPreview', contractRevision: '1', validationContext,
    readOnlyArguments: [],
    bindings: [
    enumBinding('showCameraPreview', 'PREVIEW_FLIP', ["none", "horizontal", "vertical", "both"], 'none')
    ]
  }
];

interface RuntimeLifetime {
  on?: (event: string, listener: () => void) => void;
  off?: (event: string, listener: () => void) => void;
}

/** Register metadata only; the GUI startup capability owns editor activation. */
export function registerFixedInputEditors(
  scratch: unknown, definitions: readonly FixedInputEditorOptions[], runtimeOverride?: RuntimeLifetime
): () => void {
  const host = scratch as {gui?: {blockEditors?: {apiVersion?: number;
    registerFixedInputEditor?: (options: FixedInputEditorOptions) => () => void}};
    vm?: {runtime?: RuntimeLifetime}};
  const api = host.gui?.blockEditors;
  if (!definitions.length || api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== 'function') return () => {};
  const runtime = runtimeOverride ?? host.vm?.runtime;
  const removers: (() => void)[] = [];
  let active = true;
  const dispose = () => {
    if (!active) return;
    active = false;
    runtime?.off?.('RUNTIME_DISPOSED', dispose);
    for (const remove of removers.splice(0).reverse()) remove();
  };
  try {
    for (const definition of definitions) {
      const remove = api.registerFixedInputEditor.call(api, definition);
      if (typeof remove !== 'function') throw new TypeError('Invalid fixed input registration disposer.');
      removers.push(remove);
    }
    runtime?.on?.('RUNTIME_DISPOSED', dispose);
  } catch (error) {dispose(); throw error;}
  return dispose;
}
