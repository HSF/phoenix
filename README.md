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

Phoenix is a TypeScript-based event display framework, using the popular [three.js](https://threejs.org) library for 3D. It focuses on being experiment agnostic by design, with common tools (such as custom menus, controls, propagators) and the possibility to add experiment specific extensions. 

It consists of two packages: a plain TypeScript core library ([phoenix-event-display](packages/phoenix-event-display/README.md)) and Angular example applications ([phoenix-app](packages/phoenix-app/README.md)). A React example is also [provided](https://github.com/9inpachi/phoenix-react). The core library can be adapted for any experiment with some simple steps. 

Phoenix is the official web event display of both the [HEP Software Foundation](https://hepsoftwarefoundation.org), and the [ATLAS experiment](https://atlas.cern).

It was selected for Google Summer of Code support in 2019 and 2020.

You can see an online version at [https://hepsoftwarefoundation.org/phoenix/](https://hepsoftwarefoundation.org/phoenix/)

## Demo

[![Phoenix demo](https://raw.github.com/HSF/phoenix/master/packages/phoenix-app/src/assets/images/video-cover.png)](https://www.youtube.com/watch?v=75MWVRzVvoY)

## Components

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
