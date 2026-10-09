import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from '../../services/command-palette.service';

// jsdom has no layout, so scrollIntoView does not exist there.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {
    /* no-op in jsdom */
  };
}

afterEach(() => {
  document.body.innerHTML = '';
  jest.restoreAllMocks();
});

/**
 * Stand-in for Angular rendering in these direct-instantiation tests: rebuilds
 * the host DOM from component state on every detectChanges, like *ngIf would,
 * so a swapped view really destroys the element that had focus.
 */
function renderInto(c: any, host: HTMLElement, cdr: any) {
  const base = cdr.detectChanges.getMockImplementation();
  cdr.detectChanges.mockImplementation(() => {
    base?.();
    host.innerHTML = '';
    if (!c.open) return;
    if (c.activeCommand) {
      host.innerHTML =
        '<select class="cmdp-select"></select><button type="button">Back</button>';
      return;
    }
    const tabs =
      '<button type="button" class="cmdp-mode">Commands</button>' +
      '<button type="button" class="cmdp-mode">Ask</button>';
    if (c.mode === 'ask') {
      host.innerHTML = tabs + '<input class="cmdp-input" data-mode="ask" />';
      return;
    }
    host.innerHTML =
      tabs +
      '<input class="cmdp-input" data-mode="commands" /><ul class="cmdp-list">' +
      c.filtered
        .map(
          (_: any, i: number) =>
            `<li id="${c.optionIdPrefix}${i}" class="cmdp-item"></li>`,
        )
        .join('') +
      '</ul>';
  });
}

/** A focused control outside the palette, like a toolbar button. */
function focusedOutsideButton(): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = 'toolbar';
  document.body.appendChild(b);
  b.focus();
  return b;
}

