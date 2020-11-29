# Phoenix event display

[![Version](https://img.shields.io/npm/v/phoenix-event-display.svg)](https://www.npmjs.com/package/phoenix-event-display)
[![Downloads](https://img.shields.io/npm/dt/phoenix-event-display.svg)](https://www.npmjs.com/package/phoenix-event-display)
[![Documentation Coverage](https://raw.github.com/HSF/phoenix/master/docs/api-docs/images/coverage-badge-documentation.svg)](https://hepsoftwarefoundation.org/phoenix/api-docs/coverage.html)

A highly modular and API driven experiment independent event display that uses [three.js](https://threejs.org) for processing and presenting detector geometry and event data.

To use in your application. First, install the npm package.

```sh
npm install phoenix-event-display
```

## Usage

To create a simple event display.

```js
// Import required classes
import { EventDisplay, PhoenixLoader } from 'phoenix-event-display';

// Create the event display
const eventDisplay = new EventDisplay();

// Define the configuration
const configuration = {
  elementId: '<wrapper_element_id>',
  eventDataLoader: new PhoenixLoader() // or some other event data loader
  // ... other configuration options
};

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

### Examples

* [Usage in Angular (as a service)](https://github.com/HSF/phoenix/blob/master/packages/phoenix-ng/projects/phoenix-app/src/app/sections/lhcb/lhcb.component.ts)
* [Usage in React](https://github.com/9inpachi/phoenix-react/blob/master/src/App.js#L6-L31)
