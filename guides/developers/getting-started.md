# Getting started

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

With this, the app is ready and we can move onto setting up the event display in this app.
