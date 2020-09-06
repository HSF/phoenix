import { Injectable } from '@angular/core';
import { EventDisplay } from '../api/event-display';

declare global {
  /**
   * Window interface for adding objects to the window object.
   */
  interface Window {
    /** EventDisplay object containing event display related functions. */
    EventDisplay: any;
  }
}

/**
 * Service for all event display related functions.
 */
@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {
  instance: EventDisplay = new EventDisplay();
}
