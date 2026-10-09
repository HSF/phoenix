import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import type {
  Command,
  CommandProperty,
  CommandRegistry,
} from 'phoenix-event-display';
import type { Subscription } from 'rxjs';
import { EventDisplayService } from '../../services/event-display.service';
import { NotificationService } from '../../services/notification.service';
import {
  NaturalLanguageService,
  type NlOutcome,
} from '../../services/natural-language.service';
import { CommandPaletteService } from '../../services/command-palette.service';

/**
 * Command palette (#942). Opens on Ctrl/Cmd+K or from the toolbar button (via
 * {@link CommandPaletteService}), lists the registered commands, prompts for
 * parameters from each command's inputSchema, and runs them through the command
 * registry. Self-hiding, so it works even when the toolbar is hidden.
 */
@Component({
  standalone: false,
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  /** Whether the palette overlay is visible. */
  open = false;
  /** Current search query. */
  query = '';
  /** Commands matching the current query, in registry order. */
  filtered: Command[] = [];
  /** Index of the highlighted command in the filtered list. */
  selectedIndex = 0;
  /** Command awaiting parameter input, or null when picking from the list. */
  activeCommand: Command | null = null;
  /** Working parameter values for the active command's form. */
  paramValues: Record<string, any> = {};
  /**
   * Fields rendered by the parameter form, built ONCE when a command's form
   * opens. This is a stable array (with precomputed option lists) iterated by
   * `*ngFor` + `trackBy`. It must NOT be a template method call: a method that
   * returns a fresh array every change-detection cycle makes `*ngFor` recreate
   * its embedded `[(ngModel)]` inputs each cycle, whose value-accessor writes
   * schedule another cycle, spinning into an infinite change-detection loop
   * that hard-freezes the tab.
   */
  formFields: { name: string; prop: CommandProperty; options: string[] }[] = [];

  /** Current panel mode: pick from the list, or ask in natural language. */
  mode: 'commands' | 'ask' = 'commands';
  /** The natural-language request being typed in ask mode. */
  askText = '';
  /** True while a request is being interpreted/run. */
  askBusy = false;
  /** The last ask outcome (interpreted command + result, or an error). */
  askOutcome: NlOutcome | null = null;
  /**
   * True after an empty Ask was submitted, so the panel shows a gentle hint
   * instead of ignoring the Enter press. Cleared once the user types.
   */
  askNeedsText = false;
  /**
   * Prefix of each command option's element id. The combobox points
   * aria-activedescendant at `optionIdPrefix + selectedIndex` and keyboard
   * scrolling looks up the same id, so the two can never drift apart.
   */
  readonly optionIdPrefix = 'cmdp-option-';

  private registry!: CommandRegistry;
  private keydownHandler = (e: KeyboardEvent) => this.onDocumentKeydown(e);
  private mousedownHandler = (e: MouseEvent) => this.onDocMouseDown(e);
  private openSub?: Subscription;
  /**
   * Element that had focus before the palette opened. Focus goes back there on
   * close (APG modal dialog pattern), so a keyboard user lands where they were
   * instead of on the page body.
   */
  private returnFocusTo: HTMLElement | null = null;
  /**
   * Set in ngOnDestroy. A model download or an ask can settle seconds after the
   * palette is gone, and detectChanges on a destroyed view throws.
   */
  private destroyed = false;

  /**
   * @param eventDisplay The Phoenix event display service.
   * @param cdr Change detector for pushing updates outside Angular events.
   * @param notification Service for success/error toasts after a command runs.
   * @param elementRef Host element, used to detect clicks outside the panel.
   * @param ngZone Angular zone; palette listeners run outside it so mouse and
   *   key events never trigger Phoenix's expensive app-wide change detection.
   */
  constructor(
    private eventDisplay: EventDisplayService,
    private cdr: ChangeDetectorRef,
    private notification: NotificationService,
    private elementRef: ElementRef<HTMLElement>,
    private ngZone: NgZone,
    private nl: NaturalLanguageService,
    private commandPalette: CommandPaletteService,
  ) {}

  /**
   * Cache the command registry and register the global key/mouse listeners
   * OUTSIDE Angular's zone. Bound via @HostListener they would run in-zone and
   * schedule a full app-wide change-detection tick on every keystroke and
   * mouse press anywhere in Phoenix (~seconds on the heavy 3D scene). Running
   * them outside the zone and re-rendering only the palette via detectChanges
   * keeps interaction cheap.
   */
  ngOnInit(): void {
    this.registry = this.eventDisplay.getCommandRegistry();
    this.filtered = this.registry.list();
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('keydown', this.keydownHandler);
      document.addEventListener('mousedown', this.mousedownHandler);
    });
    // Toolbar button (or any other UI) can request the palette open. This fires
    // from an in-zone click, so openPalette's detectChanges renders normally.
    this.openSub = this.commandPalette.openRequested.subscribe(() =>
      this.openPalette(),
    );
  }

  /** Remove the global listeners and the open subscription. */
  ngOnDestroy(): void {
    this.destroyed = true;
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('mousedown', this.mousedownHandler);
    this.openSub?.unsubscribe();
  }

  /**
   * Global keyboard handler: Ctrl/Cmd+K toggles the palette (excluding AltGr
   * combos); Escape closes; Arrow keys and Enter drive the list while open.
   * Runs outside Angular's zone, so view changes are flushed via detectChanges.
   * @param event The keydown event.
   */
  onDocumentKeydown(event: KeyboardEvent): void {
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      event.key?.toLowerCase() === 'k'
    ) {
      event.preventDefault();
      this.toggle();
      return;
    }
    if (!this.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    // In ask mode, or while a parameter form is open, let the inputs handle
    // keys (the ask box runs the request on its own Enter binding).
    if (this.mode === 'ask' || this.activeCommand) return;
    // The list is driven through the search combobox. With focus on a mode tab
    // (or any other control) Enter must activate that control, not run
    // whichever command happens to be highlighted.
    const target = event.target as HTMLElement | null;
    if (
      target?.matches?.('button, a, select, textarea, input:not(.cmdp-input)')
    ) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = Math.min(
        this.selectedIndex + 1,
        this.filtered.length - 1,
      );
      this.cdr.detectChanges();
      this.scrollSelectedIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.cdr.detectChanges();
      this.scrollSelectedIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = this.filtered[this.selectedIndex];
      if (cmd) this.choose(cmd);
    }
  }

  /**
   * Close the palette when the user presses down outside the panel. Uses
   * mousedown (not click) so containment is checked before Angular re-renders:
   * clicking a command that opens a parameter form detaches the clicked list
   * item, which would make a later bubbled click look "outside" and wrongly
   * close the panel.
   * Runs outside Angular's zone; close() flushes the view via detectChanges.
   * @param event The mousedown event.
   */
  onDocMouseDown(event: MouseEvent): void {
    if (!this.open) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /** Toggle the palette open/closed. */
  toggle(): void {
    if (this.open) this.close();
    else this.openPalette();
  }

  /**
   * Open the palette, resetting query and selection, and move focus into the
   * search input so the shortcut can be followed straight by typing.
   */
  openPalette(): void {
    // Only record the return target on a real open. A second open request
    // while already open would otherwise record an element inside the panel.
    if (!this.open) {
      this.returnFocusTo = document.activeElement as HTMLElement | null;
    }
    this.open = true;
    this.query = '';
    this.activeCommand = null;
    this.formFields = [];
    this.selectedIndex = 0;
    this.mode = 'commands';
    this.askText = '';
    this.askOutcome = null;
    this.askBusy = false;
    this.askNeedsText = false;
    this.filtered = this.registry.list();
    this.cdr.detectChanges();
    this.focusFirstControl();
  }

  /**
   * Close the palette, clear transient state, and return focus to the element
   * that had it before the palette opened.
   */
  close(): void {
    const wasOpen = this.open;
    this.open = false;
    this.activeCommand = null;
    this.formFields = [];
    this.askOutcome = null;
    this.askBusy = false;
    this.cdr.detectChanges();
    if (wasOpen) this.restoreFocus();
  }

  /**
   * Switch between picking a command from the list and asking in natural
   * language. Clears the last ask result and moves focus into the input the
   * new mode shows.
   * @param mode The mode to switch to.
   */
  setMode(mode: 'commands' | 'ask'): void {
    // The tabs are hidden while a parameter form is open, but a programmatic
    // switch must not leave the form and the new mode active at once.
    this.activeCommand = null;
    this.formFields = [];
    this.mode = mode;
    this.askOutcome = null;
    this.askNeedsText = false;
    this.cdr.detectChanges();
    this.focusFirstControl();
  }

  /** Whether an in-browser model can be offered (app-provided + WebGPU). */
  get aiModelAvailable(): boolean {
    return this.nl.isModelAvailable();
  }

  /** The natural-language service status (idle/loading/ready/thinking/error). */
  get aiStatus(): string {
    return this.nl.status;
  }

  /** Model-load progress as a 0..100 integer, for the progress label. */
  get aiProgressPercent(): number {
    return Math.round((this.nl.progress?.progress ?? 0) * 100);
  }

  /** Opt in to the in-browser model (lazy one-time load). */
  async enableAi(): Promise<void> {
    try {
      await this.nl.enableModel();
    } catch {
      /* status/lastError already set by the service; UI shows the fallback */
    }
    this.render();
  }

  /**
   * Interpret and run the typed natural-language request. Delegates to the
   * natural-language service (model when available, else keyword fallback),
   * which only ever runs a registered, schema-validated command. Keeps the
   * panel open so the outcome is visible and follow-up requests are easy.
   * Never rejects: it is called un-awaited from the template, so a failure is
   * shown in the outcome instead.
   */
  async runAsk(): Promise<void> {
    if (this.askBusy) return;
    const text = this.askText.trim();
    if (!text) {
      // Enter on an empty box used to do nothing at all, which reads as broken.
      this.askNeedsText = true;
      this.render();
      return;
    }
    this.askNeedsText = false;
    this.askBusy = true;
    this.askOutcome = null;
    this.render();
    let outcome: NlOutcome;
    try {
      outcome = await this.nl.ask(text);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      outcome = {
        ok: false,
        error: `Sorry, something went wrong (${detail}). Please try again.`,
      };
    } finally {
      // Without this a rejection left askBusy stuck, and the single-flight
      // guard above then ignored every later Enter.
      this.askBusy = false;
    }
    this.askOutcome = outcome;
    if (outcome.ok) this.askText = '';
    this.render();
  }

  /**
   * Run the command the student was offered as "did you mean ...?". Only ever
   * reached by an explicit click, which is the whole point: a mistyped command
   * is proposed, never executed on a guess.
   * @param suggestion The proposed command and arguments.
   */
  async runSuggestion(suggestion: {
    command: string;
    args: Record<string, any>;
    label: string;
  }): Promise<void> {
    const res = await this.registry.execute(
      suggestion.command,
      suggestion.args,
    );
    this.askOutcome = res.ok
      ? { ok: true, command: suggestion.command, usedFallback: true }
      : {
          ok: false,
          error: (res as { error?: string }).error ?? 'Command failed',
        };
    this.render();
  }

  /**
   * Ask about a related topic from an answer card (a one-click follow-up).
   * @param title The related topic's title.
   */
  askAbout(title: string): void {
    this.askText = 'what is ' + title;
    this.runAsk();
  }

  /**
   * Run the suggested action from an answer card. The action is a registered
   * command (validated when the knowledge base is built), executed through the
   * same registry path as everything else. The panel stays open so the student
   * sees the effect and can keep exploring.
   * @param action The command + args + label suggested by the answer.
   */
  async runAnswerAction(action: {
    command: string;
    args?: Record<string, any>;
    label: string;
  }): Promise<void> {
    const res = await this.registry.execute(action.command, action.args ?? {});
    this.askOutcome = res.ok
      ? { ok: true, command: action.command, usedFallback: true }
      : {
          ok: false,
          error: (res as { error?: string }).error ?? 'Command failed',
        };
    this.render();
  }

  /**
   * Filter the command list by a query (matches name, title, description).
   * @param query The search text.
   */
  updateQuery(query: string): void {
    this.query = query;
    const q = query.trim().toLowerCase();
    this.filtered = this.registry.list().filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.title ?? '').toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
    this.selectedIndex = 0;
    // The highlight jumps back to the first match. A list scrolled down by
    // earlier arrow presses would hide the command Enter now runs.
    const list =
      this.elementRef.nativeElement.querySelector<HTMLElement>('.cmdp-list');
    if (list) list.scrollTop = 0;
  }

  /**
   * Pick a command: run it immediately when it takes no parameters, otherwise
   * open its parameter form.
   * @param command The chosen command.
   */
  async choose(command: Command): Promise<void> {
    const props = command.inputSchema?.properties ?? {};
    if (Object.keys(props).length === 0) {
      await this.runNow(command, {});
      return;
    }
    this.activeCommand = command;
    this.paramValues = {};
    // Build the form fields ONCE here (stable array + precomputed options),
    // in declared order. The template iterates this field with trackBy; it
    // never calls a method that rebuilds the array each change-detection cycle.
    this.formFields = Object.entries(props).map(([name, prop]) => {
      this.paramValues[name] = prop.type === 'boolean' ? false : '';
      return { name, prop, options: this.optionsFor(prop) };
    });
    this.cdr.detectChanges();
    // The list (and the input that had focus) is gone; start at field one.
    this.focusFirstControl();
  }

  /** trackBy for the form fields: param names are unique within a command. */
  trackByName(_index: number, field: { name: string }): string {
    return field.name;
  }

  /** Leave the parameter form and return focus to the command search. */
  back(): void {
    this.activeCommand = null;
    this.formFields = [];
    this.cdr.detectChanges();
    this.focusFirstControl();
  }

  /**
   * Resolve the selectable options for a parameter, from a static enum or a
   * live enumSource (collections, presetViews, eventKeys). An empty array
   * means the field is rendered as free text. Called once per field when the
   * form opens (see `choose`), never from the template.
   * @param prop The parameter schema.
   * @returns The option strings.
   */
  optionsFor(prop: CommandProperty): string[] {
    if (prop.enum) return prop.enum.map((v) => String(v));
    switch (prop.enumSource) {
      case 'collections':
        return Object.values(this.eventDisplay.getCollections() ?? {}).flat();
      case 'presetViews':
        return (this.eventDisplay.getUIManager()?.getPresetViews() ?? []).map(
          (v: any) => v.name,
        );
      case 'eventKeys':
        return Object.keys(this.eventDisplay.getEventsData() ?? {});
      default:
        return [];
    }
  }

  /** Submit the active command's parameter form, coercing values by type. */
  async submitParams(): Promise<void> {
    if (!this.activeCommand) return;
    const props = this.activeCommand.inputSchema?.properties ?? {};
    const args: Record<string, any> = {};
    for (const [name, prop] of Object.entries(props)) {
      const raw = this.paramValues[name];
      if (raw === undefined || raw === '') continue;
      if (prop.type === 'integer' || prop.type === 'number') {
        args[name] = Number(raw);
      } else if (prop.type === 'boolean') {
        args[name] = !!raw;
      } else {
        args[name] = raw;
      }
    }
    await this.runNow(this.activeCommand, args);
  }

  /**
   * Execute a command through the registry. The palette closes FIRST so its
   * panel never sits over the live WebGL canvas while a command runs.
   *
   * On success there is NO toast: the command's own effect (theme change, axis
   * appears, camera moves) is the feedback, and opening a MatSnackBar overlay
   * on top of the continuously-rendering full-resolution 3D scene for every
   * command stalls the page. Only the rare failure path surfaces a toast.
   * @param command The command to run.
   * @param args The argument object.
   */
  async runNow(command: Command, args: Record<string, any>): Promise<void> {
    this.close();
    const res = await this.registry.execute(command.name, args);
    if (!res.ok) {
      // This workspace compiles without strictNullChecks, so truthiness
      // narrowing does not split the ok:true/false result union. Read the
      // failure message off the explicitly-typed failure variant instead.
      const failure = res as { ok: false; error?: string };
      // Re-enter the zone (listeners run outside it) so the toast renders.
      this.ngZone.run(() =>
        this.notification.error(failure.error ?? 'Command failed'),
      );
    }
  }

  /**
   * Re-render after async work (an ask, a model download, an answer-card
   * action). Skips a destroyed view, and pulls focus back into the dialog when
   * the re-render removed the button that had it.
   */
  private render(): void {
    if (this.destroyed) return;
    this.cdr.detectChanges();
    this.keepFocusInside();
  }

  /**
   * Focus the first form control the current view renders: the search or ask
   * input, or the first parameter field. Needed after any render that swaps
   * views, since *ngIf destroys the focused element and focus would otherwise
   * fall to the page body, outside the dialog.
   */
  private focusFirstControl(): void {
    if (!this.open || this.destroyed) return;
    this.elementRef.nativeElement
      .querySelector<HTMLElement>('input, select')
      ?.focus();
  }

  /** Refocus the dialog's first control if focus has fallen out of it. */
  private keepFocusInside(): void {
    if (!this.open) return;
    if (!this.elementRef.nativeElement.contains(document.activeElement)) {
      this.focusFirstControl();
    }
  }

  /**
   * Return focus to where it was before the palette opened, unless that
   * element has since left the page or was just the body.
   */
  private restoreFocus(): void {
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (
      target &&
      target !== document.body &&
      target.isConnected &&
      !this.elementRef.nativeElement.contains(target)
    ) {
      target.focus?.();
    }
  }

  /**
   * Keep the highlighted option visible. The list scrolls (only about 5 of 16
   * commands fit at 800x600), so without this Enter could run a command the
   * user cannot see.
   */
  private scrollSelectedIntoView(): void {
    this.elementRef.nativeElement
      .querySelector(`#${this.optionIdPrefix}${this.selectedIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  }
}
