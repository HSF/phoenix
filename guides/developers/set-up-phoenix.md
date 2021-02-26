# Set up Phoenix for an experiment

* [Introduction](#introduction)
* [Setting up an Angular app](#setting-up-an-angular-app)
  * [Create the Angular app](#create-the-angular-app)
  * [Set up `phoenix-ui-components`](#set-up-phoenix-ui-components)
* [Setting up the event display](#setting-up-the-event-display)
  * [Create an experiment component](#create-an-experiment-component)

## Introduction

Phoenix is a highly modular and API driven experiment independent event display that uses [three.js](https://threejs.org) for processing and presenting detector geometry and event data. Because of its modular nature, Phoenix can easily be adapted for and extended to work with any experiment.

## Setting up an Angular app

The `phoenix-ui-components` package provides a set of modern UI Angular components that are linked with the event display and can perform useful operations like applying cuts, saving/loading state, applying clipping etc.

If you already have an application you want to use the event display with, you can move to the [Setting up the event display](#setting-up-the-event-display) section.

### Create the Angular app

To start, you will need [Node.js](https://nodejs.org/en/download/) and npm (which comes with Node.js).\
Then, install Angular.

```sh
npm install -g @angular/cli
```

Now, using the Angular CLI, create a new Angular app.

```sh
ng new my-app --style scss
```

Make sure the newly created app works.

```sh
cd my-app
ng serve --open
```

### Set up `phoenix-ui-components`

Now that you have an app set up. Install the `phoenix-ui-components` package to use the Phoenix components in your app.

```sh
npm install phoenix-ui-components
```

Next, open the `src/app/app.module.ts` file in your app and include the `PhoenixUIModule` in your module imports.

```ts
import { PhoenixUIModule } from 'phoenix-ui-components';

@NgModule({
  ...
  imports: [
    PhoenixUIModule,
    ...
  ],
  ...
})
export class AppModule { }
```

After this, go to the `src/styles.scss` file of your app and import the global Phoenix styles.

```scss
@import '~phoenix-ui-components/theming';

...
```

Lastly, download [these assets](https://github.com/HSF/phoenix/tree/master/packages/phoenix-ng/projects/phoenix-ui-components/src/assets) and put them in the `src/assets` directory of your app.

With this, the app is ready and we can move onto setting up the event display in this app.

## Setting up the event display

With the app now set up. Install the `phoenix-event-display` package in the app.

```sh
npm install phoenix-event-display
```

### Create an experiment component

The next step would be to create an Angular component so that we can use the event display.\
For this, navigate to the `src/app` directory of your app in the terminal and use the Angular CLI to generate a component.

```sh
ng generate component phoenix
```

This will create a `phoenix` folder with the component source files.

Now, open the `phoenix.component.html` file and use the Phoenix UI components to set up the UI.

```html
<div id="overlayWidgets">
  <app-nav></app-nav>
  <!-- UI menu at the bottom -->
  <app-ui-menu></app-ui-menu>
  <app-experiment-info experiment="atlas" experimentTagline="ATLAS Experiment at CERN"></app-experiment-info>
  <!-- Phoenix menu at the top right -->
  <app-phoenix-menu [rootNode]="phoenixMenuRoot"></app-phoenix-menu>
</div>
<div id="eventDisplay"></div>
```

The `[rootNode]="phoenixMenuRoot"` specified here for the Phoenix menu will be a defined in `phoenix.component.ts`.

Finally, open the `phoenix.component.ts` file and initialize the Phoenix event display using the intermediate Angular `EventDisplayService`.

```ts
import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
import { Configuration, PhoenixLoader, PresetView } from 'phoenix-event-display';

@Component({
  selector: 'app-phoenix',
  templateUrl: './phoenix.component.html',
  styleUrls: ['./phoenix.component.scss']
})
export class PhoenixComponent implements OnInit {

  /** The root Phoenix menu node. */
  phoenixMenuRoot = new PhoenixMenuNode("Phoenix Menu");

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit() {
    // Create the event display configuration
    const configuration: Configuration = {
      eventDataLoader: new PhoenixLoader(),
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], 'right-cube')
      ],
      defaultView: [4000, 0, 4000],
      phoenixMenuRoot: this.phoenixMenuRoot,
      // Event data to load by default
      defaultEventFile: {
        // (Assuming the file exists in the `src/assets` directory of the app)
        eventFile: 'assets/jive_xml_event_data.xml',
        eventType: 'jivexml'
      },
    }

    // Initialize the event display
    this.eventDisplay.init(configuration);

    // Load detector geometry (assuming the file exists in the `src/assets` directory of the app)
    this.eventDisplay.loadGLTFGeometry('assets/detector.gltf', 'Detector');
  }

}
```
