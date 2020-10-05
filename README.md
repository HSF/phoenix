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

* [Phoenix event display API](./packages/phoenix-event-display/)
* [Phoenix application (Angular)](./packages/phoenix-app/)

## Documentation

* [User manual](./guides/users.md)
* [Developer guide](./guides/developers.md)
* [How to contribute](./CONTRIBUTING.md)
* [API docs](https://hepsoftwarefoundation.org/phoenix/api-docs/)

## Contact

Best is to either open an issue in GitHub, or talk to us on our [gitter channel](https://gitter.im/phoenix-developers/community).
