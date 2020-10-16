[![DOI](https://zenodo.org/badge/135442382.svg)](https://zenodo.org/badge/latestdoi/135442382)

[![License][license-img]][license-url]
[![Build Status][build-img]][build-link]
[![Coverage Status](https://coveralls.io/repos/github/HSF/phoenix/badge.svg?branch=master)](https://coveralls.io/github/HSF/phoenix?branch=master)
[![Gitter](https://badges.gitter.im/phoenix-developers/community.svg)](https://gitter.im/phoenix-developers/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

[build-img]: https://travis-ci.com/HSF/phoenix.svg?branch=master
[build-link]: https://travis-ci.com/HSF/phoenix
[license-img]: https://img.shields.io/github/license/hsf/phoenix.svg
[license-url]: https://github.com/hsf/phoenix/blob/master/LICENSE

![Phoenix Logo](https://raw.github.com/HSF/phoenix/master/packages/phoenix-app/src/assets/images/logo-text.svg)

# Phoenix

The idea of this project is to have a simple way to visualise event and geometry data using nothing more than a web browser. The design should be as detector-agnostic as possible.
Technically the 3D is implemented with [three.js](https://threejs.org) and the native data format is just plain JSON (though we have many loaders to convert from other formats).

You can see an online version at [https://hepsoftwarefoundation.org/phoenix/](https://hepsoftwarefoundation.org/phoenix/)

## Demo

[![Phoenix demo](https://raw.github.com/HSF/phoenix/master/packages/phoenix-app/src/assets/images/video-cover.png)](https://www.youtube.com/watch?v=75MWVRzVvoY)

## Projects

* [Phoenix event display API - `phoenix-event-display`](./packages/phoenix-event-display/)
* [Phoenix application (Angular) - `phoenix-app`](./packages/phoenix-app/)

## Development

For running both the event display and the Angular app, you will need [Node.js](https://nodejs.org/en/download/) and lerna.

Once you have Node.js and npm installed (npm comes with Node.js), install lerna.

```sh
npm install --global lerna
```

Then run the following set of commands.

```sh
# Install all the required dependencies for both phoenix-event-display and phoenix-app and symlink the packages
npm run install:dependencies

# Run both packages in development (watch) mode
npm run start
```

Now both the `phoenix-event-display` and `phoenix-app` will start in development / watch mode. Any changes made to the `phoenix-event-display` will rebuild and hot reload the `phoenix-app`. You can access the app by navigating to `http://localhost:4200` on the browser.

## Documentation

* [User manual](./guides/users.md)
* [Developer guide](./guides/developers.md)
* [How to contribute](./CONTRIBUTING.md)
* [API docs](https://hepsoftwarefoundation.org/phoenix/api-docs/)

## Contact

Best is to either open an issue in GitHub, or talk to us on our [gitter channel](https://gitter.im/phoenix-developers/community).
