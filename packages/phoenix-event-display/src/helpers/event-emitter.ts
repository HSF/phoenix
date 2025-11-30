/**
 * A simple, framework-independent event emitter.
 * This replaces Angular's EventEmitter to keep the library framework-agnostic.
 */
export class EventEmitter<T = any> {
  /** List of event listeners. */
  private listeners: Array<(value: T) => void> = [];

  /**
   * Subscribe to events emitted by this emitter.
   * @param listener Callback function to be called when an event is emitted.
   * @returns Unsubscribe function to remove the listener.
   */
  subscribe(listener: (value: T) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all subscribers.
   * @param value The value to emit to all listeners.
   */
  emit(value: T): void {
    this.listeners.forEach((listener) => {
      try {
        listener(value);
      } catch (error) {
        console.error('Error in EventEmitter listener:', error);
      }
    });
  }

  /**
   * Remove all listeners.
   */
  unsubscribeAll(): void {
    this.listeners = [];
  }

  /**
   * Get the number of active listeners.
   */
  get listenerCount(): number {
    return this.listeners.length;
  }
}
