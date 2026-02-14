# URL Event Loading Feature (#448)

## Overview

Phoenix already supports loading event data from a URL via the existing file loader. This update focuses on the cycling flow: when reloading is enabled, the URL is re-fetched with `cache: 'no-store'` when cycling wraps from the last event back to the first. This is useful for live event displays where new events are continuously being generated.

## Important Limitations

**CORS (Cross-Origin Resource Sharing)**: Due to browser security, loading events from URLs will fail unless the server hosting the event data explicitly allows your Phoenix deployment's origin. For live displays, ensure the server includes appropriate CORS headers. This limitation makes the feature most practical for:

- Same-origin deployments (Phoenix and events on the same server)
- Servers you control where CORS headers can be configured
- Development/testing environments with CORS disabled

## Features

- **Auto-refresh on cycling**: When cycling is active with reloading enabled, automatically refresh events when wrapping from last → first
- **Cache bypass on reload**: Uses `cache: 'no-store'` to avoid stale URL responses
- **Multiple format support**: Works with JSON, JiveXML, and zipped files (via existing fileLoader)
- **Error handling**: Graceful error handling with logging

## Usage

### Via Cycling Component

The way to use URL loading is through the cycling component in phoenix-ng:

1. Load events from a URL using the file loader (same as loading local files)
2. Enable cycling mode
3. Toggle reload mode (click cycle button additional times)
4. When cycling wraps from last event to first, events automatically refresh with `cache: 'no-store'`

### Programmatic API (phoenix-ng)

```typescript
// Load events from URL using file loader service
fileLoaderService.loadEvent('https://example.com/events.json', eventDisplay);

// Reload last events (used internally by cycling component)
fileLoaderService.reloadLastEvents(eventDisplay);
```

## Auto-Refresh Behavior (Cycling Flow Only)

Auto-refresh is triggered only when:

1. The cycling component is active
2. Reload mode is enabled (indicated by cycling UI state)
3. The cycle wraps from the last event to the first event

When these conditions are met, `fileLoader.reloadLastEvents()` is called, which re-fetches the last loaded URL with `cache: 'no-store'` to bypass browser caches.

**Manual navigation does not trigger auto-refresh**. If you manually select the last event then first event, no refresh occurs.

### Example Workflow

1. User loads events from URL via file loader: `https://example.com/events.json` (10 events)
2. User enables cycling mode in the cycle-events component
3. User enables reload mode (toggle cycle button additional times until reloading = true)
4. Cycling runs: event 1 → 2 → 3 → ... → 10
5. When cycling wraps (10 → 1), `fileLoader.reloadLastEvents()` is automatically called
6. Fresh events are fetched with `cache: 'no-store'` (e.g., now 15 events available)
7. Cycling continues with the newly loaded events

## Expected URL Format

The URL should return event data in a format supported by Phoenix loaders:

**JSON format:**

```json
{
  "event_0": {
    "RunNumber": 123,
    "EventNumber": 1,
    "collections": {
      "Tracks": [
        /* track data */
      ],
      "Hits": [
        /* hit data */
      ]
    }
  },
  "event_1": {
    /* event data */
  }
}
```

**JiveXML format:** Standard JiveXML event data format (`.xml` extension)

**Zipped files:** Any supported format compressed as `.zip`

## Technical Implementation

- URLs are loaded through the existing `FileLoaderService.loadEvent()` method
- The last loaded URL is tracked in `fileLoaderService.lastEventsURL`
- On reload, `cache: 'no-store'` is passed to the fetch options to bypass caches
- The cycling component calls `fileLoader.reloadLastEvents()` when wrapping with reload enabled
- All existing format parsing (JSON, JiveXML, zip) works transparently with URLs
- No new EventDisplay URL APIs or UI controls are introduced in this change

## Error Handling

- Invalid URLs result in fetch errors logged to console
- Failed refreshes are logged but don't interrupt cycling
- Network errors are captured and reported
- CORS errors will prevent loading entirely - ensure proper server configuration

## Related Issues

- #448: Main feature implementation (URL loading with auto-refresh in cycling)
