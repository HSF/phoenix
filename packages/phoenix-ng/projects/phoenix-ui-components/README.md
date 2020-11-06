# Phoenix UI

[![Version](https://img.shields.io/npm/v/phoenix-ui-components.svg)](https://www.npmjs.com/package/phoenix-ui-components)
[![Downloads](https://img.shields.io/npm/dt/phoenix-ui-components.svg)](https://www.npmjs.com/package/phoenix-ui-components)

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.14.

To install the package for reusing components.

```sh
npm install phoenix-ui-components
```

## Setup

Since the components use some icons and images, you will need to copy these assets to your application. Download these assets from [./src/assets](./src/assets) and put them in the `assets` directory of your application. All assets should be served through `/assets`.

Import the `PhoenixUIModule` in your `NgModule`.

```ts
import { PhoenixUIModule } from 'phoenix-ui-components';
/* and many more */

@NgModule({
  imports: [
    PhoenixUIModule,
    ...
  ],
  ...
})
export class MyModule {}
```

Next, you can use the Phoenix components in your component.

`component.html`

```html
<app-nav></app-nav>
<app-ui-menu></app-ui-menu>
<app-experiment-info experiment="sample" experimentTagline="SAMPLE Experiment at CERN"></app-experiment-info>
<app-phoenix-menu [rootNode]="phoenixMenuRoot"></app-phoenix-menu>
<div id="eventDisplay"></div>
```

`component.ts`

```ts
...
@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');
}
```
