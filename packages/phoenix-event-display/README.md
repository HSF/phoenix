# Phoenix event display

[![Version](https://img.shields.io/npm/v/phoenix-event-display.svg)](https://www.npmjs.com/package/phoenix-event-display)
[![Downloads](https://img.shields.io/npm/dt/phoenix-event-display.svg)](https://www.npmjs.com/package/phoenix-event-display)
[![Documentation Coverage](https://raw.github.com/HSF/phoenix/master/docs/api-docs/images/coverage-badge-documentation.svg)](https://hepsoftwarefoundation.org/phoenix/api-docs/coverage.html)

A highly modular and API driven experiment independent event display that uses [three.js](https://threejs.org) for processing and presenting detector geometry and event data.

To use in your application, install the package.

```sh
npm install phoenix-event-display
# or
yarn add phoenix-event-display
```

## Usage

### As a module

To create a simple event display.

```js
// Import required classes
import { EventDisplay, PhoenixLoader } from 'phoenix-event-display';

// Create the event display
const eventDisplay = new EventDisplay();

// Define the configuration
const configuration = {
  elementId: '<wrapper_element_id>',
  eventDataLoader: new PhoenixLoader(), // or some other event data loader
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
eventDisplay.loadOBJGeometry(
  'path/to/geometry.obj',
  'Detector OBJ',
  0x8c8c8c /* color */
);
```

### As a standalone bundle

Phoenix can be bundled and used directly in the HTML as a script along with [three.js](https://threejs.org). You can either use the [CDN](https://cdn.jsdelivr.net/npm/phoenix-event-display/dist/bundle/phoenix.min.js) or build from source.

To build Phoenix as a bundle.

```sh
yarn build:bundle
```

This will generate a file `phoenix.min.js` in the [./dist/bundle](./dist/bundle) directory which can be included in your HTML code.

Without building, you can include the bundle directly from [CDN](https://cdn.jsdelivr.net/npm/phoenix-event-display/dist/bundle/phoenix.min.js).

```html
<html lang="en">
  <head>
    ...
  </head>

  <body>
    <div id="eventDisplay"></div>

    <script src="https://cdn.jsdelivr.net/npm/three/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/phoenix-event-display/dist/bundle/phoenix.min.js"></script>

    <script>
      // Create the event display
      const eventDisplay = new EventDisplay();

      // Define the configuration
      const configuration = {
        elementId: 'eventDisplay',
        eventDataLoader: new PhoenixLoader(), // or some other event data loader
        // ... other configuration options
      };

      // Initialize the event display with the configuration
      eventDisplay.init(configuration);

      // ... other event display functions
    </script>
  </body>
</html>
```

### Examples

- [Usage in Angular (as a service)](https://github.com/HSF/phoenix/blob/master/packages/phoenix-ng/projects/phoenix-app/src/app/sections/lhcb/lhcb.component.ts)
- [Usage in React](https://github.com/9inpachi/phoenix-react/blob/master/src/App.js#L6-L31)