function fakeCommand(name: string, extra: any = {}) {
  return {
    name,
    title: extra.title ?? name,
    description: extra.description ?? name,
    category: extra.category ?? 'View',
    inputSchema: extra.inputSchema ?? {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    mutates: extra.mutates ?? true,
    run: () => undefined,
  };
}

function make(
  commands = [
    fakeCommand('set-theme', { description: 'dark/light' }),
    fakeCommand('next-event', { category: 'Navigation' }),
  ],
) {
  const registry = {
    list: jest.fn(() => commands),
    execute: jest.fn(async () => ({ ok: true })),
  };
  const eventDisplay: any = {
    getCommandRegistry: () => registry,
    getCollections: () => ({}),
    getUIManager: () => ({ getPresetViews: () => [] }),
    getEventsData: () => ({}),
  };
  // Mirrors Angular: detectChanges on a destroyed view throws. A stub that
  // never throws cannot catch async work finishing after ngOnDestroy.
  let viewDestroyed = false;
  const cdr: any = {
    detectChanges: jest.fn(() => {
      if (viewDestroyed) {
        throw new Error('ViewDestroyedError: Attempt to use a destroyed view');
      }
    }),
  };
  const notify: any = { success: jest.fn(), error: jest.fn() };
  // A real element so focus and scrolling run against jsdom. contains is
  // spied (calling through) so the mousedown tests can still force it.
  const host: any = document.createElement('div');
  document.body.appendChild(host);
  jest.spyOn(host, 'contains');
  const elementRef: any = { nativeElement: host };
  const ngZone: any = {
    runOutsideAngular: jest.fn((fn: () => any) => fn()),
    run: jest.fn((fn: () => any) => fn()),
  };
  const nl: any = {
    ask: jest.fn(async () => ({
      ok: true,
      command: 'set-theme',
      usedFallback: true,
    })),
    isModelAvailable: jest.fn(() => false),
    enableModel: jest.fn(async () => undefined),
    status: 'idle',
    progress: { progress: 0, text: '' },
  };
  const commandPalette = new CommandPaletteService();
  const c = new CommandPaletteComponent(
    eventDisplay,
    cdr,
    notify,
    elementRef,
    ngZone,
    nl,
    commandPalette,
  );
  c.ngOnInit();
  return {
    c,
    cdr,
    /** Destroy as Angular does: ngOnDestroy, then the view is dead. */
    destroy: () => {
      c.ngOnDestroy();
      viewDestroyed = true;
    },
    registry,
    notify,
    host,
    ngZone,
    nl,
    commandPalette,
    eventDisplay,
  };
}

const key = (over: any) =>
  ({ preventDefault: jest.fn(), ...over }) as unknown as KeyboardEvent;

describe('CommandPaletteComponent (keyboard + filter)', () => {
  it('Ctrl+K opens and prevents default; again closes', () => {
    const { c } = make();
    expect(c.open).toBe(false);
    const e1 = key({ ctrlKey: true, altKey: false, key: 'k' });
    c.onDocumentKeydown(e1);
    expect(c.open).toBe(true);
    expect(e1.preventDefault).toHaveBeenCalled();
    c.onDocumentKeydown(key({ ctrlKey: true, altKey: false, key: 'k' }));
    expect(c.open).toBe(false);
  });

  it('Cmd+K also toggles (mac)', () => {
    const { c } = make();
    c.onDocumentKeydown(key({ metaKey: true, altKey: false, key: 'k' }));
    expect(c.open).toBe(true);
  });

  it('does NOT toggle on Ctrl+Alt+K (AltGr safety)', () => {
    const { c } = make();
    c.onDocumentKeydown(key({ ctrlKey: true, altKey: true, key: 'k' }));
    expect(c.open).toBe(false);
  });

  it('filters commands by query across name/description', () => {
    const { c } = make();
    c.openPalette();
    c.updateQuery('theme');
    expect(c.filtered.map((x) => x.name)).toEqual(['set-theme']);
    c.updateQuery('');
    expect(c.filtered.length).toBe(2);
  });

  it('Escape closes when open', () => {
    const { c } = make();
    c.openPalette();
    c.onDocumentKeydown(key({ key: 'Escape' }));
    expect(c.open).toBe(false);
  });

  it('ArrowDown/Up move selection within bounds', () => {
    const { c } = make();
    c.openPalette();
    expect(c.selectedIndex).toBe(0);
    c.onDocumentKeydown(key({ key: 'ArrowDown' }));
    expect(c.selectedIndex).toBe(1);
    c.onDocumentKeydown(key({ key: 'ArrowDown' }));
    expect(c.selectedIndex).toBe(1);
    c.onDocumentKeydown(key({ key: 'ArrowUp' }));
    expect(c.selectedIndex).toBe(0);
  });

  it('ignores navigation keys when closed', () => {
    const { c } = make();
    c.onDocumentKeydown(key({ key: 'ArrowDown' }));
    expect(c.open).toBe(false);
    expect(c.selectedIndex).toBe(0);
  });

  it('registers its global listeners OUTSIDE the Angular zone (no per-event app tick)', () => {
    const { ngZone } = make();
    expect(ngZone.runOutsideAngular).toHaveBeenCalled();
  });

  it('closes on a mousedown outside the panel', () => {
    const { c, host } = make();
    c.openPalette();
    host.contains.mockReturnValue(false);
    c.onDocMouseDown({ target: {} } as unknown as MouseEvent);
    expect(c.open).toBe(false);
  });

  it('stays open on a mousedown inside the panel', () => {
    const { c, host } = make();
    c.openPalette();
    host.contains.mockReturnValue(true);
    c.onDocMouseDown({ target: {} } as unknown as MouseEvent);
    expect(c.open).toBe(true);
  });
});

describe('CommandPaletteComponent (choose, params, run)', () => {
  it('runs a no-arg command immediately on choose', async () => {
    const { c, registry } = make();
    c.openPalette();
    const nav = c.filtered.find((x) => x.name === 'next-event')!;
    await c.choose(nav);
    expect(registry.execute).toHaveBeenCalledWith('next-event', {});
  });

  it('CLOSES the palette when a command runs, WITHOUT a success toast (the visible command effect is the feedback; a per-command MatSnackBar overlay stalls the heavy 3D scene)', async () => {
    const { c, notify } = make();
    c.openPalette();
    expect(c.open).toBe(true);
    await c.choose(c.filtered.find((x) => x.name === 'next-event')!);
    expect(c.open).toBe(false);
    expect(notify.success).not.toHaveBeenCalled();
  });

  it('opens a param form for a command with parameters (no execute yet)', async () => {
    const themed = fakeCommand('set-theme', {
      inputSchema: {
        type: 'object',
        properties: { dark: { type: 'boolean' } },
        required: ['dark'],
        additionalProperties: false,
      },
    });
    const { c, registry } = make([themed]);
    c.openPalette();
    await c.choose(themed);
    expect(c.activeCommand?.name).toBe('set-theme');
    expect(registry.execute).not.toHaveBeenCalled();
  });

  it('precomputes the form fields ONCE into a stable array (no per-CD template method that would loop *ngFor + ngModel)', async () => {
    const themed = fakeCommand('set-theme', {
      inputSchema: {
        type: 'object',
        properties: {
          dark: { type: 'boolean', description: 'True for dark' },
        },
        required: ['dark'],
        additionalProperties: false,
      },
    });
    const { c } = make([themed]);
    c.openPalette();
    await c.choose(themed);
    // Fields are built and carry precomputed options (not a live method call).
    expect(c.formFields.map((f) => f.name)).toEqual(['dark']);
    expect(c.formFields[0].options).toEqual([]);
    // The SAME array reference is returned every read: Angular's *ngFor differ
    // sees no change across change-detection cycles, so it never recreates the
    // ngModel inputs (which is what caused the infinite CD loop / page freeze).
    expect(c.formFields).toBe(c.formFields);
    const ref = c.formFields;
    (c as any).cdr.detectChanges();
    expect(c.formFields).toBe(ref);
  });

  it('precomputes enumSource options into the fields when the form opens', async () => {
    const cmd = fakeCommand('preset-view', {
      inputSchema: {
        type: 'object',
        properties: { view: { type: 'string', enumSource: 'presetViews' } },
        required: ['view'],
        additionalProperties: false,
      },
    });
    const { c } = make([cmd]);
    (c as any).eventDisplay.getUIManager = () => ({
      getPresetViews: () => [{ name: 'Front' }, { name: 'Side' }],
    });
    c.openPalette();
    await c.choose(cmd);
    expect(c.formFields[0].options).toEqual(['Front', 'Side']);
  });

  it('resolves enumSource options from the live service', () => {
    const cmd = fakeCommand('preset-view', {
      inputSchema: {
        type: 'object',
        properties: { view: { type: 'string', enumSource: 'presetViews' } },
        required: ['view'],
        additionalProperties: false,
      },
    });
    const { c } = make([cmd]);
    (c as any).eventDisplay.getUIManager = () => ({
      getPresetViews: () => [{ name: 'Front' }, { name: 'Side' }],
    });
    expect(c.optionsFor(cmd.inputSchema.properties.view)).toEqual([
      'Front',
      'Side',
    ]);
    (c as any).eventDisplay.getCollections = () => ({
      Tracks: ['T1'],
      Hits: ['CSC'],
    });
    expect(
      c.optionsFor({ type: 'string', enumSource: 'collections' } as any),
    ).toEqual(['T1', 'CSC']);
  });

  it('coerces numeric params from text before executing', async () => {
    const cmd = fakeCommand('highlight-object', {
      inputSchema: {
        type: 'object',
        properties: {
          collection: { type: 'string' },
          index: { type: 'integer' },
        },
        required: ['collection', 'index'],
        additionalProperties: false,
      },
    });
    const { c, registry } = make([cmd]);
    c.openPalette();
    await c.choose(cmd);
    c.paramValues = { collection: 'T1', index: '2' };
    await c.submitParams();
    expect(registry.execute).toHaveBeenCalledWith('highlight-object', {
      collection: 'T1',
      index: 2,
    });
  });

  it('toasts an error (and still closes) when a command fails', async () => {
    const { c, registry, notify } = make();
    registry.execute.mockResolvedValueOnce({ ok: false, error: 'boom' });
    c.openPalette();
    await c.choose(c.filtered.find((x) => x.name === 'next-event')!);
    expect(notify.error).toHaveBeenCalledWith('boom');
    expect(c.open).toBe(false);
  });
});

describe('CommandPaletteComponent (ask / natural-language mode)', () => {
  it('switches to ask mode and clears any previous outcome', () => {
    const { c } = make();
    c.openPalette();
    c.askOutcome = { ok: true } as any;
    c.setMode('ask');
    expect(c.mode).toBe('ask');
    expect(c.askOutcome).toBeNull();
  });

  it('runAsk delegates to the NL service and stores the outcome', async () => {
    const { c, nl } = make();
    c.openPalette();
    c.setMode('ask');
    c.askText = 'switch to dark theme';
    await c.runAsk();
    expect(nl.ask).toHaveBeenCalledWith('switch to dark theme');
    expect(c.askOutcome?.ok).toBe(true);
    expect(c.askBusy).toBe(false);
  });

  it('clears the input after a successful ask, keeps it after a failure', async () => {
    const { c, nl } = make();
    c.openPalette();
    c.setMode('ask');
    c.askText = 'do a thing';
    await c.runAsk();
    expect(c.askText).toBe(''); // success clears

    nl.ask.mockResolvedValueOnce({ ok: false, error: 'no match', none: true });
    c.askText = 'gibberish';
    await c.runAsk();
    expect(c.askText).toBe('gibberish'); // failure keeps text for editing
    expect(c.askOutcome?.ok).toBe(false);
  });

  it('ignores an empty/whitespace request (no service call)', async () => {
    const { c, nl } = make();
    c.openPalette();
    c.setMode('ask');
    c.askText = '   ';
    await c.runAsk();
    expect(nl.ask).not.toHaveBeenCalled();
  });

  it('does not drive the command list with Arrow/Enter while in ask mode', () => {
    const { c } = make();
    c.openPalette();
    c.setMode('ask');
    c.selectedIndex = 0;
    c.onDocumentKeydown(key({ key: 'ArrowDown' }));
    c.onDocumentKeydown(key({ key: 'Enter' }));
    expect(c.selectedIndex).toBe(0); // unchanged; ask input owns these keys
  });

  it('enableAi opts in through the NL service', async () => {
    const { c, nl } = make();
    await c.enableAi();
    expect(nl.enableModel).toHaveBeenCalled();
  });

  it('exposes model availability and status from the service', () => {
    const { c, nl } = make();
    expect(c.aiModelAvailable).toBe(false);
    nl.isModelAvailable.mockReturnValue(true);
    expect(c.aiModelAvailable).toBe(true);
    expect(c.aiStatus).toBe('idle');
  });
});

describe('CommandPaletteComponent (toolbar button bridge)', () => {
  it('opens when the CommandPaletteService requests it (toolbar button path)', () => {
    const { c, commandPalette } = make();
    expect(c.open).toBe(false);
    commandPalette.open();
    expect(c.open).toBe(true);
  });

  it('stops responding to open requests after destroy (no leak)', () => {
    const { c, commandPalette } = make();
    c.ngOnDestroy();
    commandPalette.open();
    expect(c.open).toBe(false);
  });
});

describe('CommandPaletteComponent (agent bridge is not its concern)', () => {
  it('does not start or stop the app-wide agent bridge', () => {
    // The bridge is owned by the application (provideAgentBridge). A palette
    // that disposed it on destroy ended it at the first route change.
    const source = CommandPaletteComponent.toString();
    expect(source).not.toMatch(/agentBridge|AgentBridge/);
  });
});

describe('CommandPaletteComponent (tutor answer card)', () => {
  it('askAbout re-asks "what is <topic>" through the NL service', () => {
    const { c, nl } = make();
    c.setMode('ask');
    c.askAbout('Eta-phi view');
    expect(nl.ask).toHaveBeenCalledWith('what is Eta-phi view');
  });

  it('runAnswerAction runs the suggested command through the registry', async () => {
    const { c, registry } = make();
    await c.runAnswerAction({
      command: 'set-theme',
      args: { dark: true },
      label: 'Switch to dark theme',
    });
    expect(registry.execute).toHaveBeenCalledWith('set-theme', { dark: true });
    expect(c.askOutcome?.ok).toBe(true);
  });

  it('ignores a second Enter while a request is still running (single flight)', async () => {
    const { c, nl } = make();
    c.setMode('ask');
    c.askText = 'spin the detector';
    let resolveFirst: (v: any) => void = () => undefined;
    nl.ask.mockImplementationOnce(
      () => new Promise((res) => (resolveFirst = res)),
    );
    const first = c.runAsk();
    // A second Enter press while the first is in flight must be dropped, or
    // two inferences would contend for the GPU and each would pause/resume the
    // render loop independently.
    await c.runAsk();
    expect(nl.ask).toHaveBeenCalledTimes(1);
    resolveFirst({ ok: true, command: 'toggle-auto-rotate' });
    await first;
  });
});

const paramCommand = () =>
  fakeCommand('set-theme', {
    inputSchema: {
      type: 'object',
      properties: { dark: { type: 'boolean' } },
      required: ['dark'],
      additionalProperties: false,
    },
  });

describe('CommandPaletteComponent (focus management, APG modal dialog)', () => {
  it('Ctrl+K moves focus into the search input so typing works straight away', () => {
    const { c, host, cdr } = make();
    renderInto(c, host, cdr);
    focusedOutsideButton();
    c.onDocumentKeydown(key({ ctrlKey: true, altKey: false, key: 'k' }));
    const input = host.querySelector('.cmdp-input');
    expect(input).not.toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('Escape returns focus to the element that was focused before opening', () => {
    const { c, host, cdr } = make();
    renderInto(c, host, cdr);
    const toolbar = focusedOutsideButton();
    c.onDocumentKeydown(key({ ctrlKey: true, altKey: false, key: 'k' }));
    expect(document.activeElement).not.toBe(toolbar);
    c.onDocumentKeydown(key({ key: 'Escape' }));
    expect(document.activeElement).toBe(toolbar);
  });

  it('running a command also returns focus to where the user was', async () => {
    const { c, host, cdr } = make();
    renderInto(c, host, cdr);
    const toolbar = focusedOutsideButton();
    c.openPalette();
    await c.choose(c.filtered.find((x) => x.name === 'next-event')!);
    expect(document.activeElement).toBe(toolbar);
  });

  it('does not try to restore focus to an element that has left the page', () => {
    const { c, host, cdr } = make();
    renderInto(c, host, cdr);
    const toolbar = focusedOutsideButton();
    c.openPalette();
    toolbar.remove();
    expect(() => c.close()).not.toThrow();
    expect(document.activeElement).not.toBe(toolbar);
  });

  it('a second open request while already open keeps the original return target', () => {
    const { c, host, cdr, commandPalette } = make();
    renderInto(c, host, cdr);
    const toolbar = focusedOutsideButton();
    c.openPalette();
    commandPalette.open(); // focus is inside the palette now
    c.close();
    expect(document.activeElement).toBe(toolbar);
  });

  it('switching mode focuses the input the new mode renders', () => {
    const { c, host, cdr } = make();
    renderInto(c, host, cdr);
    c.openPalette();
    c.setMode('ask');
    expect((document.activeElement as HTMLElement).dataset['mode']).toBe('ask');
    c.setMode('commands');
    expect((document.activeElement as HTMLElement).dataset['mode']).toBe(
      'commands',
    );
  });

  it('a parameter form focuses its first field, and Back focuses the search input', async () => {
    const cmd = paramCommand();
    const { c, host, cdr } = make([cmd]);
    renderInto(c, host, cdr);
    c.openPalette();
    await c.choose(cmd);
    expect(document.activeElement).toBe(host.querySelector('select'));
    c.back();
    expect(document.activeElement).toBe(host.querySelector('.cmdp-input'));
  });

  it('keeps focus inside the dialog when a result replaces the focused button', async () => {
    const { c, host, cdr } = make();
    renderInto(c, host, cdr);
    c.openPalette();
    c.setMode('ask');
    const chip = document.createElement('button');
    host.appendChild(chip);
    chip.focus();
    c.askAbout('Eta-phi view');
    await Promise.resolve();
    await Promise.resolve();
    expect(host.contains(document.activeElement)).toBe(true);
    expect((document.activeElement as HTMLElement).dataset['mode']).toBe('ask');
  });

  it('Enter on a focused button inside the palette does not run the highlighted command', () => {
    const { c, host, cdr, registry } = make();
    renderInto(c, host, cdr);
    c.openPalette();
    const askTab = host.querySelectorAll('.cmdp-mode')[1] as HTMLElement;
    c.onDocumentKeydown(key({ key: 'Enter', target: askTab }));
    expect(registry.execute).not.toHaveBeenCalled();
  });

  it('Arrow and Enter still drive the list from the search input', async () => {
    const { c, host, cdr, registry } = make();
    renderInto(c, host, cdr);
    c.openPalette();
    const input = host.querySelector('.cmdp-input');
    c.onDocumentKeydown(key({ key: 'ArrowDown', target: input }));
    expect(c.selectedIndex).toBe(1);
    c.onDocumentKeydown(
      key({ key: 'Enter', target: host.querySelector('.cmdp-input') }),
    );
    await Promise.resolve();
    expect(registry.execute).toHaveBeenCalledWith('next-event', {});
  });
});

describe('CommandPaletteComponent (arrow selection stays visible)', () => {
  const manyCommands = () =>
    Array.from({ length: 16 }, (_, i) => fakeCommand('cmd-' + i));

  it('ArrowDown and ArrowUp scroll the highlighted option into view', () => {
    const { c, host, cdr } = make(manyCommands());
    renderInto(c, host, cdr);
    const calls: [string, any][] = [];
    jest
      .spyOn(Element.prototype, 'scrollIntoView')
      .mockImplementation(function (this: Element, opts?: any) {
        calls.push([this.id, opts]);
      });
    c.openPalette();
    for (let i = 0; i < 12; i++) {
      c.onDocumentKeydown(key({ key: 'ArrowDown' }));
    }
    expect(calls[calls.length - 1]).toEqual([
      c.optionIdPrefix + '12',
      { block: 'nearest' },
    ]);
    c.onDocumentKeydown(key({ key: 'ArrowUp' }));
    expect(calls[calls.length - 1]).toEqual([
      c.optionIdPrefix + '11',
      { block: 'nearest' },
    ]);
  });

  it('typing a new query scrolls the list back to the first match', () => {
    const { c, host, cdr } = make(manyCommands());
    renderInto(c, host, cdr);
    c.openPalette();
    const list = host.querySelector('.cmdp-list') as HTMLElement;
    let top = 400;
    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      get: () => top,
      set: (v) => (top = v),
    });
    c.updateQuery('cmd');
    expect(c.selectedIndex).toBe(0);
    expect(top).toBe(0);
  });
});

describe('CommandPaletteComponent (ask robustness)', () => {
  it('an empty Ask shows a gentle hint instead of silently doing nothing', async () => {
    const { c, nl, cdr } = make();
    c.openPalette();
    c.setMode('ask');
    c.askText = '  ';
    cdr.detectChanges.mockClear();
    await c.runAsk();
    expect(nl.ask).not.toHaveBeenCalled();
    expect(c.askNeedsText).toBe(true);
    expect(c.askOutcome).toBeNull(); // a hint, not an error outcome
    expect(cdr.detectChanges).toHaveBeenCalled();
    c.askText = 'next event';
    await c.runAsk();
    expect(c.askNeedsText).toBe(false);
  });

  it('switching mode or reopening clears the empty-Ask hint', async () => {
    const { c } = make();
    c.openPalette();
    c.setMode('ask');
    await c.runAsk();
    expect(c.askNeedsText).toBe(true);
    c.setMode('commands');
    expect(c.askNeedsText).toBe(false);
    c.setMode('ask');
    await c.runAsk();
    c.close();
    c.openPalette();
    expect(c.askNeedsText).toBe(false);
  });

  it('a rejected ask clears busy, shows the failure, and does not block the next ask', async () => {
    const { c, nl } = make();
    c.openPalette();
    c.setMode('ask');
    nl.ask.mockRejectedValueOnce(new Error('worker crashed'));
    c.askText = 'spin the detector';
    await expect(c.runAsk()).resolves.toBeUndefined();
    expect(c.askBusy).toBe(false);
    expect(c.askOutcome?.ok).toBe(false);
    expect(c.askOutcome?.error).toContain('worker crashed');
    expect(c.askText).toBe('spin the detector'); // kept so it can be retried
    await c.runAsk();
    expect(nl.ask).toHaveBeenCalledTimes(2);
    expect(c.askOutcome?.ok).toBe(true);
  });

  it('an ask that finishes after destroy does not touch the destroyed view', async () => {
    const { c, nl, destroy } = make();
    c.openPalette();
    c.setMode('ask');
    let resolveAsk: (v: any) => void = () => undefined;
    nl.ask.mockImplementationOnce(
      () => new Promise((res) => (resolveAsk = res)),
    );
    c.askText = 'next event';
    const pending = c.runAsk();
    destroy();
    resolveAsk({ ok: true, command: 'next-event' });
    await expect(pending).resolves.toBeUndefined();
  });

  it('a model download that finishes after destroy does not touch the destroyed view', async () => {
    const { c, nl, destroy } = make();
    let finish: () => void = () => undefined;
    nl.enableModel.mockImplementationOnce(
      () => new Promise<void>((res) => (finish = res)),
    );
    const pending = c.enableAi();
    destroy();
    finish();
    await expect(pending).resolves.toBeUndefined();
  });

  it('answer and suggestion actions that finish after destroy do not touch the destroyed view', async () => {
    const { c, registry, destroy } = make();
    let finish: (v: any) => void = () => undefined;
    registry.execute.mockImplementation(
      () => new Promise((res) => (finish = res)) as any,
    );
    const a = c.runAnswerAction({ command: 'next-event', label: 'Next' });
    destroy();
    finish({ ok: true });
    await expect(a).resolves.toBeUndefined();
    const s = c.runSuggestion({
      command: 'next-event',
      args: {},
      label: 'Next',
    });
    finish({ ok: true });
    await expect(s).resolves.toBeUndefined();
  });

  it('setMode while a parameter form is open leaves the form', async () => {
    const cmd = paramCommand();
    const { c } = make([cmd]);
    c.openPalette();
    await c.choose(cmd);
    expect(c.activeCommand).not.toBeNull();
    c.setMode('ask');
    expect(c.mode).toBe('ask');
    expect(c.activeCommand).toBeNull();
    expect(c.formFields).toEqual([]);
  });
});
