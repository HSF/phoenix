/**
 * Mock for @angular/core.
 *
 * phoenix-event-display only imports EventEmitter from @angular/core.
 * Angular ships as ESM-only (.mjs) which cannot be parsed by Jest's
 * CommonJS pipeline with newer TypeScript versions.
 * This provides a lightweight EventEmitter compatible with Angular's API.
 */

type Fn = (...args: any[]) => void;

export class EventEmitter<T = any> {
  private listeners: Fn[] = [];

  emit(value?: T) {
    for (const fn of this.listeners) {
      fn(value);
    }
  }

  subscribe(fn: Fn) {
    this.listeners.push(fn);
    return {
      unsubscribe: () => this.listeners.splice(this.listeners.indexOf(fn), 1),
    };
  }
}
