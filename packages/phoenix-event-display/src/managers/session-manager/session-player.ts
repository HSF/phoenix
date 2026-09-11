import { REPLAY_PAYLOAD_MARKER, SessionV1 } from './session-format';

/**
 * Minimal subset of the EventDisplay surface the player needs.
 * Decoupled so the player can be tested without a real Phoenix scene.
 */
export interface PlayerHost {
  /** Re-emit an event onto the bus. Recorders should ignore replay-marked payloads. */
  emit(eventName: string, data?: any): void;
  /** Restore the captured initial state snapshot before replay starts. */
  applyStateSnapshot(state: { [key: string]: any }): void;
  /** Move the camera to position + look-target. Used between camera samples. */
  applyCamera(
    pos: [number, number, number],
    target: [number, number, number],
  ): void;
}

/** Playback speed multipliers exposed to the UI. */
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/**
 * Re-emits a recorded SessionV1 onto a PlayerHost (the live EventDisplay) at
 * original timing. Supports scrubbing, time-warp, and graceful early stop.
 * Player-emitted events carry a {@link REPLAY_PAYLOAD_MARKER} so the recorder
 * does not capture them on a second pass.
 */
export class SessionPlayer {
  /** Current playhead position in milliseconds. */
  private _currentTime = 0;
  /** Active playback speed multiplier. */
  private _speed: PlaybackSpeed = 1;
  /** Whether the player is actively advancing the playhead. */
  private _isPlaying = false;
  /** Whether the playhead has reached the end at least once. */
  private _isFinished = false;
  /** Index of the next event to emit from the session's events array. */
  private nextEventIndex = 0;
  /** Wall-clock time when the current play run started. */
  private startWall = 0;
  /** Playhead position when the current play run started. */
  private startSessionTime = 0;
  /** Active animation-frame handle, or null when paused. */
  private rafId: number | null = null;
  /** Subscribers notified on every playhead update. */
  private tickCallbacks: Set<(t: number) => void> = new Set();
  /** Subscribers notified once when the playhead reaches the end. */
  private completeCallbacks: Set<() => void> = new Set();
  /** Frame scheduler (injectable for tests / non-browser environments). */
  private rafImpl: (cb: FrameRequestCallback) => number;
  /** Frame canceller paired with {@link rafImpl}. */
  private cancelImpl: (id: number) => void;

  /**
   * Create a player for a recorded session.
   * @param host Adapter that re-emits events and applies state/camera.
   * @param session The validated session payload to replay.
   * @param options Optional injectable requestAnimationFrame/cancel pair.
   */
  constructor(
    private host: PlayerHost,
    public readonly session: SessionV1,
    options?: {
      raf?: typeof requestAnimationFrame;
      cancelRaf?: typeof cancelAnimationFrame;
    },
  ) {
    this.rafImpl =
      options?.raf ??
      (typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame.bind(globalThis)
        : (cb: FrameRequestCallback) =>
            setTimeout(() => cb(performance.now()), 16) as unknown as number);
    this.cancelImpl =
      options?.cancelRaf ??
      (typeof cancelAnimationFrame !== 'undefined'
        ? cancelAnimationFrame.bind(globalThis)
        : (id: number) =>
            clearTimeout(id as unknown as ReturnType<typeof setTimeout>));
  }

  /** Total recording length in milliseconds. */
  public get duration(): number {
    return this.session.duration;
  }

  /** Current playhead position in milliseconds. */
  public get currentTime(): number {
    return this._currentTime;
  }

  /** True between play() and pause()/stop()/end-of-stream. */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  /** True after the playhead has reached duration once. */
  public get isFinished(): boolean {
    return this._isFinished;
  }

  /** Current playback speed multiplier. */
  public get speed(): PlaybackSpeed {
    return this._speed;
  }

  /** Number of events captured in the session (for the UI counter). */
  public get eventCount(): number {
    return this.session.events.length;
  }

  /**
   * Start playback from the current playhead. If the playhead is at zero,
   * the captured initial state is re-applied first.
   */
  public play(): void {
    if (this._isPlaying) return;
    if (this._isFinished) {
      this.seek(0);
      this._isFinished = false;
    }
    if (this._currentTime === 0) {
      this.applyInitialState();
    }
    this._isPlaying = true;
    this.startWall = Date.now();
    this.startSessionTime = this._currentTime;
    this.scheduleTick();
  }

