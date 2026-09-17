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

const bundleBytes = Buffer.byteLength(bundle);

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `dist/camera-source.js is ${bundleBytes} B and carries no calibration solver.\n`
  );
}
