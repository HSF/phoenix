# URL Event Loading Feature (#448)

## Overview

The URL Event Loading feature enables loading event data directly from a URL. Automatic refresh is supported only when using the cycling flow (cycle-events component) and wrapping from the last event back to the first, making it useful for live event displays where new events are continuously being generated.

## Features

- **Load events from URL**: Fetch event data from any HTTP/HTTPS endpoint returning Phoenix JSON format
- **Auto-refresh on loop-back (cycling only)**: Automatically refresh events when the cycling flow wraps from last → first. Manual selection does not trigger refresh.
- **Manual refresh**: Manually refresh events from the current URL source at any time
- **Live status display**: Visual indicator showing if events are loaded from URL and the current source
- **Error handling**: Graceful error handling with logging to the info logger

## Usage

### Dat.GUI Controls

When dat.GUI menu is enabled, a "Load from URL" folder is automatically added with:

- **Event URL**: Text input field for the URL of the event data file
- **Load from URL**: Button to load events from the specified URL
- **Refresh from URL**: Button to manually refresh events
- **Status**: Display showing "Live: [URL]" or "Not loaded from URL"

### Phoenix Menu Controls

When Phoenix menu is enabled, a "Load from URL" node is automatically added with:

- **Set URL (prompt)**: Button that prompts for a new URL
- **Load from URL**: Button to load events from the specified URL
- **Refresh from URL**: Button to manually refresh events
- **Status**: Label showing current load status

### Programmatic API

```typescript
// Load events from a URL
try {
  const eventKeys = await eventDisplay.loadEventsFromURL('https://example.com/events.json');
  console.log('Loaded events:', eventKeys);
} catch (error) {
  console.error('Failed to load events:', error);
}

// Check if currently loaded from URL
if (eventDisplay.isLoadedFromURL()) {
  const url = eventDisplay.getEventSourceURL();
  console.log('Currently loading from:', url);
}

// Manually refresh from the current URL source
try {
  await eventDisplay.refreshEventsFromURL();
  console.log('Events refreshed');
} catch (error) {
  console.error('Refresh failed:', error);
}
```

## Auto-Refresh Behavior (Cycling Flow)

Auto-refresh is performed only by the cycling component. When cycling is active and configured to reload, wrapping from the last event to the first triggers `fileLoader.reloadLastEvents()` which re-fetches the last loaded URL with `cache: 'no-store'` to bypass caches. Manual navigation (including selecting last then first) does not trigger refresh.

### Example Workflow

1. User loads 10 events from `https://example.com/events.json`
2. User navigates through events: 1 → 2 → 3 → ... → 10
3. User clicks next while on event 10, returning to event 1
4. System automatically refreshes from the URL (e.g., now there are 15 events)
5. User continues viewing the newly loaded events

## Expected URL Format

The URL should return a JSON object matching the Phoenix event data format:

```json
{
  "event_0": {
    "RunNumber": 123,
    "EventNumber": 1,
    "collections": {
      "Tracks": [
        // track data...
      ],
      "Hits": [
        // hit data...
      ]
    }
  },
  "event_1": {
    // event data...
  }
}
```

## Error Handling

- Invalid URLs result in fetch errors logged to the info logger
- Failed refreshes during auto-refresh are logged but don't interrupt event navigation
- Network errors are captured and displayed to the user via alerts (in UI controls)
- The system gracefully falls back to cached events if refresh fails

## Related Issues

- #448: Main feature implementation
- #177: Track extension (merged, affects rk-helper.ts)
