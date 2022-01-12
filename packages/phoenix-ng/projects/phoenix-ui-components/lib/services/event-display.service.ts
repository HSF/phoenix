import { Injectable } from '@angular/core';
import { EventDisplay } from 'phoenix-event-display';

/**
 * Service for all event display related functions.
 */
@Injectable({
  providedIn: 'root',
})
export class EventDisplayService extends EventDisplay {
  /**
   * Instantiate the event display by calling the parent constructor.
   */
  constructor() {
    super();
  }
}
