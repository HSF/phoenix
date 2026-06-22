import {
  ChangeDetectorRef,
  Component,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { type SessionManager, type SessionState } from 'phoenix-event-display';
import { EventDisplayService } from '../../services/event-display.service';

const SPEEDS: ReadonlyArray<0.5 | 1 | 2 | 4> = [0.5, 1, 2, 4] as const;

/**
 * Floating session pill (#883). Renders only while the session manager is
 * recording, paused, finished, or playing a replay. Idle state hides the
 * pill entirely so it adds zero footprint to the toolbar.
 */
@Component({
  standalone: false,
  selector: 'app-session-pill',
  templateUrl: './session-pill.component.html',
  styleUrls: ['./session-pill.component.scss'],
})
export class SessionPillComponent implements OnInit, OnDestroy {
  /** Current session-manager state, kept in component for template binding. */
  state: SessionState = { kind: 'idle' };

  /** Cached duration label for the recording elapsed clock. */
  durationLabel = '00:00';
  /** Cached current/total label for the playback clock. */
  playbackLabel = '00:00 / 00:00';
  /** Cached event count for the recording badge. */
  eventCount = 0;
  /** Last computed scrub percent (0-100). */
  scrubPercent = 0;
  /** Saved copy-link feedback flag (resets after a tick). */
  linkCopied = false;
  /** Available playback speeds for the speed selector. */
  speeds = SPEEDS;

  private sessionManager: SessionManager;
  private unsubscribeState: (() => void) | null = null;
  private recordingClockId: ReturnType<typeof setInterval> | null = null;
  private copiedResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private eventDisplay: EventDisplayService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sessionManager = this.eventDisplay.getSessionManager();
    this.state = this.sessionManager.state.value ?? { kind: 'idle' };
    this.unsubscribeState = this.sessionManager.state.onUpdate((next) => {
      this.state = next;
      this.refreshDerived();
      this.cdr.detectChanges();
    });
    this.refreshDerived();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }
    if (this.recordingClockId) {
      clearInterval(this.recordingClockId);
      this.recordingClockId = null;
    }
    if (this.copiedResetTimer) {
      clearTimeout(this.copiedResetTimer);
      this.copiedResetTimer = null;
    }
  }

  /** True when the pill should be visible. Idle state hides it. */
  get visible(): boolean {
    return this.state.kind !== 'idle';
  }

  /** Stop an active recording from the pill's stop button. */
  onStopRecording(): void {
    this.sessionManager.stopRecording();
  }

  /** Dismiss a recorded/finished/errored state and return to idle. */
  onDismiss(): void {
    if (this.state.kind === 'recorded') {
      this.sessionManager.clearRecorded();
    } else {
      this.sessionManager.stopPlayback();
    }
  }

  /** Start a pending (link-supplied) session after explicit user confirmation. */
  onPlayPending(): void {
    this.sessionManager.playPending();
  }

  /** Source label + duration/event summary for the pending confirm prompt. */
  get pendingSummary(): string {
    if (this.state.kind !== 'pending') return '';
    const { session } = this.state;
    return `${formatClock(session.duration)} · ${session.events.length} events`;
  }

  /** Toggle play/pause on the active player. */
  onTogglePlayback(): void {
    if (this.state.kind === 'playing') {
      this.sessionManager.pause();
    } else if (this.state.kind === 'paused' || this.state.kind === 'finished') {
      this.sessionManager.play();
    }
  }

  /** Scrub to the playhead position the user clicked. */
  onScrub(value: number): void {
    this.sessionManager.seek(value);
  }

  /** Change the active player's speed. */
  onSpeed(speed: 0.5 | 1 | 2 | 4): void {
    this.sessionManager.setSpeed(speed);
  }

  /** Download the recorded session as a .phnxreplay JSON file. */
  onDownload(): void {
    const blob = this.sessionManager.getDownloadBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phoenix-session-${Date.now()}.phnxreplay`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy a ?replay=... share link to the clipboard. The base64 is precomputed
   * when recording stops, so the common path writes synchronously inside the
   * click gesture (the async Clipboard API rejects writes that happen after an
   * await, which expires the user activation). Falls back to execCommand.
   */
  onCopyLink(): void {
    const cached = this.sessionManager.getCachedSharableBase64();
    if (cached) {
      this.copyShareLink(cached);
      return;
    }
    // Encode not finished yet (very fast click): compute then copy via the
    // synchronous execCommand fallback, which tolerates the post-await case.
    this.sessionManager.getSharableBase64().then((base64) => {
      if (base64) this.copyShareLink(base64);
    });
  }

  /** Build the share URL for a base64 payload and copy it to the clipboard. */
  private copyShareLink(base64: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set('replay', base64);
    const text = url.toString();

    const onCopied = () => {
      this.linkCopied = true;
      if (this.copiedResetTimer) clearTimeout(this.copiedResetTimer);
      this.copiedResetTimer = setTimeout(() => {
        this.linkCopied = false;
        this.cdr.detectChanges();
      }, 2000);
      this.cdr.detectChanges();
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onCopied, () => {
        if (this.legacyCopy(text)) onCopied();
      });
    } else if (this.legacyCopy(text)) {
      onCopied();
    }
  }

  /**
   * Legacy clipboard copy via a temporary textarea + execCommand. Used as a
   * fallback when the async Clipboard API is unavailable or rejected. Mirrors
   * the share-link dialog's proven approach.
   * @param text The text to copy.
   * @returns True if the copy command reported success.
   */
  private legacyCopy(text: string): boolean {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(el);
    return ok;
  }

  /** Active player duration (ms) for the scrub bar max value. */
  get playerDuration(): number {
    if ('player' in this.state && this.state.player) {
      return this.state.player.duration;
    }
    if (this.state.kind === 'recorded') return this.state.session.duration;
    return 0;
  }

  /** Active player current speed for the selector highlight. */
  get currentSpeed(): number {
    if ('player' in this.state && this.state.player) {
      return this.state.player.speed;
    }
    return 1;
  }

  private refreshDerived(): void {
    if (this.state.kind === 'recording') {
      this.startRecordingClock();
      this.updateRecordingDerived();
      return;
    }
    this.stopRecordingClock();
    if (this.state.kind === 'recorded') {
      this.eventCount = this.state.session.events.length;
      this.durationLabel = formatClock(this.state.session.duration);
      this.playbackLabel = '';
      this.scrubPercent = 0;
      return;
    }
    if (
      this.state.kind === 'playing' ||
      this.state.kind === 'paused' ||
      this.state.kind === 'finished'
    ) {
      const player = this.state.player;
      const current =
        this.state.kind === 'finished' ? player.duration : player.currentTime;
      this.eventCount = player.eventCount;
      this.playbackLabel = `${formatClock(current)} / ${formatClock(player.duration)}`;
      this.scrubPercent =
        player.duration > 0 ? (current / player.duration) * 100 : 0;
      return;
    }
  }

  private startRecordingClock(): void {
    if (this.recordingClockId) return;
    this.recordingClockId = setInterval(() => {
      this.updateRecordingDerived();
      this.cdr.detectChanges();
    }, 250);
  }

  private stopRecordingClock(): void {
    if (this.recordingClockId) {
      clearInterval(this.recordingClockId);
      this.recordingClockId = null;
    }
  }

  private updateRecordingDerived(): void {
    if (this.state.kind !== 'recording') return;
    const recorder = this.state.recorder;
    this.durationLabel = formatClock(recorder.duration);
    this.eventCount = recorder.eventCount;
  }
}

function formatClock(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
