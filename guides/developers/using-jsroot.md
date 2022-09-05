# Using JSROOT

- [Introduction](#introduction)
- [Loading ROOT geometry](#loading-root-geometry)
- [JSROOT event loader](#jsroot-event-loader)

## Introduction

Phoenix has built-in support for JSROOT and provides some helpers to load ROOT geometry and event data.

If you want to use JSROOT for something else, you can add it as a dependency to your application. See [JSROOT docs on GitHub](https://github.com/root-project/jsroot#readme).

## Loading ROOT geometry

The Phoenix event display has functions that can be used to load ROOT geometries.\
Phoenix supports two formats of ROOT geometries: `.json.gz`, `.root`

```ts
import { EventDisplay } from 'phoenix-event-display';

const eventDisplay = new EventDisplay({});

// To load `.json.gz` geometry
eventDisplay.loadRootJSONGeometry(
  'https://root.cern/js/files/geom/cms.json.gz',
  'CMS Detector'
);

// To load `.root` geometry
eventDisplay.loadRootGeometry(
  'https://root.cern/js/files/geom/atlas2.root',
  'atlas', // Object name
  'ATLAS Detector'
);
```

## JSROOT event loader

Phoenix also has a `JSRootEventLoader` that can be used to load events from `.root` files using JSROOT. The `JSRootEventLoader`, like other event data loaders, converts the event data in the `.root` file to the Phoenix format which can be loaded by Phoenix.

```ts
import { EventDisplay, JSRootEventLoader } from 'phoenix-event-display';

const eventDisplay = new EventDisplay({});

// Create the JSRootEventLoader and specify URL of the .root event data file
const jsrootEventLoader = new JSRootEventLoader(
  'https://root.cern/js/files/geom/tracks_hits.root'
);

// Get the event data in Phoenix format by specifying an array of objects (e.g "tracks;1", "hits;1") in the .root file
jsrootEventLoader.getEventData(['tracks;1', 'hits;1'], (eventData) => {
  eventDisplay.buildEventDataFromJSON(eventData);
});
```
