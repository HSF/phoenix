# URL Event Loading Feature (#448)

## Overview

The URL Event Loading feature enables loading event data directly from a URL with automatic refresh capability when cycling back to the first event. This is useful for live event displays where new events are continuously being generated and published to a server.

## Features

- **Load events from URL**: Fetch event data from any HTTP/HTTPS endpoint returning Phoenix JSON format
- **Auto-refresh on loop-back**: Automatically refresh events when cycling back to the first event for live data
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

## Auto-Refresh Behavior

The feature automatically detects when the user cycles back to the first event from the last event. When this happens:

1. The system checks if events were loaded from a URL
2. If yes, it automatically fetches the latest events from that URL
3. The new events replace the old ones
4. An info log message is generated: "Looped back to start - refreshing events from URL"

This is useful for live event monitoring where you want to refresh the event list after viewing all current events.

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
