# User manual

## Using this with your own data

The JSON format is pretty simple, but we're still in the process of documenting it (and it might evolve).

Otherwise, here are some rough explanations:

### Event data

#### Format

Currently Phoenix supports loading `.JSON` files containing multiple events. The format is the following.

```json
{
  "EVENT_KEY_1": event_object,
  "EVENT_KEY_2": event_object,
  ...
  "EVENT_KEY_N": event_object
}
```

`EVENT_KEY` is an identifier for each event, and the format of each `event_object` would be as follows: 

```json
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

You can find various examples in the [files folder](../packages/phoenix-app/src/assets/files):

* [atlaseventdump2.json](../packages/phoenix-app/src/assets/files/event_data/atlaseventdump2.json) is an small multiple event file containing the various objects.
* [EventData.json](../packages/phoenix-app/src/assets/files/event_data/EventData.json) is a bigger file containing more events and objects.

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

![sample geometry](../packages/phoenix-app/src/assets/images/geometry.png)

Phoenix currently supports loading `.obj`, `.gltf`, `.root`, `.json.gz` and `.json` files containing 3D objects.
