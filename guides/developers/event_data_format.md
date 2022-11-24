# Event Data Format

Phoenix internally makes use of a JSON format to represent event data. The JSON format is designed to be human-readable, but still compact. 

There is a [event_file_checker.py](https://github.com/HSF/phoenix-helpers/blob/main/checkers/event_file_checker.py) validation script provided in the [phoenix-helpers](https://github.com/HSF/phoenix-helpers) repository.


### Event data

#### Supporting multiple events

Currently Phoenix supports loading `.JSON` files containing multiple events. In a colliding beam experiment, these would typically represent the information recorded (or simulated) after the collision of two particles, but all that matters is this is one set of data which you want to visualise at the same time.

The format is the following.

```js
{
  "EVENT_KEY_1": event_object,
  "EVENT_KEY_2": event_object,
  ...
  "EVENT_KEY_N": event_object
}
```

`EVENT_KEY` is an identifier for each event (it could be a number, or a descriptive string e.g. 'HWW example'), and the format of each `event_object` would be as follows: 

```js
{
  "event number": XXX,
  "run number": YYY,
  ...
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
* `COLLECTION_NAME` is an arbitrary name used to label this particular collection (you can have as many collections of each `OBJECT_TYPE` as you like).
* `...` can be any other optional key/value pairs. Phoenix understands by default the following keys which will be used in the event Metadata panel, valuse being free strings :
  * `ls` will be printed for `LS` entry
  * `lumiblock` will be printed for `LumiBlock` entry
  * `time` : will be printed for `Data recorded` entry
  

You can find various examples in the [files folder](../packages/phoenix-ng/projects/phoenix-app/src/assets/files):

* [atlas.json](../packages/phoenix-ng/projects/phoenix-app/src/assets/files/event_data/event.json) is an ATLAS file containing two simulated events.
* [LHCbEventData.json](../packages/phoenix-ng/projects/phoenix-app/src/assets/files/lhcb/LHCbEventData.json) is a large file containing LHCb simulated events.


#### Supported object types

Currently Phoenix supports the following physics objects:

* Tracks - the trajectory of a charged particle (usually in a magnetic field)
* Jets - cones of activity within the detector
* Hits - individual measurements, which can either be points, lines, or boxes
* CaloClusters - cluters of deposits in a calorimeter
* [Planar]CaloCells - deposits of energy in a calorimeter (planar and cylindrical are supported).
* Vertices - optionally linked to tracks
* MissingEnergy
* Compound objects which link 'Tracks' and 'Clusters' :
  * Muons 
  * Photons
  * Electrons

(other shapes may be supported in the future)

What follows in the detailed format of each object type. Any extra entry is considered as decoration and will not be interpreted by phoenix, although it will be visible by the user. E.g. a Track can have `dof` attribute on top of `pos`, `color`, ...
In all the descriptions, `opt` means that the attribute described is optional.

#### 'Tracks'
Tracks is a list of Track objects with the following attrbutes :
* `pos` - list of positions along the track, each  given as a triplet [x, y, z]
* `color` (opt) - Hexadecimal string representing the color to draw the track.
* `dparams` (opt) - parameters of the tracks. 5 floats matching d0, z0, phi, eta, qOverP
* `d0`, `z0`, `phi`, `eta`, `qOverP`  (opt) - parameters of the tracks, taking precedence over `dparams`

#### 'Jets'
Jets are a list of Jet objects with the following attributes :
* `eta` - eta direction
* `phi`- phi direction
* `theta` (opt) - if not given, eta is used to calculate theta
* `energy`, `et` (opt) - energy of the Jets, used to set its length
* `coneR` (opt) - the radius of the jet cone. If not given, radius is 10% of the length
* `color` (opt) - Hexadecimal string representing the color to draw the jet.

#### 'Hits'
Hits can be defined in 2 ways. Either as an array of positions or as an array of Hit objects.

In case aray of positions is used, Hits have format [ [x,y,z], [x,y,z], [x,y,z], ... ] i.e. an array of 3-dim arrays containing Cartesian coordinate.
These will be rendered as points.

In case of array of Hit objects, format is [ hit, hit, hit ] where the hit object has the following attributes :
* `type` (opt) - type of Hit. One of `Point`, `Line` or `Box`. Defaults to Point
* `pos` - an array of number describing the hit
  * for `Point` type, it should have 3 coordinates : [x, y, z]
  * for `Line` type, it should have 6 coordinates : [x0, y0, z0, x1, y1, z1]
  * for `Box` type, it should have 6 coordinates : [x, y, z, length in x, width in y, height in z]
* `color` (opt) - Hexadecimal string representing the color to draw the hit.
Note that all hit objects in a given Hits collection have to be of the same type.

#### 'CaloClusters' and 'CaloCells'
We are talking here of cylindrical calorimeters, the deposits will be displayed as boxes with fixed square base and length matching the energy. The orientation of the boxes is radial.
'CaloClusters' and 'CaloCells' are lists of CaloCluster and CaloCell objects respectively. These have the same set of attributes :
* `energy` - energy of the cluster or deposit, converted to length of the displayed box
* `phi` - phi direction
* `eta` - eta direction
  
#### 'PlanarCaloCells'
We are talking here of planar calorimeters, the deposits will be displayed as boxes with square base of cellSize and length matching the energy.
These boxes will be positions on a given plane (the plane pf the calorimeter) at the specified coordinates in this plane.

PlanarCaloCells is an object with the following attributes :
* `plane` - the Calorimeter plane, defined as 4 numbers, giving a direction (normal to the plane) and a distance to the origin : [dx, dy, dz, length]
* `cells` - a list of Cell objects with the following attributes:
  * `cellSize` - size of the Calorimeter cell which fired
  * `energy` - energy of the deposit, converted to length of the displayed box
  * `pos` - position of the cell within the calo plane given as a pair [x, y]
  * `color` (opt) - Hexadecimal string representing the color to draw the cell.

#### 'Vertices
'Vertices are a list of Vertex objects with the following attributes :
* `color` (opt) - Hexadecimal string representing the color to draw the vertex.
* one of the 2 following sets of attributes 
  * `x`, `y`, `z` : describing the position of the vertex
  * `pos` : array of 3 numbers (x, y, z) describing the position of the vertex

#### MissingEnergy
This is a list of objects, displayed as dashed lines starting from 0 and staying in the plane z=0. Each object has the following attributes :
* `etx`, `ety` : describing the direction of the line
* `color` (opt) - Hexadecimal string representing the color to draw the line.
