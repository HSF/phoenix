import { Injectable } from '@angular/core';
import { EventDisplay } from '@phoenix/event-display';

/**
 * Service for all event display related functions.
 */
@Injectable({
  providedIn: 'root'
})
export class EventDisplayService {
  /** An event display object with all event display functionality. */
  instance: EventDisplay = new EventDisplay();
}
