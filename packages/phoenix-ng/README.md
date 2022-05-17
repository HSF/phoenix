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

The source code of packages `phoenix-event-display` and `phoenix-ui-components` is linked to this application (`phoenix-ng`) through [TypeScript configuration](./tsconfig.json). So running this application in development mode (`yarn start`) and making any changes to either of the packages will rebuild and hot reload the application.

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
