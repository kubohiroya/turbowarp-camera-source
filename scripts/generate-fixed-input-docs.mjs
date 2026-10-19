import {readFile, writeFile, mkdir} from 'node:fs/promises';
import process from 'node:process';
const root = new URL('../', import.meta.url);
const help = {"showCameraPreview": "PREVIEW_FLIPをnone・horizontal・vertical・bothから選択します。映像の反転設定だけを編集し、カメラ取得やプレビューの実行は行いません。既存rawは無変更時に原文保持します。CAMERA_IDは対象外です。"};
const check = process.argv.includes('--check');
const start = '<!-- BEGIN FIXED INPUT {"showCameraPreview": "PREVIEW_FLIPをnone・horizontal・vertical・bothから選択します。映像の反転設定だけを編集し、カメラ取得やプレビューの実行は行いません。既存rawは無変更時に原文保持します。CAMERA_IDは対象外です。"} -->';
const end = '<!-- END FIXED INPUT {"showCameraPreview": "PREVIEW_FLIPをnone・horizontal・vertical・bothから選択します。映像の反転設定だけを編集し、カメラ取得やプレビューの実行は行いません。既存rawは無変更時に原文保持します。CAMERA_IDは対象外です。"} -->';
const target = new URL('docs/index.html', root);
let current = await readFile(target, 'utf8');
let next = current;
for (const [opcode, text] of Object.entries(help)) {
  const article = new RegExp(`(<article id="block-${opcode}"[^>]*>)([\\s\\S]*?)(</article>)`);
  if (!article.test(next)) throw new Error(`Missing stable block anchor: ${opcode}`);
  next = next.replace(article, (_all, opening, body, closing) => opening + body.replace(new RegExp(`${start}[\\s\\S]*?${end}`), '') +
    `${start}<p id="fixed-input-${opcode}">${text} GUIのDialogs/FixedInputsは起動時既定OFFです。有効にして再読込すると利用できます。</p>${end}` + closing);
}
if(check) {if(current!==next) throw new Error('Fixed input help is out of date.');}
else await writeFile(target, next);
const schema = await readFile(new URL('schemas/block-editor-fixed-inputs.schema.json', root));
const output = new URL('docs/schemas/block-editor-fixed-inputs.schema.json', root);
if(check) {if(!(await readFile(output)).equals(schema)) throw new Error('Generated Schema differs.');}
else {await mkdir(new URL('docs/schemas/',root),{recursive:true}); await writeFile(output,schema);}

// Japanese entrypoints keep their existing layout and link to stable block documentation.
const localized = new URL('docs/ja/index.html', root);
const localizedCurrent = await readFile(localized, 'utf8');
const localizedStart = '<!-- BEGIN FIXED INPUT LINKS -->';
const localizedEnd = '<!-- END FIXED INPUT LINKS -->';
const links = `${localizedStart}<p>固定フォームの説明: ${Object.keys(help).map(opcode=>`<a href="../index.html#block-${opcode}">${opcode}</a>`).join(' / ')}</p>${localizedEnd}`;
const localizedPattern = new RegExp(`${localizedStart}[\\s\\S]*?${localizedEnd}`);
const localizedNext = localizedPattern.test(localizedCurrent) ? localizedCurrent.replace(localizedPattern,links) : localizedCurrent.replace('</main>',links+'</main>');
if(check) {if(localizedCurrent!==localizedNext) throw new Error('Japanese fixed-input links are out of date.');}
else await writeFile(localized,localizedNext);
