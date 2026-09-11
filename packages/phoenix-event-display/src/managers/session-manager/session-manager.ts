import { ActiveVariable } from '../../helpers/active-variable';
import {
  decodeSessionFromBase64,
  decodeSessionFromJson,
  encodeSessionToBase64,
  encodeSessionToBlob,
} from './session-codec';
import { SessionSource, SessionV1 } from './session-format';
import { PlayerHost, SessionPlayer } from './session-player';
import { RecorderHost, SessionRecorder } from './session-recorder';

/**
 * Discriminated union the {@link SessionManager.state} observable carries.
 * UI components subscribe to this to render the floating session pill.
 */
export type SessionState =
  | { kind: 'idle' }
  | { kind: 'recording'; recorder: SessionRecorder }
  | { kind: 'recorded'; session: SessionV1 }
  | { kind: 'pending'; session: SessionV1; sourceLabel: string }
  | { kind: 'playing'; player: SessionPlayer; currentTime: number }
  | { kind: 'paused'; player: SessionPlayer; currentTime: number }
  | { kind: 'finished'; player: SessionPlayer }
  | { kind: 'error'; message: string };

/** Host capabilities the SessionManager needs from the EventDisplay. */
export interface SessionManagerHost extends RecorderHost, PlayerHost {}

/**
 * Coordinator that wires {@link SessionRecorder} and {@link SessionPlayer}
 * to a single observable state. Exposed via EventDisplay.getSessionManager.
 * Mirrors the singleton pattern of {@link StateManager}.
 */
export class SessionManager {
  /** Reactive state for the UI pill. */
  public readonly state = new ActiveVariable<SessionState>({ kind: 'idle' });

  /** Active recorder instance, or null when not recording. */
  private recorder: SessionRecorder | null = null;
  /** Active player instance, or null when no replay is loaded. */
  private player: SessionPlayer | null = null;
  /** Decoded-but-not-yet-played session awaiting explicit user confirmation. */
  private pendingSession: SessionV1 | null = null;
  /**
   * Share-link base64 precomputed when a recording stops, so the UI can copy
   * it synchronously inside the click gesture (the Clipboard API rejects a
   * write that happens after an await, which would consume the gesture).
   */
  private sharableBase64Cache: string | null = null;
  /** Unsubscribe for the active player's tick callback. */
  private tickUnsub: (() => void) | null = null;
  /** Unsubscribe for the active player's complete callback. */
  private completeUnsub: (() => void) | null = null;

  /**
   * Create a session manager bound to a host adapter.
   * @param host Adapter exposing the event bus, state, and camera apply.
   */
  constructor(private host: SessionManagerHost) {}

  /** True when a recording is currently capturing events. */
  public get isRecording(): boolean {
    return this.recorder?.isRecording === true;
  }

  /** True when a player is currently in the playing state. */
  public get isPlaying(): boolean {
    return this.player?.isPlaying === true;
  }

  /** Active recorder, if any. */
  public getRecorder(): SessionRecorder | null {
    return this.recorder;
  }

  /** Active player, if any. */
  public getPlayer(): SessionPlayer | null {
    return this.player;
  }

  /**
   * Start a new recording (no-op if one is already running).
   * @param source Optional dataset/route metadata recorded in the session.
   */
  public startRecording(source?: SessionSource): void {
    if (this.recorder?.isRecording) return;
    this.stopPlaybackIfAny();
    this.recorder = new SessionRecorder(this.host);
    this.recorder.start({ source });
    this.state.update({ kind: 'recording', recorder: this.recorder });
  }

  /**
   * Stop the active recording and transition state to 'recorded' so the UI
   * can offer download / share. Returns the finalized session.
   */
  public stopRecording(): SessionV1 | null {
    if (!this.recorder) return null;
    const session = this.recorder.stop();
    this.recorder = null;
    this.state.update({ kind: 'recorded', session });
    // Precompute the share link so the pill can copy it synchronously inside
    // the user's click (compression is async and would otherwise expire the
    // gesture, making navigator.clipboard.writeText reject).
    this.sharableBase64Cache = null;
    encodeSessionToBase64(session)
      .then((b64) => {
        this.sharableBase64Cache = b64;
      })
      .catch(() => {
        this.sharableBase64Cache = null;
      });
    return session;
  }

  /**
   * Synchronously return the precomputed share-link base64 for the recorded
   * session, or null if not recorded or the encode has not finished yet.
   */
  public getCachedSharableBase64(): string | null {
    if (this.state.value?.kind !== 'recorded') return null;
    return this.sharableBase64Cache;
  }

  /**
   * Convenience: if recording, stop. Otherwise start.
   * Bound to the Shift+Ctrl+R keyboard shortcut.
   * @param source Optional source metadata used when starting a recording.
   */
  public toggleRecording(source?: SessionSource): void {
    if (this.recorder?.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording(source);
    }
  }

  /** Discard the current recorded session and return to idle. */
  public clearRecorded(): void {
    this.sharableBase64Cache = null;
    if (this.state.value?.kind === 'recorded') {
      this.state.update({ kind: 'idle' });
    }
  }

  /**
   * Decode + validate a base64 `?replay=` payload and stage it for playback,
   * WITHOUT starting it. Sets state to 'pending' so the UI can require an
   * explicit user click before replaying untrusted, link-supplied content.
   * @param base64 Base64 input from the URL.
   * @param sourceLabel Human-readable origin shown in the confirm UI.
   * @throws Error if decoding/validation fails (also exposed via state.error).
   */
  public async prepareFromBase64(
    base64: string,
    sourceLabel: string,
  ): Promise<void> {
    try {
      const session = await decodeSessionFromBase64(base64);
      this.setPending(session, sourceLabel);
    } catch (e) {
      this.state.update({ kind: 'error', message: errorMessage(e) });
      throw e;
    }
  }

