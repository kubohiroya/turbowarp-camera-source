import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
// Git-hosted dependencies are prepared from source archives with no Git metadata.
// Keep checkout/release packaging on the existing full check path.
let archive = false;
try {archive = /^[a-f0-9]{40}$/.test((await readFile(new URL('../source-revision.txt', import.meta.url), 'utf8')).trim());} catch {}
// Call the pnpm on PATH, as the check's own nested `pnpm run` calls do. Going through `corepack`
// set COREPACK_ROOT for those nested calls, and a standalone pnpm of another version then refused
// to switch to `packageManager`, so a local `npm publish` failed. CI's PATH pnpm is corepack's shim.
execFileSync(archive ? 'npm' : 'pnpm', archive ? ['run', 'build'] : ['run', 'check'], {stdio: 'inherit'});
