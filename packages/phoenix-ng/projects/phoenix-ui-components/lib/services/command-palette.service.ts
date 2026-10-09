import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Small bridge that lets any UI (a toolbar button, a menu item) open the
 * command palette without holding a direct reference to it. The palette is
 * mounted in the ui-menu wrapper, while its toolbar button sits among the
 * projected toolbar items, so they cannot reference each other through the
 * template; this service decouples them. Experiment-agnostic: every section's
 * shared toolbar can offer the button.
 */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly openSubject = new Subject<void>();

  /** Emits whenever something requests that the palette be opened. */
  readonly openRequested: Observable<void> = this.openSubject.asObservable();

  /** Request that the command palette open. */
  open(): void {
    this.openSubject.next();
  }
}
