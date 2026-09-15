import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const bundlePath = new URL('../dist/camera-source.js', import.meta.url);
const errors: string[] = [];

const {stdout} = await execFileAsync(
  'git',
  ['status', '--short', '--untracked-files=all', '--', 'dist'],
  {cwd: repositoryRoot}
);

if (stdout.length > 0) {
  errors.push(`Generated dist files are not up to date:\n${stdout}`);
}

const bundle = await readFile(bundlePath, 'utf8');

/**
 * Identifiers that would mean calibration machinery had followed the profile contract in here.
 *
 * This extension owns the contract for calibration profiles and deliberately owns none of the
 * solving. The split exists because the solver carries OpenCV, and an extension that every camera
 * consumer loads cannot afford it: `opencv.js` alone is 10.4 MB against this bundle's tens of
 * kilobytes. Nothing stops an import added in good faith from quietly undoing that, and by the time
 * anyone notices it is in a published artifact, so the artifact is what gets checked.
 *
 * The bare word "calibration" is not on the list. It belongs here — block text, profile members and
 * the schema name all use it — and a check that fires on it would be turned off within a week.
 */
const forbiddenIdentifiers: readonly string[] = [
  'kubohiroyacameracalibration',
  '@techstark/opencv-js',
  'techstark',
  'findChessboardCorners',
  'cornerSubPix',
  'calibrateCamera',
  'solvePnP'
];

for (const identifier of forbiddenIdentifiers) {
  if (bundle.includes(identifier)) {
    errors.push(
      `dist/camera-source.js contains ${identifier}, which belongs to a calibration solver rather than to the profile contract.`
    );
  }
}

/**
 * An upper bound on the published bundle, in bytes.
 *
 * The failure this guards against is a runtime dependency arriving unnoticed in an extension that
 * projects partly choose for its size. That kind of arrival is tens or hundreds of kilobytes at
 * once, not a few hundred bytes at a time, so the bound sits far enough above ordinary feature work
 * to stay quiet and still catch it.
 *
 * A bound set just above the current size would fire on the next feature instead, and a number that
 * has to be nudged every time stops being read: it would be raised by reflex, which is the one
 * outcome that makes the check worthless. The exact size is recorded on every run and in the
 * committed `dist`, so growth is visible whether or not this fires.
 *
 * At the time of writing the bundle is roughly 67 kB with no runtime dependencies.
 */
const maximumBundleBytes = 98_304;
const bundleBytes = Buffer.byteLength(bundle);

if (bundleBytes > maximumBundleBytes) {
  errors.push(
    `dist/camera-source.js is ${bundleBytes} B, over the ${maximumBundleBytes} B ceiling. Raise the ceiling deliberately, with the reason, or take the weight back out.`
  );
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `dist/camera-source.js is ${bundleBytes} B and carries no calibration solver.\n`
  );
}
