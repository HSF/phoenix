[![DOI](https://zenodo.org/badge/135442382.svg)](https://zenodo.org/badge/latestdoi/135442382)

[![License][license-img]][license-url]
[![Build Status][build-img]][build-link]
[![Coverage Status](https://coveralls.io/repos/github/HSF/phoenix/badge.svg?branch=master)](https://coveralls.io/github/HSF/phoenix?branch=master)
[![Gitter](https://badges.gitter.im/phoenix-developers/community.svg)](https://gitter.im/phoenix-developers/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

[build-img]: https://github.com/HSF/phoenix/actions/workflows/main.yml/badge.svg?branch=master
[build-link]: https://github.com/HSF/phoenix/actions/workflows/main.yml?query=branch%3Amaster
[license-img]: https://img.shields.io/github/license/hsf/phoenix.svg
[license-url]: https://github.com/hsf/phoenix/blob/main/LICENSE

![Phoenix Logo](https://raw.github.com/HSF/phoenix/master/packages/phoenix-ng/projects/phoenix-app/src/assets/images/logo-text.svg)

# Phoenix

Phoenix is a TypeScript-based event display framework, using the popular [three.js](https://threejs.org) library for 3D. It focuses on being experiment agnostic by design, with common tools (such as custom menus, controls, propagators) and the possibility to add experiment specific extensions.

It consists of two packages: a plain TypeScript core library ([phoenix-event-display](./packages/phoenix-event-display/README.md)) and Angular example application ([phoenix-ng](./packages/phoenix-ng/README.md)). A React example is also [provided](https://github.com/9inpachi/phoenix-react). The core library can be adapted for any experiment with some simple steps.

Phoenix is supported by the [HEP Software Foundation](https://hepsoftwarefoundation.org) and is the official web event display of the [ATLAS experiment](https://atlas.cern).

It was selected for Google Summer of Code support in 2019, 2020 and 2021.

You can see the stable version at [https://hepsoftwarefoundation.org/phoenix](https://hepsoftwarefoundation.org/phoenix/) and the development version at [http://phoenix-dev.surge.sh](http://phoenix-dev.surge.sh).

## Demo

[![Phoenix demo](https://raw.github.com/HSF/phoenix/master/packages/phoenix-ng/projects/phoenix-app/src/assets/images/video-cover.png)](https://www.youtube.com/watch?v=ETtkZ-mnzgQ)

## Packages

* [`phoenix-event-display`](./packages/phoenix-event-display/)  
  Phoenix event display framework
* [`phoenix-ng`](./packages/phoenix-ng/)  
  Phoenix Angular application

## Development

For running both the event display and the Angular app, you will need [Node.js](https://nodejs.org/en/download/) and Yarn.

* **N.B.** There seems to be a problem with node v21 and ARM devices. See [here](https://github.com/HSF/phoenix/issues/627) for more details.

Once you have Node.js and npm (npm comes with Node.js), install Yarn.

```sh
npm install --global yarn
```

> You might need to set your Yarn version to Yarn 2 and beyond with
> ```
> yarn set version berry
> ```

Then run the following commands.

```sh
# Install all the required dependencies
yarn install
# For macOS Ventura you may need to specify C++ version, e.g. yarn install -std=c++17

# Run phoenix-event-display and phoenix-app in development/watch mode
yarn start
```

Now both the `phoenix-event-display` and `phoenix-app` will start in development/watch mode. Any changes made to the `phoenix-event-display` will rebuild and hot reload the `phoenix-app`. You can access the app by navigating to [`http://localhost:4200`](http://localhost:4200) on the browser.

## Docker

Run the following Docker command to start Phoenix locally using Docker.

```sh
docker run -dp 80:80 9inpachi/phoenix
```

Access the app by navigating to [`http://localhost`](http://localhost) on the browser.

## Documentation

* [User manual](./guides/users.md)
* [Developer guide](./guides/developers#readme)
* [How to contribute](./CONTRIBUTING.md)
* [API docs](https://hepsoftwarefoundation.org/phoenix/api-docs/)

## Phoenix presentations and publications

* Phoenix was presented at the 2020 [HSF/WLCG virtual workshop](https://indico.cern.ch/event/941278/contributions/4084836/) and the presentation can be watched on [YouTube](https://www.youtube.com/watch?v=aFvlf9TpyEc&t=347s)
* Phoenix was shown at CHEP 2021 ([abstract](https://www.epj-conferences.org/articles/epjconf/pdf/2021/05/epjconf_chep2021_01007.pdf)).

## Examples of Phoenix in use

### ATLAS
[PhoenixATLAS](https://github.com/ATLAS-experiment/PhoenixATLAS) is the official web event display of the [ATLAS experiment](https://atlas.cern). It can be used to visualise different versions of ATLAS Geometry, and uploaded events.

ATLAS has also used it for embedded events in Physics briefings, e.g. [Heavyweight champions: a search for new heavy W' bosons with the ATLAS detector](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwi5vtnp8Yr8AhWw9LsIHeSPBRoQFnoECCAQAQ&url=https%3A%2F%2Fatlas.cern%2Fupdates%2Fbriefing%2Fsearch-heavy-W-bosons&usg=AOvVaw3RpPlPkM5i4gdk2S27cX-C)

### FCC
Phoenix is also used by [Future Circular Collider](https://fcc.web.cern.ch), see [here](https://fccsw.web.cern.ch/fccsw/phoenix/).

### LHCb
Phoenix is also used by [LHCb](http://lhcb.web.cern.ch), see [here](https://lhcb-eventdisplay.web.cern.ch/)

### Belle II
Phoenix is also used by [Belle II](https://www.belle2.org), see [here](https://display.belle2.org/)


## Contact
The best way to contact us is to either open an issue in GitHub, start a [discussion](https://github.com/HSF/phoenix/discussions) or talk to us on our [gitter channel](https://gitter.im/phoenix-developers/community) (though this is not used as much these days).