  /** Pause playback. Playhead position is preserved. */
  public pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    if (this.rafId !== null) {
      this.cancelImpl(this.rafId);
      this.rafId = null;
    }
  }

  /** Stop playback and reset the playhead to zero. */
  public stop(): void {
    this.pause();
    this._currentTime = 0;
    this.nextEventIndex = 0;
    this._isFinished = false;
  }

  /**
   * Move the playhead to t (clamped to [0, duration]). Forward seeks emit
   * events between previous and new position. Backward seeks reapply the
   * initial state and replay from zero up to t.
   * @param t Target time in milliseconds.
   */
  public seek(t: number): void {
    const clamped = Math.max(0, Math.min(t, this.session.duration));
    const wasPlaying = this._isPlaying;
    if (wasPlaying) this.pause();

    const seekingFromStart = this._currentTime === 0 && clamped > 0;
    const seekingBackwards = clamped < this._currentTime;
    if (seekingFromStart || seekingBackwards) {
      this.applyInitialState();
      this._currentTime = 0;
      this.nextEventIndex = 0;
    }
    this.advanceTo(clamped);
    this._currentTime = clamped;
    this.applyCameraAt(clamped);
    this._isFinished = clamped >= this.session.duration;
    this.notifyTick();
    if (wasPlaying && !this._isFinished) this.play();
  }

  /** Change playback speed. Continuous if currently playing. */
  public setSpeed(speed: PlaybackSpeed): void {
    if (this._speed === speed) return;
    const wasPlaying = this._isPlaying;
    if (wasPlaying) this.pause();
    this._speed = speed;
    if (wasPlaying) this.play();
  }

  /** Subscribe to playhead updates. Returns an unsubscribe function. */
  public onTick(cb: (t: number) => void): () => void {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  /** Subscribe to end-of-stream. Returns an unsubscribe function. */
  public onComplete(cb: () => void): () => void {
    this.completeCallbacks.add(cb);
    return () => this.completeCallbacks.delete(cb);
  }

  /** Schedule the next animation frame for the playback loop. */
  private scheduleTick(): void {
    this.rafId = this.rafImpl(() => this.tick());
  }

  /**
   * One iteration of the playback loop: advance the playhead by the elapsed
   * wall-clock time scaled by the speed, emit due events, move the camera,
   * and either schedule the next frame or finish.
   */
  private tick(): void {
    if (!this._isPlaying) return;
    const elapsed = (Date.now() - this.startWall) * this._speed;
    const target = Math.min(
      this.startSessionTime + elapsed,
      this.session.duration,
    );
    this.advanceTo(target);
    this._currentTime = target;
    this.applyCameraAt(target);
    this.notifyTick();
    if (target >= this.session.duration) {
      this._isPlaying = false;
      this._isFinished = true;
      this.rafId = null;
      this.completeCallbacks.forEach((cb) => cb());
      return;
    }
    this.scheduleTick();
  }

  /** Notify all tick subscribers of the current playhead position. */
  private notifyTick(): void {
    this.tickCallbacks.forEach((cb) => cb(this._currentTime));
  }

  /**
   * Emit every not-yet-emitted event whose timestamp is at or before target.
   * @param target Playhead position in milliseconds.
   */
  private advanceTo(target: number): void {
    while (
      this.nextEventIndex < this.session.events.length &&
      this.session.events[this.nextEventIndex].t <= target
    ) {
      const ev = this.session.events[this.nextEventIndex];
      this.host.emit(ev.name, this.markPayload(ev.payload));
      this.nextEventIndex++;
    }
  }

  /** Re-apply the captured initial state, ignoring any apply failure. */
  private applyInitialState(): void {
    try {
      this.host.applyStateSnapshot(this.session.initialState);
    } catch {
      // ignore; replay still runs with whatever state is already loaded
    }
  }

  /**
   * Position the camera for playhead t by interpolating between the two
   * bracketing camera samples (or clamping to the first/last sample).
   * @param t Playhead position in milliseconds.
   */
  private applyCameraAt(t: number): void {
    const samples = this.session.cameraSamples;
    if (samples.length === 0) return;

    let beforeIdx = -1;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].t <= t) beforeIdx = i;
      else break;
    }
    if (beforeIdx === -1) {
      this.applyCameraSample(samples[0].pos, samples[0].target);
      return;
    }
    const before = samples[beforeIdx];
    const after = samples[beforeIdx + 1];
    if (!after) {
      this.applyCameraSample(before.pos, before.target);
      return;
    }
    const span = after.t - before.t;
    const alpha = span > 0 ? (t - before.t) / span : 0;
    this.applyCameraSample(
      [
        lerp(before.pos[0], after.pos[0], alpha),
        lerp(before.pos[1], after.pos[1], alpha),
        lerp(before.pos[2], after.pos[2], alpha),
      ],
      [
        lerp(before.target[0], after.target[0], alpha),
        lerp(before.target[1], after.target[1], alpha),
        lerp(before.target[2], after.target[2], alpha),
      ],
    );
  }

  /**
   * Apply a single camera position/target to the host, ignoring failures.
   * @param pos Camera position [x, y, z].
   * @param target Controls look-at target [x, y, z].
   */
  private applyCameraSample(
    pos: [number, number, number],
    target: [number, number, number],
  ): void {
    try {
      this.host.applyCamera(pos, target);
    } catch {
      // ignore
    }
  }

  /**
   * Wrap an event payload with the replay marker so the recorder ignores it
   * if a recording is running during playback. Non-object payloads are
   * boxed under a `value` key.
   * @param payload The original recorded payload.
   * @returns A marked payload safe to emit on the bus.
   */
  private markPayload(payload: any): any {
    if (payload === undefined || payload === null) {
      return { [REPLAY_PAYLOAD_MARKER]: true };
    }
    if (typeof payload === 'object' && !Array.isArray(payload)) {
      return { ...payload, [REPLAY_PAYLOAD_MARKER]: true };
    }
    return { value: payload, [REPLAY_PAYLOAD_MARKER]: true };
  }
}

/**
 * Linear interpolation between two numbers.
 * @param a Start value.
 * @param b End value.
 * @param alpha Fraction in [0, 1].
 * @returns The interpolated value.
 */
function lerp(a: number, b: number, alpha: number): number {
  return a + (b - a) * alpha;
}
