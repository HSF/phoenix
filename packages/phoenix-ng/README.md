# Phoenix application

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.4.

## Contents

* [Build and run](#build-and-run)
* [Components](#components)
* [Event display](#event-display)
  * [Development flow](#development-flow-with-phoenix-event-display) (with `phoenix-event-display`)
  * [Deploy the application](#deploy-the-application)
    * [Deploy with a specific event](#deploy-with-a-specific-event)

## Build and run

This is an [Angular](https://angular.io) application, so you will need to have [Node.js](https://nodejs.org/en/) and [Angular CLI](https://github.com/angular/angular-cli) installed locally.

You can follow [this guide](https://angular.io/guide/setup-local) to set up your local environment.

Once everything is set up, run `ng serve` from the command line in the project directory for a dev server. Then navigate to `http://localhost:4200/` from your browser.  
The app will automatically reload if you change any of the source files.

## Components

This application uses components from the [phoenix-ui-components](https://github.com/HSF/phoenix/tree/master/packages/phoenix-ng/projects/phoenix-ui-components) package.

## Event display

This application uses the [phoenix-event-display](https://www.npmjs.com/package/phoenix-event-display) package ([source](https://github.com/HSF/phoenix/tree/master/packages/phoenix-event-display)) for all event display functionality. You can either use the npm package as is (through `npm install phoenix-event-display`).

Or [symlink](https://docs.npmjs.com/cli/link) the local version of the package (for development) by following the [steps below](#development-flow-with-phoenixevent-display).

### Development flow (with `phoenix-event-display`)

You can either use lerna and follow the development guide from the root [README](https://github.com/HSF/phoenix#development) or manually symlink the Phoenix event display with the Angular app following the instructions below.

From the project repository directory.

```sh
## Symlink the event display which will let us use the local version of the phoenix-event-display package
cd packages/phoenix-event-display
yarn link
cd ../phoenix-ng
yarn link "phoenix-event-display"

## Run the event display in development mode
cd ../phoenix-event-display
yarn start

## Run the Angular app
cd ../phoenix-ng
yarn start
```

Now any changes in the [phoenix-event-display](https://www.npmjs.com/package/phoenix-event-display) package ([source](https://github.com/HSF/phoenix/tree/master/packages/phoenix-event-display)) will build the package and the Angular app will pick up the changes made to the event display.

### Deploy the application

In order to make a version of Phoenix which can be deployed to your server, from the `packages/phoenix-ng` directory, run the following command:

```sh
yarn deploy:web
```

You can then copy the files generated in `./docs` to your server e.g. with:

```sh
rsync -avz docs/ your-server.net:path/to/website
```

#### Deploy with a specific event

Phoenix can also be deployed as a single page application with a specific event. To do that.

1. Copy the event data to [./projects/phoenix-app/src/assets](./projects/phoenix-app/src/assets) (or you can use a URL instead)
1. Specify the event data type and file path (or URL) in [./projects/phoenix-app/event-config.json](./projects/phoenix-app/event-config.json)
1. Lastly, in the `packages/phoenix-ng` directory, run the command: `yarn deploy:web:single`

The deployed application will be in [./docs](./docs) which can be copied directly to a server.
