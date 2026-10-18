import twcs from '../schemas/camera-intrinsics-v1.json' with {type: 'json'};
import legacy from '../schemas/editor-legacy-calibration.json' with {type: 'json'};
import ros from '../schemas/editor-ros-camera-info.json' with {type: 'json'};
import type {SchemaBundle, SchemaDocument, SyncOwnerValidator} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {readCameraProfileDocument} from './calibration/profile.js';
import {readCameraInfoDocument} from './calibration/camera-info.js';
import {parseYaml} from './calibration/yaml.js';
export {readCameraInfoDocument} from './calibration/camera-info.js';
export {readCameraProfileDocument} from './calibration/profile.js';
export type CameraProfileVariant = 'twcs' | 'legacy' | 'ros';
function bundle(document: typeof twcs | typeof legacy | typeof ros, filename: string, variantId: CameraProfileVariant): SchemaBundle {
  const source = {repository: 'turbowarp-camera-source', path: 'schemas/'+filename};
  return {identity: {ownerId: 'turbowarp-camera-source', contractId: 'camera-profile', revision: 'profile-v0.16.0', variantId}, dialect: '2020-12',
    root: {retrievalUri: document.$id, document: document as SchemaDocument, artifact: {role: 'canonical-schema', source}}, resources: [],
    provenance: {canonicalSources: [source], generatedFiles: [], referenceSchemas: [], generationSources: []}};
}
export const cameraProfileSchemaBundles = {
  twcs: bundle(twcs, 'camera-intrinsics-v1.json', 'twcs'), legacy: bundle(legacy, 'editor-legacy-calibration.json', 'legacy'),
  ros: bundle(ros, 'editor-ros-camera-info.json', 'ros')
} as const;
/** Raw edit values stay separate from any normalized profile returned by the owner. */
export function readCameraProfileInput(data: unknown) {
  if (data && typeof data === 'object' && Object.hasOwn(data, 'image_width')) {
    const read = readCameraInfoDocument(data);return read.ok ? readCameraProfileDocument(read.document) : read;
  }
  return readCameraProfileDocument(data);
}
export const validateCameraProfileInput: SyncOwnerValidator = data => {
  const result = readCameraProfileInput(data);
  return result.ok ? {kind: 'valid', issues: []} : {kind: 'invalid', issues: [{dataPath: '', ruleId: result.error.code}]};
};
export function decodeCameraProfileSource(source: string) {
  const json = source.trim().startsWith('{');
  const data: unknown = json ? JSON.parse(source) : parseYaml(source);
  let variantId: CameraProfileVariant;
  if (!json) variantId = 'ros';
  else if (data && typeof data === 'object' && 'schema' in data && data.schema === 'twcs/camera-intrinsics') variantId = 'twcs';
  else if (data && typeof data === 'object' && 'schema' in data && data.schema === 'twrmc/camera-calibration') variantId = 'legacy';
  else throw new TypeError('Unrecognized camera profile variant.');
  return {source, format: json ? 'json' as const : 'yaml' as const, variantId, data};
}
