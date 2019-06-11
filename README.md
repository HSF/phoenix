[![Build Status][build-img]][build-link]  [![License][license-img]][license-url][![Coverage Status](https://coveralls.io/repos/github/emiliocortina/phoenix/badge.svg?branch=master)](https://coveralls.io/github/emiliocortina/phoenix?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/emiliocortina/phoenix/badge.svg?targetFile=package.json)](https://snyk.io/test/github/emiliocortina/phoenix?targetFile=package.json)
[![Maintainability](https://api.codeclimate.com/v1/badges/ccfa8dc1854142433f65/maintainability)](https://codeclimate.com/github/emiliocortina/phoenix/maintainability)
[![DOI](https://zenodo.org/badge/135442382.svg)](https://zenodo.org/badge/latestdoi/135442382)

[build-img]: https://travis-ci.com/HSF/phoenix.svg?branch=master
[build-link]: https://travis-ci.com/HSF/phoenix
[license-img]: https://img.shields.io/github/license/hsf/phoenix.svg
[license-url]: https://github.com/hsf/phoenix/blob/master/LICENSE

![Phoenix Logo](./src/assets/images/logo-text.svg)
# Phoenix Project

The idea of this project is to have a simple way to visualise event and geometry data using nothing more than a web browser. The data should be as detector-agnostic as possible.
Technically the 3D is done with [three.js](http://threejs.org), the menu (at the moment) uses [DAT.GUI](https://code.google.com/archive/p/dat-gui/) and the data format is just plain JSON.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Using this with your own data

The JSON format is pretty simple, but we're still in the process of documenting it (and it might evolve).

Otherwise, here are some rough explanations:

#### Event data
Currently Phoenix supports the following physics objects:

* Tracks - the trajectory of a charged particle (usually in a magnetic field)
* Calorimeter clusters - deposits of energy in a calorimeter
* Jets - cones of activity within the detector
* Hits - individual measurements

And coming soon:

* Vertices
* Compound objects (i.e. 'Muons', which link 'Tracks' and 'Clusters')

The format is the following:

```
{ "event number":XXX, "run number":YYY, "OBJECT_TYPE":{"COLLECTION_NAME" : [ OBJECTS ]}}""
```

where

* "event number" and "run number" are hopefully obvious,
* OBJECT_TYPE is one of the supported types mentioned above,
* and COLLECTION_NAME is an arbitrary name used to label this particular collection (you can have as many collections of each OBJECT_TYPE as you like).

Uniquely for clusters, you need to define the plane(s) on which to project the clusters as a property of the collection itself, using the following notation

```
'CYL':[30.2493,243.645,136.947,213.396,3.14159,2850]
```

(other shapes will be supported soon)

What follows in the list of objects depends on the type:

* 'Tracks' have the following information:
  * 'chi2' - the chi2 of the fit, i.e. a number
  * 'dof' - the degrees of freedom of the fit, i.e. a number (not necessarily an integer)
  * 'params' - the parameters of the tracks, defined as d0,z0, ABC
  * 'pos' - further positions along the track (a possible extension is to store positions and directions, to permit bezier curves, and perhaps a simple extrapolation system which would further reduce the amount of information needing to be stored)
* 'Clusters' have the following information:
  * 'phi' - phi direction
  * 'eta' - eta direction
* 'Jets' have the following information:
  * 'coneR' - the radius of the jet cone
  * 'phi'- phi direction
  * 'eta' - eta direction

As an example:

```
{ "event number":123, "run number":234, "Tracks" : {"Inner Detector Tracks":[ {"chi2":52.1087, "dof":34, "params": [-0.0150713, 0.725162, 2.11179, 2.86823, -3.23906e-05], "pos": [] }}
```

### Geometry
#### Volumes

WEB supports a limited set of volumes at the moment. All are passed with the following notation
```
{ "Name" : XXX, "Shape" : YYY, "Bounds", [...], "Layers" : [...layers...], "Volumes" : [ ... sub-volumes ... ],  }
```
where the contents are:

* Name - an arbitrary name for the volume
* Shape - the shape of the volume (see below)
* Bounds - defines the size of the shape (see below)
* Layers - layers contained by this volume
* Volumes - sub-volumes contained by this volume

Currently the supported shapes are:

* 'CUB'/'BOX' - a cube in space, defined by its width/height/depth.
* 'CYL' - a cylinder, defined by inner radius, outer radius, medium radius, deltaRadius and halflengthZ.

#### Surfaces
TODO


### Interactivity

If you open `geom_display.html` it will show a basic geometry, constructed entirely programmatically.

![basic geometry](./src/assets/images/basic_geom.png)

the javascript to do this is the following :
```javascript
  var parameters = { ModuleName: "Module 2", Xdim:10., Ydim:1. , Zdim:45, NumPhiEl:64, NumZEl:10, Radius:75, MinZ:-250, MaxZ:250, TiltAngle:0.3, PhiOffset:0.0, Colour:0x00ff00, EdgeColour:0x449458  };
  window.EventDisplay.buildGeometryFromParameters(parameters);
```

If you are using a modern browser (e.g. Safari/Chrome etc ) you should be able to open a developer console. In this you can type e.g.

```javascript
var parameters2 = { ModuleName: "Module 3", Xdim:18., Ydim:1. , Zdim:85, NumPhiEl:64, NumZEl:10, Radius:150, MinZ:-450, MaxZ:450, TiltAngle:0.3, ZTiltAngle:0.0, PhiOffset:0.0, Colour:0xff3300, EdgeColour:0xff9c3e  };

window.EventDisplay.buildGeometryFromParameters(parameters2);
```
and you can add another layer, as shown below.

![adding a layer interactively](./src/assets/images/basic_geom_2.png)


## Testing
###Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).


## Contact

This is still very much a work in progress, so let me know of any problems (and don't be too surprised if there are some).

edward.moyse@cern.ch
