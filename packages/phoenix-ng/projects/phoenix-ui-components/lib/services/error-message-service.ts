import { Injectable } from '@angular/core';
import { ActiveVariable } from 'phoenix-event-display';

@Injectable({
  providedIn: 'root',
})
export class ErrorMessageService {
  /** A variable that stores the latest error thrown. */
  private error = new ActiveVariable<Error>();

  /**
   * Subscribe to when an error occurs.
   * @param callback A function called when an error occurs.
   * @returns A function that can be called to unsubscribe from error notifications.
   */
  subscribeToError(callback: (error: Error) => void): () => void {
    return this.error.onUpdate(callback);
  }

  /**
   * Set the current error.
   * @param error The error that has occurred.
   */
  setError(error: Error) {
    this.error.update(error);
  }
}
