# Phoenix application

[![Version](https://img.shields.io/npm/v/phoenix-app.svg)](https://www.npmjs.com/package/phoenix-app)
[![Downloads](https://img.shields.io/npm/dt/phoenix-app.svg)](https://www.npmjs.com/package/phoenix-app)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.4.

To install the package for reusing components.

```sh
npm install phoenix-app
```

## Event display

This application uses the [phoenix-event-display](https://www.npmjs.com/package/phoenix-event-display) package ([source](https://github.com/HSF/phoenix/tree/master/packages/phoenix-event-display)) for all event display functionality. You can either use the npm package as is (through `npm install phoenix-event-display`).

Or [symlink](https://docs.npmjs.com/cli/link) the local version of the package (for development) by following the [steps below](#development-flow-with-phoenixevent-display).

## Build and run

This is an [Angular](https://angular.io) application, so you will need to have [Node.js](https://nodejs.org/en/) and [Angular CLI](https://github.com/angular/angular-cli) installed locally.

You can follow [this guide](https://angular.io/guide/setup-local) to set up your local environment.

Once everything is set up, run `ng serve` from the command line in the project directory for a dev server. Then navigate to `http://localhost:4200/` from your browser.
The app will automatically reload if you change any of the source files.

### Development flow (with `phoenix-event-display`)

You can either use lerna and follow the development guide from the root [README](https://github.com/HSF/phoenix#development) or manually symlink the Phoenix event display with the Angular app following the instructions below.

From the project repository directory.

```sh
## Symlink the event display which will let us use the local version of the phoenix-event-display package
cd packages/phoenix-event-display
npm link
cd ../phoenix-app
npm link "phoenix-event-display"

## Run the event display in development mode
cd ../phoenix-event-display
npm run start

## Run the Angular app
cd ../phoenix-app
npm run start
```

Now any changes in the [phoenix-event-display](https://www.npmjs.com/package/phoenix-event-display) package ([source](https://github.com/HSF/phoenix/tree/master/packages/phoenix-event-display)) will build the package and the Angular app will pick up the changes made to the event display.

### Deploy the application
In order to make a version of Phoenix which can be deployed to your server, run the following command:
```sh
npm run deploy:web -- --base-href "/hsf-phoenix/atlas/"
```
