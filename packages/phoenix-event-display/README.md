# Phoenix event display

A highly modular and API driven experiment independent event display that uses [three.js](https://threejs.org) for processing and presenting detector geometry and event data.

To use in your application. First, install the npm package.

```sh
npm install @phoenix/event-display
```

To create a simple event display.

```js
// Import required classes
import { EventDisplay, Configuration } from '@phoenix/event-display';

// Create the event display
const eventDisplay = new EventDisplay(configuration);

// Create the configuration
const configuration = new Configuration('wrapper_element_id');

// ... other configuration options

// Initialize the event display with the configuration
eventDisplay.init(configuration);

// Load and parse event data in Phoenix format and display it
fetch('path/to/event-data.json')
  .then((res) => res.json())
  .then((res) => {
    eventDisplay.parsePhoenixEvents(res);
  });

// Load detector geometry
eventDisplay.loadOBJGeometry('path/to/geometry.obj', 'Detector OBJ', 0x8c8c8c /* color */);
```

## Usage examples

* [Usage in Angular (as a service)](https://github.com/9inpachi/phoenix/blob/wip-eventdisplay/packages/phoenix-app/src/app/sections/atlas/atlas.component.ts#L16-L56)
* [Usage in React](https://github.com/9inpachi/phoenix-react/blob/master/src/App.js#L6-L31)
