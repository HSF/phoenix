WebEventDisplay
===============

Introduction
------------

The idea of this project is to have a simple way to visualis event and geometry data using nothing more than a web browser. The data should be as detector-agnostic as possible.

Technically the 3D is done with [three.js](http://threejs.org), the menu (at the moment) uses [DAT.GUI](https://code.google.com/archive/p/dat-gui/) and the data format is just plain JSON. 

Installation
------------

To install, you need to clone this repository, but also copy any missing files from [here](http://emoyse.web.cern.ch/emoyse/WebEventDisplay/js/) and put them in your local js directory.
It should then be enough to open `jsdisplay.html` in a web browser.

Using this with your own data
-----------------------------

The JSON format is pretty simple, and soon I'll actually document it! For the moment, have a look at the `.json` files in http://emoyse.web.cern.ch/emoyse/WebEventDisplay

This is still very much a work in progress, so let me know of any problems (but don't be too surprised if there are some).

Ed
