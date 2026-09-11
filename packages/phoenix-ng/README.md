# Phoenix application

- [Build and run](#build-and-run)
- [Components](#components)
- [Event display](#event-display)
- [Development flow](#development-flow)
- [Deploy the application](#deploy-the-application)
  - [Deploy with a specific event](#deploy-with-a-specific-event)

## Build and run

This is an [Angular](https://angular.io) application, so you will need to have [Node.js](https://nodejs.org/en/) and [Angular CLI](https://github.com/angular/angular-cli) installed locally.

You can follow [this guide](https://angular.io/guide/setup-local) to set up your local environment.

Once everything is set up, run `ng serve` from the command line in the project directory for a dev server. Then navigate to `http://localhost:4200/` from your browser.  
The app will automatically reload if you change any of the source files.

## Components

This application uses components from the [`phoenix-ui-components`](https://github.com/HSF/phoenix/tree/master/packages/phoenix-ng/projects/phoenix-ui-components) package.

## Event display

This application uses the [`phoenix-event-display`](https://www.npmjs.com/package/phoenix-event-display) package ([source](https://github.com/HSF/phoenix/tree/master/packages/phoenix-event-display)) for all event display functionality.

## Development flow

`phoenix-ui-components` is linked to this application through a [TypeScript path mapping](./tsconfig.json) that points at its source, so running in development mode (`yarn start`) and changing it will rebuild and hot reload the application.

`phoenix-event-display` is **not** path mapped. It resolves through the `node_modules` symlink to its `main`, `dist/index`, so the app consumes its built output. Angular's watcher does not watch inside `node_modules`, which means a change there needs the library rebuilt _and_ the dev server restarted:

```sh
yarn workspace phoenix-event-display tsc:build
# then restart ng serve
```

`yarn start` from the repository root runs the library in watch mode alongside the dev server, but the two start concurrently and `ng serve` frequently bundles before the first library build lands — so the restart is still needed.

For the same reason the dev server would otherwise pre-bundle `phoenix-event-display` as a third-party dependency and cache it under `.angular/cache`, where a `dist` rebuild does not invalidate it and even a restart keeps serving the stale copy. `angular.json` excludes it from pre-bundling to prevent that. See [the root README](../../README.md#picking-up-changes-to-phoenix-event-display) for the details and how to spot it.

## Deploy the application

In order to make a version of Phoenix which can be deployed to your server, from the `packages/phoenix-ng` directory, run the following command:

```sh
yarn deploy:web
```

You can then copy the files generated in `./docs` to your server e.g. with:

```sh
rsync -avz docs/ your-server.net:path/to/website
```

### Deploy with a specific event

Phoenix can also be deployed as a single page application with a specific event. To do that.

1. Copy the event data to [./projects/phoenix-app/src/assets](./projects/phoenix-app/src/assets) (or you can use a URL instead)
1. Specify the event data type and file path (or URL) in [./projects/phoenix-app/event-config.json](./projects/phoenix-app/event-config.json)
1. Lastly, in the `packages/phoenix-ng` directory, run the command: `yarn deploy:web:single`

The deployed application will be in [./docs](./docs) which can be copied directly to a server.
