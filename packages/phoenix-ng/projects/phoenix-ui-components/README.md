# Phoenix UI

[![Version](https://img.shields.io/npm/v/phoenix-ui-components.svg)](https://www.npmjs.com/package/phoenix-ui-components)
[![Downloads](https://img.shields.io/npm/dt/phoenix-ui-components.svg)](https://www.npmjs.com/package/phoenix-ui-components)

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.14.

To install the package for reusing components.

```sh
npm install phoenix-ui-components
# or
yarn add phoenix-ui-components
```

## Setup

You can see [phoenix-app](https://github.com/HSF/phoenix/tree/master/packages/phoenix-ng/projects/phoenix-app) as a reference app that uses this package.

Since the components use some icons and images, you will need to copy these assets to your application. Download these assets from [./src/assets](https://github.com/HSF/phoenix/tree/master/packages/phoenix-ng/projects/phoenix-ui-components/src/assets) and put them in the `src/assets` directory of your application. All assets should be served through `/assets`.

Once you have the assets set up, import the `PhoenixUIModule` and `BrowserAnimationsModule` in your `NgModule`.

```ts
import { PhoenixUIModule } from 'phoenix-ui-components';

@NgModule({
  imports: [
    ...
    BrowserAnimationsModule,
    PhoenixUIModule,
    ...
  ],
  ...
})
export class MyModule {}
```

## Styling

Since some Phoenix components use Bootstrap, you will need to add the the Bootstrap stylesheet in the `src/index.html` file of your app.

```html
<head>
  ...

  <link
    rel="stylesheet"
    href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
  />
</head>
```

For theming of components, you will also need to import some global styles into your app.  
It can be done by importing the theming file into your app's global styles (`styles.scss`).

`styles.scss`

```scss
@import 'phoenix-ui-components/theming';

...
```

## Usage

With everything set up, you can use the Phoenix components in your module component(s).

`component.html`

```html
<app-nav></app-nav>
<app-ui-menu></app-ui-menu>
<!-- Be sure to replace the experiment information (`logo`, `url` and `tagline`). -->
<app-experiment-info
  logo="assets/images/sample.svg"
  url="https://home.cern/science/experiments/sample"
  tagline="SAMPLE Experiment at CERN"
></app-experiment-info>
<app-phoenix-menu [rootNode]="phoenixMenuRoot"></app-phoenix-menu>
<div id="eventDisplay"></div>
```

`component.ts`

```ts
@Component({
  selector: 'app-test',
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
})
export class TestComponent {
  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');
}
```
