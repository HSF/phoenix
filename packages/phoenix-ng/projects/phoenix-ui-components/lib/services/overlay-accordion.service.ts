import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OverlayAccordionService {
  private activePanel = new Subject<string>();
  activePanel$ = this.activePanel.asObservable();

  setActivePanel(panelId: string) {
    this.activePanel.next(panelId);
  }
}
