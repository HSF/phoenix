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

* `event number` (or `eventNumber`) and `run number` (or `runNumber`) are hopefully obvious,
* `OBJECT_TYPE` is one of the supported types that will be mentioned [below](#supported-object-types),
* `COLLECTION_NAME` is an arbitrary name used to label this particular collection (you can have as many collections of each `OBJECT_TYPE` as you like).
* `...` can be any other optional key/value pairs. Phoenix understands by default the following keys which will be used in the event Metadata panel, values being free strings :
  * `ls` will be printed for `LS` entry
  * `lumiBlock` will be printed for `LumiBlock` entry
  * `time` : will be printed for `Data recorded` entry
  

You can find various examples in the [files folder](../../docs/assets/files):

* [atlas.json](../../docs/assets/files/event_data/ATLAS_calibration.json) is an ATLAS Calibration file containing a single event.
* [LHCbEventData.json](../../docs/assets/files/lhcb/LHCbEventData.json) is a large file containing LHCb simulated events.


#### Supported object types

Currently Phoenix supports the following physics objects:

* Tracks - the trajectory of a charged particle (usually in a magnetic field)
* Jets - cones of activity within the detector
* Hits - individual measurements, which can either be points, lines, or boxes
* CaloClusters - clusters of deposits in a calorimeter
* [Planar/Irregular]CaloCells - deposits of energy in a calorimeter (cylindrical, planar and irregular geometries are supported).
* Vertices - optionally linked to tracks
* MissingEnergy
* Compound objects which link 'Tracks' and 'CaloClusters' :
  * Muons 
  * Photons
  * Electrons

(other shapes may be supported in the future)

What follows is the detailed format of each object type. Any extra entry is considered as decoration and will not be interpreted by phoenix, although it will be visible by the user.
In all the descriptions, `opt` means that the attribute described is optional.

Some attributes are used to build cut sliders in the collection's `Cut Options` menu folder. A cut is only shown if the attribute exists on the first object of the collection.

#### 'Tracks'
Tracks is a list of Track objects with the following attributes :
* `pos` - list of positions along the track, each given as a triplet [x, y, z]
* `dparams` (opt) - perigee parameters of the track: 5 floats matching [d0, z0, phi, theta, qOverP]. If `pos` is missing or has fewer than 3 positions, the track is extrapolated from `dparams` using a Runge-Kutta propagator
* `color` (opt) - Hexadecimal string representing the color to draw the track.
* `linewidth` (opt) - width of the track line (default 2)
* `phi`, `eta`, `d0`, `z0` (opt) - parameters of the track, used for cuts. If not given, they are derived from `dparams` (or, for `phi`/`eta`, from the first two positions of `pos`)
* `dca`, `angle` (opt) - distance of closest approach and polar angle in degrees, used for cuts. If not given, they are derived from the parameters above
* `chi2`, `dof`, `pT` (opt) - used for cuts
* `charge`, `mom` (opt) - charge and momentum, used by the `Color by` options (see below). Not needed if `dparams` is given, since then both are derived from the qOverP component

Available cuts: `phi`, `eta`, `chi2`, `dof`, `pT`, `z0`, `d0`, `dca`, `angle`.

#### 'Jets'
Jets are a list of Jet objects with the following attributes :
* `eta` - eta direction
* `phi`- phi direction
* `theta` (opt) - if not given, eta is used to calculate theta
* `energy`, `et` (opt) - energy of the Jets, used to set its length
* `coneR` (opt) - the radius of the jet cone. If not given, radius is 10% of the length
* `color` (opt) - Hexadecimal string representing the color to draw the jet.
* `origin_X`, `origin_Y`, `origin_Z` (opt) - origin of the jet (defaults to [0, 0, 0])

Available cuts: `phi`, `eta`, `energy`.

#### 'Hits'
Hits can be defined in 2 ways. Either as an array of positions or as an array of Hit objects.

In case array of positions is used, Hits have format [ [x,y,z], [x,y,z], [x,y,z], ... ] i.e. an array of 3-dim arrays containing Cartesian coordinates.
These will be rendered as points.

In case of array of Hit objects, format is [ hit, hit, hit ] where the hit object has the following attributes :
* `type` (opt) - type of Hit. One of `Point`, `CircularPoint`, `Line` or `Box`. Defaults to Point
* `pos` - an array of numbers describing the hit
  * for `Point` and `CircularPoint` types, it should have 3 coordinates : [x, y, z]
  * for `Line` type, it should have 6 coordinates : [x0, y0, z0, x1, y1, z1]
  * for `Box` type, it should have 6 coordinates : [x, y, z, length in x, width in y, height in z]
* `color` (opt) - Hexadecimal string representing the color to draw the hit.
* `size` (opt) - size of the drawn point (`CircularPoint` type only, default 10)

Note that all hit objects in a given Hits collection have to be of the same type, and that `type`, `color` and `size` are read from the first hit of the collection and applied to the whole collection.

#### 'CaloClusters' and 'CaloCells'
We are talking here of cylindrical calorimeters, the deposits will be displayed as boxes with a square base, oriented radially, positioned at a default barrel radius of 1800 (CaloClusters) or 1700 (CaloCells) and a default z of 3600 (CaloClusters) or 2000 (CaloCells).
'CaloClusters' and 'CaloCells' are lists of CaloCluster and CaloCell objects respectively. These have the same set of attributes :
* `energy` - energy of the cluster or deposit. For CaloClusters it is converted to the length of the displayed box (unless `length` is given); for CaloCells it is only used for cuts
* `phi` - phi direction
* `eta` - eta direction
* `theta` (opt) - if given, used instead of `eta` to position the box
* `radius` (opt) - cylindrical radius at which to draw the box, overriding the default
* `z` (opt) - z position at which to draw the box, overriding the default
* `side` (opt) - transverse size of the box (default 40 for CaloClusters, 30 for CaloCells)
* `length` (opt) - length of the box, overriding the energy-derived length (CaloCells default to 30)
* `color` (opt) - Hexadecimal string representing the color to draw the box.
* `opacity` (opt) - opacity of the box from 0 to 1 (CaloClusters only)

Available cuts: `phi`, `eta`, `energy`.

#### 'PlanarCaloCells'
We are talking here of planar calorimeters, the deposits will be displayed as boxes with square base of cellSize and length matching the energy.
These boxes will be positioned on a given plane (the plane of the calorimeter) at the specified coordinates in this plane.

PlanarCaloCells is an object with the following attributes :
* `plane` - the Calorimeter plane, defined as 4 numbers, giving a direction (normal to the plane) and a distance to the origin : [dx, dy, dz, length]
* `cells` - a list of Cell objects with the following attributes:
  * `cellSize` - size of the Calorimeter cell which fired
  * `energy` - energy of the deposit, converted to length of the displayed box
  * `pos` - position of the cell within the calo plane given as a pair [x, y]
  * `color` (opt) - Hexadecimal string representing the color to draw the cell.

Available cuts: `energy`.

#### 'IrregularCaloCells'
Calorimeter cells with arbitrary polyhedron-type geometry. 
Each cell is represented by 8 (x,y,z) vertices connected using a convex hull from the [ConvexGeometry](https://threejs.org/docs/#examples/en/geometries/ConvexGeometry) class.

IrregularCaloCells is a list of objects with the following attributes :
* `layer` - the Calorimeter layer, used for cuts
* `vtx` - a flattened list of 8 vertex coordinates (24 floats)
* `color` - an integer list of [R,G,B] values (note: not a hexadecimal string)
* `opacity` - value from 0 to 1

Available cuts: `layer`, `energy`.

#### 'Vertices'
Vertices are a list of Vertex objects with the following attributes :
* one of the 2 following sets of attributes 
  * `x`, `y`, `z` : describing the position of the vertex
  * `pos` : array of 3 numbers (x, y, z) describing the position of the vertex
* `color` (opt) - Hexadecimal string representing the color to draw the vertex.
* `size` (opt) - radius of the displayed sphere (default 3)
* `vertexType` (opt) - type of the vertex, used for cuts
* `linkedTracks` (opt) - list of indices of the tracks associated with this vertex
* `linkedTrackCollection` (opt) - name of the Tracks collection the `linkedTracks` indices refer to

If `linkedTracks` and `linkedTrackCollection` are given, the linked Tracks collection gets a `Color by` &rarr; `Vertex` option which colors each vertex and its associated tracks with a distinct color.

Available cuts: `vertexType`.

#### 'MissingEnergy'
This is a list of objects, displayed as dashed lines starting from 0 and staying in the plane z=0. Each object has the following attributes :
* `etx`, `ety` : describing the direction of the line
* `color` (opt) - Hexadecimal string representing the color to draw the line.

#### 'Muons', 'Electrons' and 'Photons'
These are compound objects which link to existing 'Tracks' and 'CaloClusters' objects of the event. Each object has the following attributes :
* `LinkedTracks` (opt) - list of strings of the form `"COLLECTION_NAME:INDEX"` (e.g. `"GSFTrackParticles:12"`), each identifying a track in a Tracks collection of the event (Muons and Electrons)
* `LinkedClusters` (opt) - list of strings of the form `"COLLECTION_NAME:INDEX"`, each identifying a cluster in a CaloClusters collection of the event
* `energy`, `eta`, `phi` (opt) - if no `LinkedClusters` are given, used to draw a cluster for Photons
* `eta`, `phi`, `pt` (opt) - if no `LinkedTracks` are given, used to extrapolate a track for Muons and Electrons
* `pdgId` (opt) - PDG ID of the particle, used to determine the charge of the extrapolated track

Available cuts: `phi`, `eta`, `energy`, `pT`.
