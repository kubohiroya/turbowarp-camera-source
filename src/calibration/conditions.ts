import type {Flip} from '../flip.js';
/**
 * What the running camera reports about how it is capturing right now.
 *
 * This is the other half of a compatibility check: a stored profile describes the conditions a
 * calibration was solved under, and these are the conditions in front of us. Both are read from the
 * same `MediaTrackSettings` vocabulary so the two can be compared member by member.
 *
 * A member is absent when the device does not report that control at all, which is different from
 * the control being present with an unremarkable value. The comparison depends on that difference,
 * so nothing here substitutes a default for a missing reading.
 */
import type {CalibrationCapture} from './types.js';

export interface CameraConditions {
  /** Pixel size of the delivered frame, or zero while no frame has arrived. */
  readonly width: number;
  readonly height: number;
  readonly deviceId: string;
  /**
   * Whether the stage preview is drawn flipped.
   *
   * Display only. The frames handed to a consumer are the camera's own capture either way, so this
   * never takes part in a compatibility decision — it is carried so that a caller rendering the
   * frame knows what the operator is looking at.
   */
  readonly previewFlip: Flip;
  readonly label?: string;
  readonly frameRate?: number;
  readonly facingMode?: string;
  readonly resizeMode?: string;
  readonly zoom?: number;
  readonly focusMode?: string;
  readonly focusDistance?: number;
}

/** The subset of `MediaTrackSettings` this extension reads, narrowed to what it actually uses. */
export interface TrackSettingsLike {
  readonly deviceId?: unknown;
  readonly frameRate?: unknown;
  readonly facingMode?: unknown;
  readonly resizeMode?: unknown;
  readonly zoom?: unknown;
  readonly focusMode?: unknown;
  readonly focusDistance?: unknown;
}

export interface FrameGeometry {
  readonly width: number;
  readonly height: number;
  readonly previewFlip: Flip;
  readonly deviceId: string;
  readonly label?: string;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function nonNegativeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function nonEmptyText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text.length === 0 ? undefined : text;
}

function pixelCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

/**
 * Builds the conditions record.
 *
 * Frame size comes from the delivered frame rather than from the track settings: a track can report
 * a requested size that the browser then satisfies with something else, and the number a consumer
 * has to match its intrinsics against is the size of the image it is actually handed.
 */
export function readCameraConditions(
  frame: FrameGeometry,
  settings: TrackSettingsLike = {}
): CameraConditions {
  const label = nonEmptyText(frame.label);
  const frameRate = positiveNumber(settings.frameRate);
  const facingMode = nonEmptyText(settings.facingMode);
  const resizeMode = nonEmptyText(settings.resizeMode);
  const zoom = positiveNumber(settings.zoom);
  const focusMode = nonEmptyText(settings.focusMode);
  const focusDistance = nonNegativeNumber(settings.focusDistance);
  return {
    width: pixelCount(frame.width),
    height: pixelCount(frame.height),
    deviceId: nonEmptyText(frame.deviceId) ?? nonEmptyText(settings.deviceId) ?? '',
    previewFlip: frame.previewFlip,
    ...(label === undefined ? {} : {label}),
    ...(frameRate === undefined ? {} : {frameRate}),
    ...(facingMode === undefined ? {} : {facingMode}),
    ...(resizeMode === undefined ? {} : {resizeMode}),
    ...(zoom === undefined ? {} : {zoom}),
    ...(focusMode === undefined ? {} : {focusMode}),
    ...(focusDistance === undefined ? {} : {focusDistance})
  };
}

/**
 * Renders the optical part of the current conditions in the shape a profile stores.
 *
 * A producer solving a calibration right now uses this to record what the camera was doing, so the
 * document it writes can later be compared against a fresh reading of the same members.
 */
export function captureFromConditions(conditions: CameraConditions): CalibrationCapture {
  return {
    ...(conditions.frameRate === undefined ? {} : {frameRate: conditions.frameRate}),
    ...(conditions.facingMode === undefined ? {} : {facingMode: conditions.facingMode}),
    ...(conditions.resizeMode === undefined ? {} : {resizeMode: conditions.resizeMode}),
    ...(conditions.zoom === undefined ? {} : {zoom: conditions.zoom}),
    ...(conditions.focusMode === undefined ? {} : {focusMode: conditions.focusMode}),
    ...(conditions.focusDistance === undefined ? {} : {focusDistance: conditions.focusDistance})
  };
}
