import type {SourceBinding, SourceEditorOptions, SourceValidation, SchemaJsonObject} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {extensionConfig} from './config.js';

function checkedSource(value: {source: string; result: {kind: 'valid' | 'invalid' | 'execution-error' | 'schema-error'; diagnostics: readonly {code: string; dataPath?: string}[]}}): SourceValidation {
  return value.result.kind === 'valid'
    ? {source: value.source, result: {kind: 'valid', diagnostics: []}}
    : {source: value.source, result: {kind: value.result.kind, diagnostics: value.result.diagnostics}};
}
import {cameraProfileSchemaBundles, decodeCameraProfileSource, validateCameraProfileSource} from './editor-schema.js';
/** Presentation is opt-in at the common GUI; schema and stored profile shape stay authoritative. */
export const cameraProfileUiSchemas: Readonly<Record<keyof typeof cameraProfileSchemaBundles, SchemaJsonObject>> = {
  twcs: {
    'ui:options': {extensionDataLayout: {version: 1, items: [{tabs: [
      {label: 'Profile', items: [
        {group: 'Identity', items: [{field: 'profileId'}, {field: 'cameraId'}, {field: 'calibratedAt'}, {field: 'producer'}]},
        {group: 'Contract', items: [{field: 'schema'}, {field: 'version'}, {field: 'cameraModel'}]},
      ]},
      {label: 'Camera', items: [{field: 'image'}, {field: 'intrinsics'}, {field: 'distortion'}]},
      {label: 'Capture', items: [{field: 'capture'}, {field: 'quality'}, {field: 'device'}]},
    ]}]}},
    image: {'ui:options': {extensionDataLayout: {version: 1, items: [
      {grid: 2, items: [{field: 'width'}, {field: 'height'}]}, {field: 'undistorted'},
    ]}}},
    intrinsics: {'ui:options': {extensionDataLayout: {version: 1, items: [
      {grid: 2, items: [{field: 'fx'}, {field: 'fy'}, {field: 'cx'}, {field: 'cy'}]}, {field: 'skew'},
    ]}}},
  },
  legacy: {'ui:options': {extensionDataLayout: {version: 1, items: [{tabs: [
    {label: 'Profile', items: [{group: 'Identity', items: [{field: 'calibrationId'}, {field: 'cameraId'}, {field: 'calibratedAt'}]}, {field: 'schema'}, {field: 'version'}]},
    {label: 'Camera', items: [{grid: 2, items: [{field: 'imageWidth'}, {field: 'imageHeight'}]}, {field: 'intrinsicMatrix'}, {field: 'distortionCoefficients'}]},
    {label: 'World', items: [{field: 'worldFromCameraMatrix'}, {field: 'worldUnit'}]},
  ]}]}}},
  ros: {'ui:options': {extensionDataLayout: {version: 1, items: [{tabs: [
    {label: 'Image', items: [{field: 'camera_name'}, {grid: 2, items: [{field: 'image_width'}, {field: 'image_height'}]}, {field: 'turbowarp_camera_source'}]},
    {label: 'Matrices', items: [{field: 'camera_matrix'}, {field: 'distortion_model'}, {field: 'distortion_coefficients'}, {field: 'rectification_matrix'}, {field: 'projection_matrix'}]},
    {label: 'Region', items: [{grid: 2, items: [{field: 'binning_x'}, {field: 'binning_y'}]}, {field: 'roi'}]},
  ]}]}}},
};
export function createSourceEditorOptions(nowMs: () => number = Date.now): readonly SourceEditorOptions[] {
  const context = () => ({consumerId: extensionConfig.id, nowMs: nowMs(), settings: null});
  return [
    {apiVersion: 1, extensionId: extensionConfig.id, editorId: 'camera-profile-source', opcodes: ["registerCameraProfile", "registerCameraProfileAs"].map(opcode => `${extensionConfig.id}_${opcode}`), bindings: [{argument: 'PROFILE_JSON', variants: Object.entries(cameraProfileSchemaBundles).map(([variantId, schemaBundle]) => ({variantId, format: variantId === 'ros' ? 'yaml' as const : 'json' as const, schemaBundle, uiSchema: cameraProfileUiSchemas[variantId as keyof typeof cameraProfileSchemaBundles]})), decode: source => {const decoded = decodeCameraProfileSource(source); return {...decoded, data: decoded.data as ReturnType<SourceBinding['decode']>['data']};}, validateSource: (source, context) => checkedSource(validateCameraProfileSource(source, context))}], validationContext: context}
  ];
}

/** Optional capability: old GUIs continue executing blocks without editor registration. */
export function registerSourceEditors(scratch: unknown, nowMs: () => number = Date.now): () => void {
  const api = (scratch as {gui?: {blockEditors?: {apiVersion?: number; registerSourceEditor?: (options: SourceEditorOptions) => () => void}}})?.gui?.blockEditors;
  if (api?.apiVersion !== 1 || typeof api.registerSourceEditor !== 'function') return () => {};
  const removers: (() => void)[] = [];
  try {
    for (const options of createSourceEditorOptions(nowMs)) removers.push(api.registerSourceEditor(options));
  } catch {
    for (const remove of removers.reverse()) remove();
    return () => {};
  }
  let active = true;
  return () => {if (active) {active = false; for (const remove of removers.reverse()) remove();}};
}
