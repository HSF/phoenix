# Event autoloader

* [Overview](#overview)
* [Usage](#usage)
  * [Programmatic API](#programmatic-api)
* [Strategies](#strategies)
  * [Apache/Nginx Listing (`apache-listing`)](#apachenginx-listing-apache-listing)
  * [REST Endpoint (`rest-endpoint`)](#rest-endpoint-rest-endpoint)
  * [Server-Sent Events (`sse`)](#server-sent-events-sse)
* [File support](#file-support)
* [Error handling](#error-handling)

## Overview

The `EventAutoloader` is an experiment-agnostic feature that watches a directory or an endpoint for new event files and calls an event handler whenever a new event arrives. This handles live streaming or auto-updating of events, delegating the rendering and parsing decisions to the consumer application. 

It supports three main strategies for auto-loading events:
- **Apache/nginx Directory Listing (`apache-listing`)**
- **REST Endpoint (`rest-endpoint`)**
- **Server-Sent Events (`sse`)**

## Usage

### Programmatic API

You can use the autoloader directly in your TypeScript code via the `EventAutoloader` class provided by `phoenix-event-display`.

```typescript
import { EventAutoloader } from 'phoenix-event-display';

const autoloader = new EventAutoloader({
  source: { 
    type: 'apache-listing', 
    url: 'https://my-server/events/', 
    intervalMs: 5000 
  },
  onEvent: (data) => {
    // Process or render the incoming event
    eventDisplay.buildEventDataFromJSON(data);
  },
  onError: (err) => {
    console.error('Error loading event:', err);
  }
});

// Start watching for new events
autoloader.start();

// Later, when you want to stop:
autoloader.stop();
```

## Strategies

### Apache/Nginx Listing (`apache-listing`)
Polls an Apache/Nginx directory index page and parses the file listing (compatible with the `root.cern.ch/js/files/` format) to extract absolute URLs for `.json`, `.xml`, or `.zip` files. It fetches the newest files that haven't been seen yet.

### REST Endpoint (`rest-endpoint`)
Polls a REST endpoint to discover and fetch the next available event data. The endpoint is expected to respond with one of the following JSON structures:
- `{ url: string }`: The autoloader fetches the file at that URL.
- `{ data: object }`: The autoloader emits the data directly.
- `{ events: object }`: The autoloader emits the events directly.

If none of the above structures match, the whole response is treated as event data.

### Server-Sent Events (`sse`)
Connects to a Server-Sent Events (SSE) endpoint where the server pushes new events. The server is expected to send `data: <json-string>` messages whenever a new event is available.

## File support

For `apache-listing` and `{ url: string }` REST endpoint responses, the autoloader fetches the file and automatically parses it based on the extension.

- **JSON (`.json`)**: Emits the parsed JSON object.
- **JiveXML (`.xml`)**: Emits the raw XML string wrapped as `{ __jivexml__: <xml_string> }`.
- **Zip (`.zip`)**: Attempts to use the native browser `DecompressionStream` to unzip the payload, falling back to `JSZip` if unavailable.

## Error handling
Errors during polling or connection issues will trigger the `onError` callback without stopping the autoloader's loop, ensuring robust and continuous execution.
