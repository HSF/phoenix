import {
  CAMERA_SAMPLE_INTERVAL_MS,
  CameraSample,
  MAX_EVENTS_PER_SESSION,
  MAX_RECORDING_DURATION_MS,
  REPLAY_PAYLOAD_MARKER,
  SESSION_VERSION,
  SessionEvent,
  SessionSource,
  SessionV1,
} from './session-format';

/**
 * Minimal subset of the EventDisplay surface the recorder needs.
 * Decoupled to keep the recorder framework-agnostic and testable without
 * spinning up a full Phoenix instance.
 */
export interface RecorderHost {
  /** Subscribe to every event-bus emission. */
  onAny(callback: (eventName: string, data: any) => void): () => void;
  /** Read the current state snapshot (camera, clipping, menu, cuts). */
  getStateSnapshot(): { [key: string]: any };
  /** Read the current camera position + controls target, if available. */
  getCameraSample(): {
    pos: [number, number, number];
    target: [number, number, number];
  } | null;
}

/** Options accepted by {@link SessionRecorder.start}. */
export interface RecorderStartOptions {
  /** Metadata about the dataset and experiment route. */
  source?: SessionSource;
  /** Override the camera sample interval. Tests use a shorter value. */
  cameraSampleIntervalMs?: number;
}

/**
 * Records event-bus emissions and periodic camera samples into a SessionV1
 * payload. Captures the initial state snapshot at start. Sanitizes payloads
 * to JSON-safe values. Auto-stops on size or duration overflow.
 */
export class SessionRecorder {
  /** Captured event-bus emissions in chronological order. */
  private events: SessionEvent[] = [];
  /** Captured camera keyframes (deduplicated against the previous sample). */
  private cameraSamples: CameraSample[] = [];
  /** State snapshot taken at the moment recording started. */
  private initialState: { [key: string]: any } = {};
  /** Dataset and experiment metadata recorded with the session. */
  private source: SessionSource = {};
  /** ISO timestamp of when recording started. */
  private createdAt = '';
  /** Wall-clock start time in milliseconds, used to compute event offsets. */
  private startWallTime = 0;
  /** Handle for the camera sampling interval, or null when not recording. */
  private cameraIntervalId: ReturnType<typeof setInterval> | null = null;
  /** Unsubscribe function for the wildcard event-bus subscription. */
  private unsubscribeFromBus: (() => void) | null = null;
  /** Whether the recorder is currently capturing. */
  private _isRecording = false;
  /** Reason the recorder auto-stopped, or null if still running / stopped manually. */
  private _autoStopReason: 'cap-events' | 'cap-duration' | null = null;
  /** Most recent camera sample, used to skip identical consecutive samples. */
  private lastSample: CameraSample | null = null;

  /**
   * Create a recorder bound to a host adapter.
   * @param host Adapter exposing the event bus, state snapshot, and camera.
   */
  constructor(private host: RecorderHost) {}

  /** True while the recorder is actively capturing events and camera samples. */
  public get isRecording(): boolean {
    return this._isRecording;
  }

  /** Wall-clock milliseconds since the recording started. Zero if not recording. */
  public get duration(): number {
    return this._isRecording ? Date.now() - this.startWallTime : 0;
  }

  /** Number of event-bus emissions captured so far. */
  public get eventCount(): number {
    return this.events.length;
  }

  /**
   * Reason recording auto-stopped, or null while still recording / stopped
   * manually. Surfaces hard caps to the UI for an explanation toast.
   */
  public get autoStopReason(): 'cap-events' | 'cap-duration' | null {
    return this._autoStopReason;
  }

