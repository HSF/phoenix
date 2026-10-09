# Agent bridge: controlling Phoenix from another page or an agent

## Overview

Give Phoenix a structured, schema-described **inbound control API** so another
web context (a parent page, a Jupyter notebook, a dashboard, or an AI agent
embedding Phoenix in an iframe) can discover and run Phoenix's registered
commands, and observe what happens, over `window.postMessage`. This directly
advances the open maintainer issue #826 ("Allow easier integration of phoenix
in other applications") and completes the command API (#942): the registry and
palette gave Phoenix an internal action layer; this exposes that layer to the
outside, physics-safely.

The wire format is JSON-RPC 2.0 using MCP method names (`initialize`,
`tools/list`, `tools/call`, plus a `phoenix/event` notification), so it reads
like the Model Context Protocol and a future MCP server adapter maps onto it
with no rework.

## Goals

- A transport-agnostic bridge in the framework-agnostic core
  (`phoenix-event-display`), zero new dependencies, reusable by every
  experiment (ATLAS, CMS, LHCb, TrackML, Belle II).
- A `PostMessageTransport` so an iframe embedder can drive Phoenix.
- Live outbound event stream: every command that runs (from the bridge, the
  Ctrl/K palette, or the natural-language Ask box) is forwarded to initialized
  clients.
- Safe by default: no listener exists unless an app opts in, and then only
  allowlisted origins are served, each client only receives its own replies.
- A minimal framework-free demo page and full tests.

## Non-goals

- The Node MCP stdio adapter for desktop agents (Claude Desktop). Deferred; the
  transport abstraction makes it a later add with no rework.
- Voice input (cut).
- Any change to existing commands or the NL layer.

## Architecture

```
   AgentTransport (abstract)  ->  createAgentBridge (core, 0 deps)
     onMessage(message, peer)       initialize / tools/list / tools/call
     close()                        -> registry.list() + live enums / registry.execute()
                                    <- COMMAND_EXECUTED_EVENT as phoenix/event
        ^                              (initialized peers only)
        | PostMessageTransport (browser): origin policy + per-window peers
   parent page / notebook / iframe embedder
```

## Components

Folder: `packages/phoenix-event-display/src/managers/command-registry/agent-bridge/`

- `json-rpc.ts`: JSON-RPC 2.0 helpers: `isJsonRpcRequest`, `isNotification`,
  `isValidRequestId`, `makeResponse`, `makeError`, `makeNotification`, error
  codes `-32600/-32601/-32602/-32603`.
- `agent-transport.ts`: the transport contract.
  - `AgentPeer { origin; send(message); isClosed() }`: one client, as
    authenticated and addressed by the transport.
  - `AgentTransport { onMessage(cb: (message, peer) => void); close() }`.
  - There is deliberately no `send()` on the transport. A transport
    authenticates senders and addresses replies; it never broadcasts. Session
    state (who completed `initialize`) belongs to the bridge.
  - Why peers and not an id-to-window map: JSON-RPC ids are only unique per
    client (two clients both start at 1), so an id-keyed map misroutes replies.
- `origin-policy.ts`: `OriginRule = string | (origin) => boolean`,
  `ANY_ORIGIN = '*'`, `isLoopbackHostname`, `isLoopbackOrigin`,
  `isOriginAllowed`. All checks parse with `URL`; no substring or regex matching.
- `post-message-transport.ts`: `PostMessageTransport` over window `message`
  events. Drops disallowed origins and messages without a usable
  `event.source`; hands the bridge one peer per sender window (a `WeakMap`, so
  closed or removed windows are never kept alive); a peer posts only to its own
  window with the verified origin as `targetOrigin`.
- `agent-bridge.ts`: `createAgentBridge(host, options)` returning
  `{ dispose(), resubscribe() }`. Options: `transport?`, `origins?:
OriginRule[]`, `window?`, `allowMutations?` (default true).
- Sibling `enum-sources.ts`: `resolveEnumSources(host)` returns
  `{ collections, presetViews, eventKeys, geometryParts }` from the live
  display. Never throws.

App wiring (`phoenix-ui-components`): `AgentBridgeService` (root) plus
`provideAgentBridge(config?)`, an `EnvironmentProviders` built with
`provideAppInitializer`. The phoenix-app adds `provideAgentBridge()` to
`AppModule.providers`. No component touches the bridge.

Demo: `examples/agent-bridge-demo.html`.

## Data flow

All messages are JSON-RPC 2.0. Every response goes to the requesting client
only.

**initialize** (required for the event stream; `tools/list` and `tools/call`
work without it):

```
-> {jsonrpc:"2.0", id, method:"initialize"}
<- {jsonrpc:"2.0", id, result:{ protocolVersion, serverInfo:{name:"phoenix", version},
     capabilities:{tools:{}}, toolCount }}
```

**tools/list**: `inputSchema` is plain JSON Schema. The internal `enumSource`
keyword is never emitted; parameters backed by a live source (`collection`,
`view`, `eventKey`, `part`) carry a concrete `enum` of current values, or no
`enum` when that source is empty. The conversion is the NL layer's own
`toArgsSchema` (through `buildIntentSchema`), so tools/list and the model
grammar always agree.

```
-> {id, method:"tools/list"}
<- {id, result:{ tools:[ {name, description, inputSchema, mutates}, ... ] }}
```

