# Set up Phoenix for an experiment

* [Introduction](#introduction)
* [Setting up an Angular app](#setting-up-an-angular-app)
  * [Create the Angular app](#create-the-angular-app)
  * [Set up `phoenix-ui-components`](#set-up-phoenix-ui-components)
    * [Import `PhoenixUIModule`](#import-phoenixuimodule)
    * [Import required styles](#import-required-styles)
    * [Set up assets](#set-up-assets)
* [Setting up the event display](#setting-up-the-event-display)
  * [Create an experiment component](#create-an-experiment-component)
  * [Set up the route](#set-up-the-route)

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
ng new my-app --style scss --routing true
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

#### Import `PhoenixUIModule`

After installing the package, open the `src/app/app.module.ts` file in your app and add `BrowserAnimationsModule` and `PhoenixUIModule` in your module imports.

```ts
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PhoenixUIModule } from 'phoenix-ui-components';

@NgModule({
  ...
  imports: [
    ...
    BrowserAnimationsModule,
    PhoenixUIModule,
    ...
  ],
  ...
})
export class AppModule { }
```

#### Import required styles

Since some Phoenix components use Bootstrap, you will need to add the the Bootstrap stylesheet in the `src/index.html` file of your app.

```html
<head>
  ...

  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
</head>
```

After this, go to the `src/styles.scss` file of your app and import the global Phoenix styles.

```scss
@import 'phoenix-ui-components/theming';

...
```

#### Set up assets

And lastly, download [these assets](https://github.com/HSF/phoenix/tree/master/packages/phoenix-ng/projects/phoenix-ui-components/lib/assets) (icons and images used by the Phoenix UI components) and put them in the `src/assets` directory of your app.

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
ng generate component test-experiment
```

This will create a `test-experiment` folder with the component source files.

Now, open the `test-experiment.component.html` file and use the Phoenix UI components to set up the UI.

```html
<app-nav></app-nav>
<!-- UI menu at the bottom -->
<app-ui-menu></app-ui-menu>
<app-experiment-info experiment="atlas" experimentTagline="ATLAS Experiment at CERN"></app-experiment-info>
<!-- Phoenix menu at the top right -->
<app-phoenix-menu [rootNode]="phoenixMenuRoot"></app-phoenix-menu>
<div id="eventDisplay"></div>
```

The `[rootNode]="phoenixMenuRoot"` specified here for the Phoenix menu will be a defined in `test-experiment.component.ts`.

One can easily customize the app-ui-menu. There are 2 main ways :
  - just adding buttons at the end of it by inserting the corresponding components with the `app-ui-menu` declaration :
  ```html
  <app-ui-menu>
    <app-cycle-events [interval]="5000"></app-cycle-events>
  </app-ui-menu>
  ```
  will add a button to cycle through events every 5s at the end of the menu bar
  - redefine the manu bar completely using `app-ui-menu-wrapper` instead of `app-ui-menu` :
  ```html
  <app-ui-menu-wrapper>
    <app-event-selector></app-event-selector>
    <app-cycle-events [interval]="5000"></app-cycle-events>
  </app-ui-menu-wrapper>
  ```
  This defines a very restricted menu with only the event selector and the event cycling button

Finally, open the `test-experiment.component.ts` file and initialize the Phoenix event display using the intermediate Angular `EventDisplayService`.

```ts
import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
import { Configuration, PhoenixLoader, PresetView, ClippingSetting, PhoenixMenuNode } from 'phoenix-event-display';

@Component({
  selector: 'app-test-experiment',
  templateUrl: './test-experiment.component.html',
  styleUrls: ['./test-experiment.component.scss']
})
export class TestExperimentComponent implements OnInit {

  /** The root Phoenix menu node. */
  phoenixMenuRoot = new PhoenixMenuNode("Phoenix Menu");

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit() {
    // Create the event display configuration
    const configuration: Configuration = {
      eventDataLoader: new PhoenixLoader(),
      presetViews: [
        // simple preset views, looking at point 0,0,0 and with no clipping
        new PresetView('Left View', [0, 0, -12000], [0, 0, 0], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], [0, 0, 0], 'top-cube'),
        // more fancy view, looking at point 0,0,5000 and with some clipping
        new PresetView('Right View', [0, 0, 12000], [0, 0, 5000], 'right-cube', ClippingSetting.On, 90, 90)
      ],
      // default view with x, y, z of the camera and then x, y, z of the point it looks at
      defaultView: [4000, 0, 4000, 0, 0 ,0],
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

### Set up the route

Once the experiment component is created, you will need to set up a route so it can be served through a URL.

The app we generated already has some data. So delete the existing app content and replace it with a router outlet.\
Go to `src/app/app.component.html` and replace all content with this code:

```html
<router-outlet></router-outlet>
```

Now, navigate to `src/app/app.module.ts` and add the routing for the experiment component we created.

```ts
import { RouterModule } from '@angular/router';
import { TestExperimentComponent } from './test-component/test-experiment.component';

@NgModule({
  ...
  imports: [
    ...
    RouterModule.forRoot([{ path: '', component: TestExperimentComponent }])
  ],
  ...
})
export class AppModule { }
```

This will serve the experiment component through the base URL `/` of the server.

Finally, you can start the app with `npm start` and navigate to `http://localhost:4200` where you will see the experiment component in action.
