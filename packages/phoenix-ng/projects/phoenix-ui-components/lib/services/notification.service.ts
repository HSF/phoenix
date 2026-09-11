import { Injectable } from '@angular/core';
import { ActiveVariable } from 'phoenix-event-display';

/** Severity levels for notifications. */
export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

/** A notification message with severity and content. */
export interface Notification {
  /** The message to display to the user. */
  message: string;
  /** The severity level of the notification. */
  severity: NotificationSeverity;
  /** Duration in milliseconds before auto-dismiss. 0 means no auto-dismiss. */
  duration: number;
}

/**
 * Service for displaying user-facing notifications with severity levels.
 * Provides success, info, warning, and error notifications with
 * configurable auto-dismiss durations. Replaces silent console errors
 * with actionable user feedback across all Phoenix components.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  /** Default auto-dismiss durations in milliseconds per severity level. */
  private readonly defaultDurations: Record<NotificationSeverity, number> = {
    success: 5000,
    info: 5000,
    warning: 8000,
    error: 0,
  };

  /** Active variable that stores the latest notification. */
  private notification = new ActiveVariable<Notification>();

  /**
   * Subscribe to incoming notifications.
   * @param callback Function called when a notification is emitted.
   * @returns A function that can be called to unsubscribe.
   */
  subscribeToNotifications(
    callback: (notification: Notification) => void,
  ): () => void {
    return this.notification.onUpdate(callback);
  }

  /**
   * Display a success notification.
   * Auto-dismisses after 5 seconds by default.
   * @param message The message to display.
   * @param duration Optional custom duration in ms. 0 means no auto-dismiss.
   */
  success(message: string, duration?: number): void {
    this.notify(message, 'success', duration);
  }

  /**
   * Display an info notification.
   * Auto-dismisses after 5 seconds by default.
   * @param message The message to display.
   * @param duration Optional custom duration in ms. 0 means no auto-dismiss.
   */
  info(message: string, duration?: number): void {
    this.notify(message, 'info', duration);
  }

  /**
   * Display a warning notification.
   * Auto-dismisses after 8 seconds by default.
   * @param message The message to display.
   * @param duration Optional custom duration in ms. 0 means no auto-dismiss.
   */
  warning(message: string, duration?: number): void {
    this.notify(message, 'warning', duration);
  }

  /**
   * Display an error notification.
   * Does not auto-dismiss by default — requires manual dismissal.
   * @param message The message to display.
   * @param duration Optional custom duration in ms. 0 means no auto-dismiss.
   */
  error(message: string, duration?: number): void {
    this.notify(message, 'error', duration);
  }

  /**
   * Internal method to emit a notification.
   * @param message The message to display.
   * @param severity The severity level.
   * @param duration Optional custom duration override.
   */
  private notify(
    message: string,
    severity: NotificationSeverity,
    duration?: number,
  ): void {
    this.notification.update({
      message,
      severity,
      duration: duration ?? this.defaultDurations[severity],
    });
  }
}
