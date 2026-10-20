import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// An explicit developer integration check, never a dependency on a sibling checkout.
if (!process.argv[2]) throw Error('Usage: node scripts/check-common-layout.mjs /path/to/built/data-editor');
const camera = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/u, '');
const common = resolve(process.argv[2]);
const requireCommon = createRequire(common + '/package.json');
const {JSDOM} = requireCommon('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/'});
for (const name of ['window','document','navigator','HTMLElement','Element','Node','MutationObserver']) Object.defineProperty(globalThis,name,{value:dom.window[name],configurable:true});
Object.defineProperty(globalThis,'MessageChannel',{value:undefined,configurable:true});
const {act,Simulate} = requireCommon('react-dom/test-utils');
const {createBlockEditorService} = await import(pathToFileURL(common+'/dist/rjsf.js'));
const {resolveEditorLayout} = await import(pathToFileURL(common+'/dist/layout.js'));
const metadata = await import(pathToFileURL(camera+'/lib-editor/src/editor-metadata.js'));
const {serializeCameraInfoYaml} = await import(pathToFileURL(camera+'/lib-editor/src/calibration/camera-info.js'));
const twcs = readFileSync(camera+'/tests/fixtures/calibration/valid/minimal.json','utf8');
const profile = metadata.readCameraProfileInput(JSON.parse(twcs));assert.equal(profile.ok,true);
const raws = {twcs:'\ufeff  '+twcs+'  ',legacy:readFileSync(camera+'/tests/fixtures/calibration/legacy/valid.json','utf8'),ros:'# retained\n'+serializeCameraInfoYaml(profile.profile)};
let passed = 0;
for (const [variantId,ui] of Object.entries(metadata.cameraProfileUiSchemas)) {
 const schema=metadata.cameraProfileSchemaBundles[variantId].root.document;
 assert.equal(resolveEditorLayout(ui,Object.keys(schema.properties)).kind,'layout');
 for(const [key,child]of Object.entries(ui)) if(key!=='ui:options') assert.equal(resolveEditorLayout(child,Object.keys(schema.properties[key].properties)).kind,'layout');
}
for(const route of ['source','rjsf'])for(const variantId of route==='source'?['twcs','legacy','ros']:['twcs']) {
 const service=createBlockEditorService({commonLayout:true});
 const options=metadata.createSourceEditorOptions()[0];
 const opcode=route==='source'?options.opcodes[0]:'camera_standard';
 if(route==='source')metadata.registerSourceEditors({gui:{blockEditors:service.api}});
 else service.api.registerSchemaBundle({apiVersion:1,extensionId:'camera',editorId:'standard',opcodes:[opcode],argument:'PROFILE_JSON',schemaBundle:metadata.cameraProfileSchemaBundles.twcs,uiSchema:metadata.cameraProfileUiSchemas.twcs,validationContext:options.validationContext,ownerValidate:metadata.validateCameraProfileInput});
 const raw=route==='source'?raws[variantId]:twcs;
 const block={targetId:'sprite',blockId:'camera',opcode,revision:'1',arguments:{PROFILE_JSON:{kind:'literal',value:raw}}};
 const commits=[];
 let session=service.registry.open(block,{readBlock:()=>block,commit:request=>{commits.push(request);block.arguments.PROFILE_JSON.value=request.changes[0].value;}});
 const container=document.createElement('div');document.body.append(container);
 await act(async()=>session.mount(container));
 assert.equal(container.querySelectorAll('[role=tab]').length,3,route+'/'+variantId);
 assert.equal(container.querySelector('[data-layout-diagnostic]'),null,route+'/'+variantId);
 assert.ok(container.querySelector('.block-editor-layout-grid'),route+'/'+variantId);
 if(variantId==='twcs')assert.ok([...container.querySelectorAll('legend')].some(el=>el.textContent==='Identity'));
 let result;await act(async()=>{result=await session.save();});assert.equal(result.status,'saved');assert.equal(commits.length,0);assert.equal(block.arguments.PROFILE_JSON.value,raw);
 if(variantId==='twcs') {
  session.dispose();
  session=service.registry.open(block,{readBlock:()=>block,commit:request=>{commits.push(request);block.arguments.PROFILE_JSON.value=request.changes[0].value;}});
  await act(async()=>session.mount(container));
  const input=key=>container.querySelector(`[data-layout-field="${key}"] input:not([type="hidden"]), [data-layout-field="${key}"] textarea`);
  await act(async()=>Simulate.change(input('producer'),{target:{value:'layout integration'}}));
  const tabs=[...container.querySelectorAll('[role=tab]')];
  await act(async()=>Simulate.click(tabs[1]));
  await act(async()=>Simulate.change(input('fx'),{target:{value:'941.25'}}));
  await act(async()=>Simulate.click(tabs[0]));
  await act(async()=>{result=await session.save();});assert.equal(result.status,'saved');assert.equal(commits.length,1);
  const validated=metadata.validateCameraProfileSource(block.arguments.PROFILE_JSON.value,options.validationContext());assert.equal(validated.result.kind,'valid');
  const data=JSON.parse(block.arguments.PROFILE_JSON.value.trim());assert.equal(data.producer,'layout integration');assert.equal(data.intrinsics.fx,941.25);
 }
 session.dispose();container.remove();passed++;
}
dom.window.close();console.log(JSON.stringify({cases:passed,metadataVariants:3,result:'passed'}));