  /**
   * Decode + validate a `.phnxreplay` JSON payload and stage it for playback
   * without starting it (see {@link prepareFromBase64}).
   * @param text JSON text contents.
   * @param sourceLabel Human-readable origin shown in the confirm UI.
   * @throws Error if validation fails.
   */
  public prepareFromJsonText(text: string, sourceLabel: string): SessionV1 {
    try {
      const session = decodeSessionFromJson(text);
      this.setPending(session, sourceLabel);
      return session;
    } catch (e) {
      this.state.update({ kind: 'error', message: errorMessage(e) });
      throw e;
    }
  }

  /**
   * Start the pending session after explicit user confirmation. No-op if the
   * manager is not in the 'pending' state.
   */
  public playPending(): void {
    if (this.state.value?.kind !== 'pending' || !this.pendingSession) return;
    const session = this.pendingSession;
    this.pendingSession = null;
    this.attachPlayer(new SessionPlayer(this.host, session));
    this.player?.play();
  }

  /**
   * Load a session from a base64 ?replay= URL parameter and start playing.
   * For programmatic/trusted callers; the URL path uses
   * {@link prepareFromBase64} so link-supplied content is not auto-run.
   * @param base64 Base64 input from the URL.
   * @throws Error if decoding/validation fails (also exposed via state.error).
   */
  public async loadAndPlayBase64(base64: string): Promise<void> {
    try {
      const session = await decodeSessionFromBase64(base64);
      this.attachPlayer(new SessionPlayer(this.host, session));
      this.player?.play();
    } catch (e) {
      this.state.update({ kind: 'error', message: errorMessage(e) });
      throw e;
    }
  }

  /**
   * Load a session from a `.phnxreplay` JSON file (e.g. uploaded by user).
   * @param text JSON text contents of the file.
   * @throws Error if validation fails.
   */
  public loadFromJsonText(text: string): SessionV1 {
    try {
      const session = decodeSessionFromJson(text);
      this.attachPlayer(new SessionPlayer(this.host, session));
      return session;
    } catch (e) {
      this.state.update({ kind: 'error', message: errorMessage(e) });
      throw e;
    }
  }

  /** Start playback on a loaded player (no-op if none loaded). */
  public play(): void {
    this.player?.play();
  }

  /** Pause the active player. */
  public pause(): void {
    if (!this.player) return;
    this.player.pause();
    this.state.update({
      kind: 'paused',
      player: this.player,
      currentTime: this.player.currentTime,
    });
  }

  /** Seek the active player to a specific playhead position. */
  public seek(t: number): void {
    this.player?.seek(t);
  }

  /** Change the active player's speed multiplier. */
  public setSpeed(speed: 0.5 | 1 | 2 | 4): void {
    this.player?.setSpeed(speed);
  }

  /** Stop and detach any active player. Resets state to idle. */
  public stopPlayback(): void {
    this.stopPlaybackIfAny();
    this.pendingSession = null;
    if (this.state.value?.kind !== 'recording') {
      this.state.update({ kind: 'idle' });
    }
  }

  /**
   * Stage a decoded session as pending (awaiting user confirmation) and
   * publish the 'pending' state for the UI. Stops any active playback first.
   * @param session The validated session to stage.
   * @param sourceLabel Human-readable origin (host or 'shared link').
   */
  private setPending(session: SessionV1, sourceLabel: string): void {
    this.stopPlaybackIfAny();
    this.pendingSession = session;
    this.state.update({ kind: 'pending', session, sourceLabel });
  }

  /**
   * Encode the most recently recorded session as base64 for the share URL.
   * @returns Base64 string, or null if there's no recorded session in state.
   */
  public async getSharableBase64(): Promise<string | null> {
    if (this.state.value?.kind !== 'recorded') return null;
    return encodeSessionToBase64(this.state.value.session);
  }

  /**
   * Produce a downloadable Blob of the most recently recorded session.
   * @returns Blob (application/json) or null if no recorded session.
   */
  public getDownloadBlob(): Blob | null {
    if (this.state.value?.kind !== 'recorded') return null;
    return encodeSessionToBlob(this.state.value.session);
  }

  /** Release all resources. Called from EventDisplay.cleanup. */
  public cleanup(): void {
    if (this.recorder?.isRecording) {
      try {
        this.recorder.stop();
      } catch {
        // ignore
      }
    }
    this.recorder = null;
    this.pendingSession = null;
    this.stopPlaybackIfAny();
    this.state.update({ kind: 'idle' });
  }

  /**
   * Replace any active player with a new one and wire its tick/complete
   * callbacks into the reactive state. Transitions state to 'playing'.
   * @param player The player to attach.
   */
  private attachPlayer(player: SessionPlayer): void {
    this.stopPlaybackIfAny();
    this.player = player;
    this.tickUnsub = player.onTick((t) => {
      if (player.isPlaying) {
        this.state.update({ kind: 'playing', player, currentTime: t });
      }
    });
    this.completeUnsub = player.onComplete(() => {
      this.state.update({ kind: 'finished', player });
    });
    this.state.update({ kind: 'playing', player, currentTime: 0 });
  }

  /** Stop and detach the active player and its callbacks, if any. */
  private stopPlaybackIfAny(): void {
    if (this.player) {
      try {
        this.player.stop();
      } catch {
        // ignore
      }
    }
    if (this.tickUnsub) {
      this.tickUnsub();
      this.tickUnsub = null;
    }
    if (this.completeUnsub) {
      this.completeUnsub();
      this.completeUnsub = null;
    }
    this.player = null;
  }
}

/**
 * Extract a human-readable message from an unknown thrown value.
 * @param e The caught value.
 * @returns The error message string.
 */
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
