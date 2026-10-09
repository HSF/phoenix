import {
  afterEveryRender,
  inject,
  Injectable,
  Injector,
  NgZone,
  provideAppInitializer,
  type AfterRenderRef,
  type EnvironmentProviders,
  type OnDestroy,
} from '@angular/core';
import {
  createAgentBridge,
  isLoopbackHostname,
  isLoopbackOrigin,
  PostMessageTransport,
  type AgentBridgeHandle,
  type AgentBridgeHost,
  type AgentTransport,
  type OriginRule,
} from 'phoenix-event-display';
import { EventDisplayService } from './event-display.service';

/**
 * Decide whether the `?agent=1` URL switch should enable the agent bridge, and
 * with which origins.
 *
 * This switch is a demo/dev convenience only: it enables the bridge on the
 * loopback host alone, and even there only for other loopback origins (see
 * `isLoopbackOrigin`), never for any origin. Any page on the web can put a
 * running dev server in an iframe with `?agent=1` appended, so a wildcard here
 * would let a page the developer never opted into read back loaded event data
 * through `get-object`. Production deployments enable the bridge through
 * explicit config origins, never through the URL, so a public Phoenix is never
 * driveable just by appending a query parameter.
 * @param search The query string (without the leading '?').
 * @param hostname The current hostname.
 * @returns An origin allowlist to enable with, or null to stay disabled.
 */
export function resolveAgentBridgeOrigins(
  search: string,
  hostname: string,
): OriginRule[] | null {
  // getAll, not get: `agent=1&agent=0` is ambiguous, so it stays dormant.
  const values = new URLSearchParams(search ?? '').getAll('agent');
  const asked = values.length > 0 && values.every((value) => value === '1');
  if (!asked) return null;
  return isLoopbackHostname(hostname) ? [isLoopbackOrigin] : null;
}

/** Options for {@link provideAgentBridge}. */
export interface AgentBridgeConfig {
  /**
   * Origins allowed to drive this deployment: exact origins, a matcher, or
   * `'*'` if an app really means any origin. When set, the bridge starts with
   * these and the `?agent=1` URL switch is not consulted. When omitted, only
   * the localhost-only URL switch can start it.
   */
  origins?: OriginRule[];
}

/**
 * Owner of the single agent bridge (#942/#826).
 *
 * Root-scoped and app-lifetime: the bridge must survive route changes, so no
 * component may create or dispose it. Apps opt in with
 * {@link provideAgentBridge}; without that provider nothing here ever runs and
 * no listener exists.
 */
@Injectable({ providedIn: 'root' })
export class AgentBridgeService implements OnDestroy {
  /** The running bridge, or null while dormant. */
  private handle: AgentBridgeHandle | null = null;
  /** Render hook that re-attaches the event stream after a view re-init. */
  private renderHook: AfterRenderRef | null = null;

  /**
   * @param ngZone Angular zone. The window listener is registered outside it so
   *   messages from unknown origins cannot drive change detection at all, and
   *   accepted messages are handed back inside it so commands that update
   *   Angular-rendered UI still refresh.
   * @param injector Root injector, used to register the render hook.
   */
  constructor(
    private ngZone: NgZone,
    private injector: Injector,
  ) {}

  /** Whether the bridge is currently running. */
  get isEnabled(): boolean {
    return this.handle !== null;
  }

  /**
   * Enable the bridge for an explicit origin allowlist (the production path).
   * An empty allowlist stays dormant: the bridge fails closed.
   * @param eventDisplay The event display to expose.
   * @param origins Allowlisted client origins.
   */
  enable(eventDisplay: EventDisplayService, origins: OriginRule[]): void {
    if (!Array.isArray(origins) || origins.length === 0) return;
    // Never leave a second listener behind if this is called twice.
    this.disable();
    const transport = this.ngZone.runOutsideAngular(
      () => new PostMessageTransport({ origins }),
    );
    this.handle = createAgentBridge(
      eventDisplay as unknown as AgentBridgeHost,
      { transport: this.deliverInAngularZone(transport) },
    );
    // EventDisplay.init() calls cleanup(), which clears every event-bus
    // subscriber, so each route change silently cuts the phoenix/event stream
    // of a bridge that outlives the view. Re-attaching after each render costs
    // two map operations and restores it whether the view was re-initialised
    // synchronously or after loading data.
    this.renderHook = afterEveryRender(
      { read: () => this.handle?.resubscribe() },
      { injector: this.injector },
    );
  }

  /**
   * Enable the bridge only if the URL asks for it (`?agent=1`, loopback host
   * only). The Phoenix app uses PATH routing, so the switch normally lives in
   * the query string; a query inside the hash is still honoured for embedders
   * that use hash URLs. If the two disagree the bridge stays dormant. No-op
   * when the bridge is already running.
   * @param eventDisplay The event display to expose.
   * @param loc Location to read (defaults to window.location; injectable for tests).
   */
  enableFromLocation(
    eventDisplay: EventDisplayService,
    loc: {
      hash?: string;
      search?: string;
      hostname: string;
    } = typeof window !== 'undefined' ? window.location : undefined,
  ): void {
    if (!loc || this.isEnabled) return;
    const hash = loc.hash ?? '';
    const hashQuery = hash.includes('?')
      ? hash.slice(hash.indexOf('?') + 1)
      : '';
    const search = (loc.search ?? '').replace(/^\?/, '');
    const query = [search, hashQuery].filter(Boolean).join('&');
    const origins = resolveAgentBridgeOrigins(query, loc.hostname);
    if (origins) this.enable(eventDisplay, origins);
  }

  /** Tear down the bridge if it is running. */
  disable(): void {
    this.renderHook?.destroy();
    this.renderHook = null;
    this.handle?.dispose();
    this.handle = null;
  }

  /** Dispose the bridge when the application injector is destroyed. */
  ngOnDestroy(): void {
    this.disable();
  }

  /**
   * Wrap a transport so accepted messages are delivered inside Angular's zone.
   * @param transport The transport listening outside the zone.
   * @returns An equivalent transport that delivers in the zone.
   */
  private deliverInAngularZone(transport: AgentTransport): AgentTransport {
    return {
      onMessage: (cb) =>
        transport.onMessage((message, peer) =>
          this.ngZone.run(() => cb(message, peer)),
        ),
      close: () => transport.close(),
    };
  }
}

/**
 * Opt in to the agent bridge for a whole application.
 *
 * Ownership is app-level on purpose. The bridge is one long-lived listener over
 * the one root `EventDisplayService`, so tying it to a component would end it
 * at that component's first `ngOnDestroy` (a route change) and would skip it
 * entirely wherever that component is not rendered. It is a provider rather
 * than something `PhoenixUIModule` does by itself so that experiments which
 * embed the UI library never get an inbound control channel they did not ask
 * for.
 *
 * Add it to the application's providers:
 * `providers: [provideAgentBridge()]` for the localhost-only `?agent=1` switch,
 * or `provideAgentBridge({ origins: ['https://embedder.example.org'] })` to
 * serve a known embedder in production.
 * @param config Explicit origins, or nothing for the URL switch alone.
 * @returns Providers that start the bridge once, at application startup.
 */
export function provideAgentBridge(
  config: AgentBridgeConfig = {},
): EnvironmentProviders {
  return provideAppInitializer(() => {
    const bridge = inject(AgentBridgeService);
    const eventDisplay = inject(EventDisplayService);
    if (config?.origins?.length) {
      bridge.enable(eventDisplay, config.origins);
    } else {
      bridge.enableFromLocation(eventDisplay);
    }
  });
}
