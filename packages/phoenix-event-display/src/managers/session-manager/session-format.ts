/**
 * On-disk + URL-embeddable schema for Phoenix Sessions (issue #883).
 * v1: deterministic semantic replay of event-bus emissions + camera samples.
 *
 * The replay is "semantic" (re-emits structured event-bus events on the
 * receiving side) and not a pixel video, so the player keeps full 3D
 * interactivity while events are scheduled at original timing.
 */

/** Current session-format major version. Bumped on breaking schema change. */
export const SESSION_VERSION = 1;

/** Safety cap on a single decoded session size to defend against deflate bombs. */
export const MAX_DECOMPRESSED_BYTES = 50 * 1024 * 1024;

/** Hard cap on captured event count per recording. Auto-stop on overflow. */
export const MAX_EVENTS_PER_SESSION = 50000;

/** Hard cap on recording duration. Auto-stop on overflow. */
export const MAX_RECORDING_DURATION_MS = 60 * 60 * 1000;

/** Default camera sample interval. 10 samples/sec is smooth enough for 60fps replay. */
export const CAMERA_SAMPLE_INTERVAL_MS = 100;

/** Hard cap on a remote ?session=URL response size. */
export const MAX_REMOTE_SESSION_BYTES = 10 * 1024 * 1024;

/** A single recorded event-bus emission. */
export interface SessionEvent {
  /** Milliseconds since recording start. */
  t: number;
  /** Event-bus event name passed to emit(). */
  name: string;
  /** Event-bus payload, sanitized to be JSON-safe. */
  payload: any;
}

/** A single recorded camera position + look-target sample. */
export interface CameraSample {
  /** Milliseconds since recording start. */
  t: number;
  /** Camera position as [x, y, z]. */
  pos: [number, number, number];
  /** Controls target as [x, y, z]. */
  target: [number, number, number];
}

/** Metadata describing the dataset/route that produced the recording. */
export interface SessionSource {
  /** Experiment route identifier, e.g. 'atlas-masterclass'. */
  experiment?: string;
  /** Event data file URL or name, if known. */
  file?: string;
  /** Loader type ('json', 'jivexml', 'physlite', ...) if known. */
  type?: string;
}

/** Complete session-replay payload (v1). */
export interface SessionV1 {
  /** Schema version. Must equal SESSION_VERSION for a v1 reader. */
  version: 1;
  /** ISO timestamp of recording start. */
  createdAt: string;
  /** Total recording duration in milliseconds. */
  duration: number;
  /** Metadata about the dataset and route. */
  source: SessionSource;
  /** State snapshot at recording start (camera, clipping, menu, cuts). */
  initialState: { [key: string]: any };
  /** Captured event-bus emissions, sorted by t. */
  events: SessionEvent[];
  /** Captured camera samples, sorted by t. */
  cameraSamples: CameraSample[];
}

/** Marker the player puts on payloads it emits so the recorder skips them. */
export const REPLAY_PAYLOAD_MARKER = '__phoenixReplay';

/**
 * Validate that an arbitrary value is a structurally-valid SessionV1.
 * Defensive against malformed JSON, untrusted URL payloads and version
 * skew from older or newer producers.
 * @param value The parsed-JSON value to validate.
 * @returns The value typed as SessionV1, or null when invalid.
 */
export function validateSession(value: unknown): SessionV1 | null {
  if (!value || typeof value !== 'object') return null;
  const s = value as Partial<SessionV1>;

  if (s.version !== SESSION_VERSION) return null;
  if (typeof s.createdAt !== 'string') return null;
  if (typeof s.duration !== 'number' || !isFinite(s.duration) || s.duration < 0)
    return null;
  if (s.duration > MAX_RECORDING_DURATION_MS) return null;
  if (!s.source || typeof s.source !== 'object') return null;
  if (!s.initialState || typeof s.initialState !== 'object') return null;
  if (!Array.isArray(s.events)) return null;
  if (s.events.length > MAX_EVENTS_PER_SESSION) return null;
  if (!Array.isArray(s.cameraSamples)) return null;

  for (const ev of s.events) {
    if (!ev || typeof ev !== 'object') return null;
    if (typeof ev.t !== 'number' || !isFinite(ev.t) || ev.t < 0) return null;
    if (typeof ev.name !== 'string' || ev.name.length === 0) return null;
  }
  for (const cs of s.cameraSamples) {
    if (!cs || typeof cs !== 'object') return null;
    if (typeof cs.t !== 'number' || !isFinite(cs.t) || cs.t < 0) return null;
    if (!Array.isArray(cs.pos) || cs.pos.length !== 3) return null;
    if (!Array.isArray(cs.target) || cs.target.length !== 3) return null;
    for (const n of cs.pos)
      if (typeof n !== 'number' || !isFinite(n)) return null;
    for (const n of cs.target)
      if (typeof n !== 'number' || !isFinite(n)) return null;
  }

  return s as SessionV1;
}
