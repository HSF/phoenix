# Phoenix application

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.4.

## Event display

This application uses the [@phoenix/event-display](../phoenix-event-display) package for all event display functionality. You can either use the npm package as is (through `npm install`).

Or [symlink](https://docs.npmjs.com/cli/link) the local version of the package (for development) by following the [steps below](#development-flow-with-phoenixevent-display).

## Build and run

This is an [Angular](https://angular.io) application, so you will need to have [Node js](https://nodejs.org/en/) and [Angular CLI](https://github.com/angular/angular-cli) installed locally.

You can follow [this guide](https://angular.io/guide/setup-local) to set up your local environment.

Once everything is set up, run `ng serve` from the command line in the project directory for a dev server. Then navigate to `http://localhost:4200/` from your browser.
The app will automatically reload if you change any of the source files.

### Development flow (with @phoenix/event-display)

```sh
## Symlink the event display which will let us use the local version of the @phoenix/event-display package
cd packages/phoenix-event-display
npm link
cd ../phoenix-app
npm link "@phoenix/event-display"

## Run the event display in development mode
cd ../phoenix-event-display
npm run dev

## Run the Angular app
cd ../phoenix-app
ng serve
```

Now any changes in the [@phoenix/event-display](../phoenix-event-display) package will build the package and the Angular app will pick up the changes made to the event display.
