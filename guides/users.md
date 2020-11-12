# User manual

## Getting started

### The demo grid

When you first open the Phoenix [demo](https://hepsoftwarefoundation.org/phoenix) (see the developer [instructions](../guides/developers.md) for how to check it out and run locally) you will see a grid of Phoenix demos:

  * **Playground** : a blank canvas where you can load 3D objects, move them around and generally experiment with Phoenix
  * **Geometry display** : a simple demo of generating geometry procedurally/programmatically with Phoenix
  * **ATLAS** : the ATLAS experiment demo. Here you can load `Phoenix JSON` or `JiveXML` event data files, and visualise physics objects such as Jets, Tracks, Calo cells etc within the ATLAS geometry.
  * **LHCb** : the LHCb experiment demo shows a detailed view of the LHCb geometry, as well as tracks passing through it.
  * **CMS** : the CMS experiment demo. Here you select from various event data files, and visualise physics objects such as Jets, Tracks, Calo cells etc within the CMS geometry. One special feature of the CMS demo is the visualisation of Muon Chambers.
  * **TrackML** : this shows the imaginary detector created for the TrackML [challenges](https://www.kaggle.com/c/trackml-particle-identification).
  
### The phoenix standard UI

Since Phoenix is configurable, it is not guaranteed that all demos/implementations will look the same, but a typical Phoenix view is shown below:

![Main view of Phoenix](images/phoenix-main-view.png "Main View of Phoenix")

In the centre, you see the 3D view of the experiment and event data.

Around it, you have:

1. The (configurable) experiment logo and event data
2. The Phoenix logo (which is also a link back to the demo grid)
3. The Phoenix menu (see below for more details)
4. The Phoenix iconbar (see below for more details)
5. The frames-per-second (FPS) graph

In general the Phoenix menu is used to determine what geometry and event data is shown (and how), whilst the iconbar determines how you interact with the geometry and event data.

### The Phoenix menu

All items in the phoenix menu have the same basic layout:

![Phoenix menu item](images/phoenix-menu-item.png "Phoenix menu item")

From left-to-right:

  * A slider, which determines if the item (or the sub-items beneath it) is visible
  * The name of the item
  * A gear icon, to open the options for this item
  * And an arrow to open/collapse sub items.

As an example of options, here is an expanded geometry view:

![Phoenix geometry menu item](images/phoenix-menu-geometry.png "Phoenix geometry menu item")

you can see that we can change the opacity and colour of the geometry item.

Another example of options: here is an expanded event data view, showing how you can apply cuts to track collections:
![Phoenix event menu item](images/phoenix-menu-item-event-options.png "Phoenix event menu item")

Another important point: clicking on the gear icon at the very top allows you to save/load the menu configuration.

![Phoenix menu options](images/phoenix-menu-main-options.png "Main options of the Phoenix menu")

### The Phoenix iconbar

At the bottom of the main view you have the phoenix iconbar (which can be shown/hidden by clicking on the arrow on top):

![Phoenix iconbar](images/phoenix-icon-bar.png "Phoenix icon bar")

From left to right, you can access the following functions:

   * **Zoom** : the plus/minus icons allow you to zoom in and out, respectively
   * **Pre-defined views** : clicking on this will allow you to access some preset views, and to view/hide the axes
   * **Auto-rotate** : clicking on this will set the camera orbiting the origin
   * **Dark/light theme** : switches between dark and light themes
   * **Geometry clipping** : allows you to 'slice' away parts of the geometry in order to view the event data/geometry inside
   * **Orthographic/perspective view** : allows you to switch between different view modes
   * **Overlay** : enables/disables the view overlay (a separate overlaid view of the detector)
   * **Object selection** : once enabled, a new window will pop up which will display information about selected objects
   * **Info panel** : shows a window displaying relevant information from Phoenix (for example, about events opened)
   * **Collision animation** : starts a simple animation, simulating a collision and subsequent event data appearing
   * **Event animation** : starts a simple animation, flying through the detector
   * **Collection information** : displays a panel showing textual information about the event data collections (see below)
   * **Import/export** : allows you to load new event data, or detector geometry (depending on configuration)

And if you have a AR/VR headset plugged in (or are using it on a smartphone browser which supports this) then you will also see a VR headset icon, which will take you into the phoenix VR mode (see below)

#### Collections info panel

![Phoenix collections info](images/phoenix-collections-info-pane.png "Phoenix collections info")

This displays some more details about the various collections. And under the **Selection** column are two icons, which allow you to either zoom the camera to the object, or to select (and highlight) it.

### Keyboard controls

Phoenix support various keyboard controls:

   * **Shift-T** : change theme
   * **Shift-Number** : switch to that numbered preset view
   * **Shift-R** : rotate view
   * **+/-** : zoom
   * **Shift-C** : enable clipping
   * **Shift-V** : switch between orthographic and perspective

### VR mode

Phoenix relies on the WebXR functionality of [three.js](https://threejs.org), so before trying it in Phoenix, it would be a good idea to test the VR/AR demos there.

Currently it has been tested on the following devices:

   * Android smartphones
   * Oculus Quest (make sure you use the Oculus browser - Firefox reality is currently unusably slow)
   * Oculus Rift S (as of writing, the best option seems to be to use google Chrome canary i.e. beta)

The situation here is rapidly changing, so please let us know if this is out-of-date. Also please note that some features of Phoenix need to be disabled in VR, and it is currently very much a work in progress (help is very much welcomed!).

## Using Phoenix with your own data

The JSON format is pretty simple, but we're still in the process of documenting it (and it might evolve).

Caveats aside, here are some rough outlines:

### Event data

#### Format

Currently Phoenix supports loading `.JSON` files containing multiple events. The format is the following.

```js
{
  "EVENT_KEY_1": event_object,
  "EVENT_KEY_2": event_object,
  ...
  "EVENT_KEY_N": event_object
}
```

`EVENT_KEY` is an identifier for each event, and the format of each `event_object` would be as follows: 

```js
{
  "event number": XXX,
  "run number": YYY,
  "OBJECT_TYPE_1": {
    "COLLECTION_NAME_X" : [ OBJECTS ]
  },
  "OBJECT_TYPE_2": {
    "COLLECTION_NAME_Y" : [ OBJECTS ],
    "COLLECTION_NAME_Z" : [ OBJECTS ]
  }
}
```

Where:

* `event number` and `run number` are hopefully obvious,
* `OBJECT_TYPE` is one of the supported types that will be mentioned [below](#supported-object-types),
* `COLLECTION_NAME` is an arbitrary name used to label this particular collection (you can have as many collections of each OBJECT_TYPE as you like).

You can find various examples in the [files folder](../packages/phoenix-ng/projects/phoenix-app/src/assets/files):

* [atlaseventdump2.json](../packages/phoenix-ng/projects/phoenix-app/src/assets/files/event_data/atlaseventdump2.json) is an small multiple event file containing the various objects.
* [EventData.json](../packages/phoenix-ng/projects/phoenix-app/src/assets/files/event_data/EventData.json) is a bigger file containing more events and objects.

#### Supported object types

Currently Phoenix supports the following physics objects:

* Tracks - the trajectory of a charged particle (usually in a magnetic field)
* Calorimeter clusters - deposits of energy in a calorimeter
* Jets - cones of activity within the detector
* Hits - individual measurements

And coming soon:

* Vertices
* Compound objects (i.e. 'Muons', which link 'Tracks' and 'Clusters')

(other shapes will be supported soon)

What follows in the list of objects depends on the type:

* 'Tracks' have the following information:
  * 'chi2' - the chi2 of the fit, i.e. a number
  * 'dof' - the degrees of freedom of the fit, i.e. a number (not necessarily an integer)
  * 'params' - the parameters of the tracks, defined as d0,z0, ABC
  * 'pos' - further positions along the track (a possible extension is to store positions and directions, to permit bezier curves, and perhaps a simple extrapolation system which would further reduce the amount of information needing to be stored)
  * 'color' - (Optional) Hexadecimal string representing the color to draw the track.
* 'Clusters' have the following information:
  * 'phi' - phi direction
  * 'eta' - eta direction
* 'Jets' have the following information:
  * 'coneR' - the radius of the jet cone
  * 'phi'- phi direction
  * 'eta' - eta direction
  * 'energy'
  
Uniquely for clusters, you need to define the plane(s) on which to project the clusters as a property of the collection itself, using the following notation
  
```json
  'CYL':[30.2493,243.645,136.947,213.396,3.14159,2850]
```

### Geometry

![sample geometry](images/phoenix-geometry.png "Geometry in Phoenix")

Phoenix currently supports loading `.obj`, `.gltf`, `.root`, `.json.gz` and `.json` files containing 3D objects.