  /**
   * Begin a new recording. Snapshots the initial state, subscribes to the
   * event bus, and starts the camera sampler.
   * @param options Optional source metadata and sampler interval override.
   * @throws Error if already recording.
   */
  public start(options: RecorderStartOptions = {}): void {
    if (this._isRecording) {
      throw new Error(
        'SessionRecorder.start() called while already recording.',
      );
    }
    this._isRecording = true;
    this._autoStopReason = null;
    this.events = [];
    this.cameraSamples = [];
    this.source = options.source ?? {};
    this.createdAt = new Date().toISOString();
    this.startWallTime = Date.now();

    try {
      this.initialState = this.host.getStateSnapshot() ?? {};
    } catch {
      this.initialState = {};
    }

    this.unsubscribeFromBus = this.host.onAny((name, data) => {
      this.captureEvent(name, data);
    });

    const interval =
      options.cameraSampleIntervalMs ?? CAMERA_SAMPLE_INTERVAL_MS;
    this.cameraIntervalId = setInterval(() => this.sampleCamera(), interval);
    this.sampleCamera();
  }

  /**
   * Stop the recording and return the finalized session payload.
   * Safe to call when not recording (returns an empty session).
   */
  public stop(): SessionV1 {
    if (this._isRecording) {
      this.sampleCamera();
    }
    this._isRecording = false;
    if (this.unsubscribeFromBus) {
      this.unsubscribeFromBus();
      this.unsubscribeFromBus = null;
    }
    if (this.cameraIntervalId !== null) {
      clearInterval(this.cameraIntervalId);
      this.cameraIntervalId = null;
    }

    const duration =
      this.events.length > 0 || this.cameraSamples.length > 0
        ? Math.max(
            this.events.length ? this.events[this.events.length - 1].t : 0,
            this.cameraSamples.length
              ? this.cameraSamples[this.cameraSamples.length - 1].t
              : 0,
          )
        : 0;

    return {
      version: SESSION_VERSION,
      createdAt: this.createdAt || new Date().toISOString(),
      duration,
      source: this.source,
      initialState: this.initialState,
      events: this.events,
      cameraSamples: this.cameraSamples,
    };
  }

  /**
   * Handle a single event-bus emission: skip replay-marked payloads, enforce
   * size/duration caps, sanitize the payload to a JSON-safe value, and buffer it.
   * @param name Event name from the bus.
   * @param data Event payload (may be undefined or non-serializable).
   */
  private captureEvent(name: string, data: any): void {
    if (!this._isRecording) return;
    if (data && typeof data === 'object' && data[REPLAY_PAYLOAD_MARKER]) return;

    const elapsed = Date.now() - this.startWallTime;
    if (elapsed > MAX_RECORDING_DURATION_MS) {
      this._autoStopReason = 'cap-duration';
      this.stop();
      return;
    }
    if (this.events.length >= MAX_EVENTS_PER_SESSION) {
      this._autoStopReason = 'cap-events';
      this.stop();
      return;
    }

    let safe: any;
    try {
      safe = data === undefined ? undefined : JSON.parse(JSON.stringify(data));
    } catch {
      return;
    }
    this.events.push({ t: elapsed, name, payload: safe });
  }

  /**
   * Read the current camera state and buffer it unless it is identical to the
   * previous sample. Silently ignores failures (e.g. no active camera yet).
   */
  private sampleCamera(): void {
    if (!this._isRecording) return;
    let sample: {
      pos: [number, number, number];
      target: [number, number, number];
    } | null = null;
    try {
      sample = this.host.getCameraSample();
    } catch {
      sample = null;
    }
    if (!sample) return;

    if (this.lastSample) {
      const samePos =
        this.lastSample.pos[0] === sample.pos[0] &&
        this.lastSample.pos[1] === sample.pos[1] &&
        this.lastSample.pos[2] === sample.pos[2];
      const sameTarget =
        this.lastSample.target[0] === sample.target[0] &&
        this.lastSample.target[1] === sample.target[1] &&
        this.lastSample.target[2] === sample.target[2];
      if (samePos && sameTarget) return;
    }
    const next: CameraSample = {
      t: Date.now() - this.startWallTime,
      pos: sample.pos,
      target: sample.target,
    };
    this.cameraSamples.push(next);
    this.lastSample = next;
  }
}
