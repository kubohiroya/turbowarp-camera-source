import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
// Git-hosted dependencies are prepared from source archives with no Git metadata.
// Keep checkout/release packaging on the existing full check path.
let archive = false;
try {archive = /^[a-f0-9]{40}$/.test((await readFile(new URL('../source-revision.txt', import.meta.url), 'utf8')).trim());} catch {}
execFileSync(archive ? 'npm' : 'corepack', archive ? ['run', 'build'] : ['pnpm', 'run', 'check'], {stdio: 'inherit'});
