# Using JSROOT

* [Introduction](#introduction)
* [Loading JSROOT scripts](#loading-jsroot-scripts)
* [Loading ROOT geometry](#loading-root-geometry)
* [JSROOT event loader](#jsroot-event-loader)

## Introduction

Phoenix has built-in support for  JSROOT. Due to the nature of JSROOT scripts, they are dynamically loaded and JSROOT is made available through a callback.

## Loading JSROOT scripts

The `ScriptLoader` is used to load JSROOT scripts at run time.

```ts
ScriptLoader.loadJSRootScripts().then((JSROOT) => {
  // ... perform JSROOT operations
});

// Or using async and await

const JSROOT = await ScriptLoader.loadJSRootScripts();
// ... perform JSROOT operations
```

The `ScriptLoader.loadJSRootScripts()` loads the following list of scripts:

`JSRoot.core.js`, `three.extra.min.js`, `JSRoot.csg.js`, `JSRoot.painter.js`, `JSRoot.geom.js`

These JSROOT scripts then load other required scripts themselves.

If you need to use some JSROOT script that's not listed here, you can dynamically load that specific script using the `ScriptLoader`.

```ts
ScriptLoader.loadScript("url/to/script.js").then(() => {
  // ... the script is loaded
});
```

## Loading ROOT geometry

The Phoenix event display has functions that can be used to load ROOT geometries.\
Phoenix supports two formats of ROOT geometries: `.json.gz`, `.root`

```ts
import { EventDisplay } from "phoenix-event-display";

const eventDisplay = new EventDisplay({});

ScriptLoader.loadJSRootScripts().then((JSROOT) => {
  // To load `.json.gz` geometry
  eventDisplay.loadRootJSONGeometry(
    JSROOT,
    "https://root.cern/js/files/geom/cms.json.gz",
    "CMS Detector"
  );

  // To load `.root` geometry
  eventDisplay.loadRootGeometry(
    JSROOT,
    "https://root.cern/js/files/geom/atlas2.root",
    "atlas", // Object name
    "ATLAS Detector"
  );
});
```

## JSROOT event loader

Phoenix also has a `JSRootEventLoader` that can be used to load events from `.root` files using JSROOT. The `JSRootEventLoader`, like other event data loaders, converts the event data in the `.root` file to the Phoenix format which can be loaded by Phoenix.

```ts
import { EventDisplay } from "phoenix-event-display";

const eventDisplay = new EventDisplay({});

ScriptLoader.loadJSRootScripts().then((JSROOT) => {
  // Create the JSRootEventLoader and specify URL of the .root event data file
  const jsrootEventLoader = new JSRootEventLoader(
    JSROOT,
    "https://root.cern/js/files/geom/tracks_hits.root"
  );

  // Get the event data in Phoenix format by specifying an array of objects (e.g "tracks;1", "hits;1") in the .root file
  jsrootEventLoader.getEventData(["tracks;1", "hits;1"], (eventData) => {
    eventDisplay.buildEventDataFromJSON(eventData);
  });
});
```
