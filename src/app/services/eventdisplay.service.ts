import { Injectable } from '@angular/core';
import { EventDisplay } from '../api/event-display';

/**
 * Service for all event display related functions.
 */
@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {
  instance: EventDisplay = new EventDisplay();
}