**tools/call**:

```
-> {id, method:"tools/call", params:{ name, arguments }}
<- {id, result:{ isError:false, content:[{type:"text", text}], structuredContent:<result> }}
```

**phoenix/event** (notification on every command execution, from any source,
sent only to clients that completed `initialize`):

```
<- {jsonrpc:"2.0", method:"phoenix/event", params:{ name, args, result }}
```

## Error handling

- Origin not allowed, or no `event.source` to answer: dropped silently, no reply.
- Not a JSON-RPC request (including JSON-RPC responses): ignored, never answered
  (so two bridges cannot ping-pong).
- Notification (no `id`): never answered and nothing runs (JSON-RPC 2.0 section
  4.1; MCP defines every served method as a request).
- `id` present but not a string or finite number (including `null`): `-32600`
  with `id: null`.
- Unknown method: `-32601`. Unknown tool or missing name: `-32602`.
- Command fails at runtime or fails validation: `tools/call` result with
  `isError:true`.
- Mutation refused by policy: `isError:true` with a clear message.
- A reply the client cannot receive (for example a `DataCloneError`): `-32603`
  to that client instead of leaving it waiting.

## Lifecycle

- `provideAgentBridge()` runs once at application startup, independent of the
  command palette and of `uiConfig.showCommandPalette`. The bridge lives as long
  as the app; `AgentBridgeService.ngOnDestroy` disposes it with the root
  injector.
- `enable()` disposes any previous bridge first, so there is never a second
  window listener. `enableFromLocation()` is a no-op when already enabled.
- `EventDisplay.init()` calls `cleanup()`, which clears every event-bus
  subscriber. Every route change re-initialises the one root display, which
  would silently cut `phoenix/event`. The service therefore calls
  `handle.resubscribe()` from an `afterEveryRender` hook (idempotent, two map
  operations); a client re-sending `initialize` also re-attaches it. A cleaner
  long-term fix is in `EventDisplay` itself (keep app-lifetime subscribers
  across `cleanup()`, or expose an init hook).
- Zones: the window listener is registered outside Angular's zone, so messages
  from unknown origins never trigger change detection; accepted messages are
  delivered inside the zone so commands that update Angular UI still render.

Why app-level and not library-level: other experiments embed
`phoenix-ui-components`. Making `PhoenixUIModule` start the bridge by itself
would give every embedder an inbound control channel it never asked for.
`provideAgentBridge` is the idiomatic Angular 20 opt-in (like
`provideHttpClient`): an app that does not add it has no listener at all.

## Security posture

- Default OFF: no listener exists unless the app adds `provideAgentBridge`.
- `provideAgentBridge({ origins })`: exactly those origins (an explicit `'*'` is
  honoured only here, never produced by the URL switch).
- `provideAgentBridge()` with `?agent=1`: only when the page itself is served
  from `localhost`, `127.0.0.1` or `[::1]`, and then only for loopback origins
  (`http:`/`https:` on those hosts, any port). The switch must be
  unambiguous: `agent=1&agent=0`, or a search and a hash query that disagree,
  stay dormant. The app uses path routing, so the switch is normally in the
  search string.
- The opaque `"null"` origin is never admitted, under any rule: a sandboxed
  `srcdoc` iframe gets it for free, and a reply to it would need targetOrigin
  `'*'`.
- A missing, empty or non-array allowlist admits nobody; a malformed entry
  admits nothing; a matcher that throws denies.
- Responses go only to the requester; events only to initialized clients.
  Sending a message enrolls nobody in anything.
- Every call still goes through `registry.execute`, so schema validation and
  the registered-command whitelist apply unchanged.
- Residual: with `?agent=1` any local web app on any loopback port can drive the
  dev server, including reading loaded data with `get-object`. That requires
  code already running on the developer's machine.

## Physics safety

Unchanged and by construction: the bridge exposes the same registry with the
same validation. An external agent cannot invent a command, pass invalid
arguments, or reach any method not deliberately wrapped as a deterministic
command. It drives real reconstructed data and reports real numbers; it never
generates physics.

## Testing

1. `agent-bridge.test.ts`: MockTransport + MockPeer over a real
   `CommandRegistry`: initialize, tools/list (valid JSON Schema, live enums,
   empty sources), tools/call, error codes, notifications, invalid ids, falsy
   ids, per-client replies with colliding ids, events only to initialized
   clients, closed and failing clients, mutation policy, `resubscribe()` against
   a real `EventDisplay.cleanup()`, dispose.
2. `post-message-transport.test.ts`: `isLoopbackOrigin` and `isOriginAllowed`
   tables, per-window peers, no broadcast, weak holding of windows, lifecycle.
3. `coverage-gaps.test.ts`: fail-closed for `{}`, `{origins: undefined}`,
   `{origins: []}` at the transport and through `createAgentBridge`.
4. `enum-sources.test.ts`: values not keys, never throws, de-duplication.
5. `agent-bridge.service.test.ts`: URL switch (search, hash, disagreement,
   production host with no listener), loopback-only admission, no double
   listener, survives a display re-init via the render hook, and
   `provideAgentBridge` startup behaviour.
6. Live check (manual, `~/.phx-tools/bridge-verify.mjs`): a parent page on
   another localhost port embeds `/atlas?agent=1`.
