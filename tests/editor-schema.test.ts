import {readFileSync, readdirSync} from 'node:fs';
import {expect, it} from 'vitest';
import {compileSchemaBundle, validateSchemaInput} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {cameraProfileSchemaBundles, decodeCameraProfileSource, readCameraProfileInput, validateCameraProfileInput} from '../src/editor-schema.js';
import {readCameraProfileDocument} from '../src/calibration/profile.js';
import {readProfileText} from '../src/calibration/profile-text.js';
import {serializeCameraInfoYaml} from '../src/calibration/camera-info.js';
const context = {consumerId: 'registerCameraProfile', nowMs: 0, settings: null};
const compiled = Object.fromEntries(Object.entries(cameraProfileSchemaBundles).map(([variant, bundle]) => {
  const result=compileSchemaBundle(bundle);if(result.kind!=='compiled')throw Error('Failed to compile '+variant);return [variant,result.validator];
}));
const base = new URL('./fixtures/calibration/', import.meta.url);
function compare(source: string) {
  const read=readProfileText(source);const expected=read.ok?readCameraProfileDocument(read.document):read;
  let decoded: ReturnType<typeof decodeCameraProfileSource>;
  try {decoded=decodeCameraProfileSource(source);}catch{expect(expected.ok).toBe(false);return;}
  const before=JSON.stringify(decoded.data);
  const result=validateSchemaInput(compiled[decoded.variantId]!,decoded.data as never,{context,ownerValidate:validateCameraProfileInput});
  expect(result.kind==='valid').toBe(expected.ok);expect(JSON.stringify(decoded.data)).toBe(before);expect(decoded.source).toBe(source);
}
it('all existing valid/invalid/legacy JSON fixtures match the actual profile reader',()=>{
  for(const directory of ['valid','invalid','legacy'])for(const name of readdirSync(new URL(directory+'/',base)).filter(n=>n.endsWith('.json')))compare(readFileSync(new URL(directory+'/'+name,base),'utf8'));
  compare('');compare('{ broken');compare('{"schema":"camerasource/camera-intrinsics","version":1}');
});
it('raw ROS mappings remain editable while validation uses a separate normalized profile',()=>{
  for(const name of readdirSync(new URL('valid/',base)).filter(n=>n.endsWith('.json'))){
    const profile=readCameraProfileDocument(JSON.parse(readFileSync(new URL('valid/'+name,base),'utf8')));if(!profile.ok)throw Error();
    const source=serializeCameraInfoYaml(profile.profile);compare(source);
    const decoded=decodeCameraProfileSource(source);expect(decoded.variantId).toBe('ros');expect(decoded.data).toHaveProperty('camera_matrix');expect(decoded.data).not.toHaveProperty('intrinsics');
    const validation=readCameraProfileInput(decoded.data);expect(validation.ok).toBe(true);if(validation.ok)expect(validation.profile).not.toBe(decoded.data);
    compare(source.replace('image_width: ', 'unknown_width: '));
  }
  for(const name of readdirSync(new URL('camera-info/',base)))compare(readFileSync(new URL('camera-info/'+name,base),'utf8'));
});
