# Event data loader

* [Introduction](#introduction)
* [Example loaders](#example-loaders)
* [Creating a custom event data loader](#creating-a-custom-event-data-loader)
  * [Handling new physics objects](#handling-new-physics-objects)
  * [Coding a custom loader](#coding-a-custom-loader)
  * [Using the custom loader](#using-the-custom-loader)

## Introduction

An event data loader in Phoenix is used to convert an event data format into something conceivable by Phoenix. In most cases, the loader reads the data from an unfamiliar format and converts it to the intermediate [Phoenix format](../users.md#format) which can then be used to create physics objects like Tracks and Hits.

Under the hood, the event data loader processes the event data and constructs three.js objects out of it which are then added to the scene along with some configurable options.

The [`EventDataLoader`](../../packages/phoenix-event-display/src/loaders/event-data-loader.ts) interface works as a base for implementing all the loaders including the `PhoenixLoader`.

## Example loaders

* [`PhoenixLoader`](../../packages/phoenix-event-display/src/loaders/phoenix-loader.ts)
* Extended from `PhoenixLoader`
  * [`JiveXMLLoader`](../../packages/phoenix-event-display/src/loaders/jivexml-loader.ts)
  * [`CMSLoader`](../../packages/phoenix-event-display/src/loaders/cms-loader.ts)

## Creating a custom event data loader

An event data loader can be created from ground up but if there are objects (for example Tracks and Hits) that can be used from an already existing loader, then the new loader is extended from that loader. This also takes care of linking the event data to UI elements like the Phoenix menu and collections info panel etc.

Extending the new loader from an already existing one can take care of the 3D construction of supported physics objects but the event format still has to be converted to a Phoenix friendly format (which is the [Phoenix format](../users.md#format) for now).

### Handling new physics objects

For constructing physics object(s) currently not a part of [`PhoenixObjects`](../../packages/phoenix-event-display/src/loaders/objects/phoenix-objects.ts), their construction can be custom coded and included in the loader. Like the `MuonChambers` constructed through [`CMSObjects`](../../packages/phoenix-event-display/src/loaders/objects/cms-objects.ts) and loaded through the [`CMSLoader`](../../packages/phoenix-event-display/src/loaders/cms-loader.ts#L31).

Currently supported physics objects are:

1. [`PhoenixObjects`](../../packages/phoenix-event-display/src/loaders/objects/phoenix-objects.ts) (processed and loaded through `PhoenixLoader`)
    1. Tracks
    1. Jets
    1. Hits
    1. CaloClusters
    1. Muons
    1. Vertices
1. [`CMSObjects`](../../packages/phoenix-event-display/src/loaders/objects/cms-objects.ts) (processed and loaded through `CMSLoader`)
    1. MuonChambers

The following code defines a mechanism to contruct a custom object which is later sent to the event display by the custom loader in the next section.

`custom-objects.ts`

```ts
import { Object3D } from 'three';

export class CustomObjects {
  /**
   * Get the 3D custom object contructed from the given parameters.
   */
  public static getCustomPhysicsObject(customPhysicsObjectParams: any): Object3D {
    let customObject: Object3D;

    // Logic to construct the 3D object from the given parameters

    return customObject;
  }
}
```

### Coding a custom loader

> **NOTE**: The code given here is just for explanation and will not work independently.

Depending on the type of your event data, you may need to process it to a JavaScript code friendly object so you can read the data in code. For example, in the [`CMSLoader`](../../packages/phoenix-event-display/src/loaders/cms-loader.ts), the ".ig" archive is read and the events inside are converted to a JavaScript array of objects which is then processed to get the properties of the different physics objects from collections.

For our custom loader, we will need to create a new event data loader class extended from the `PhoenixLoader`. For simplicity, we are assuming that the new event data format which the loader is for is a text file and contains data for a single event.

`custom-loader.ts`

```ts
import PhoenixLoader from 'phoenix-event-display';

// Your custom physics objects
import CustomObjects from 'custom-objects.ts';

export class CustomLoader extends PhoenixLoader {
  /** The event data in your format. */
  private data: any;

  setRawEventData(eventData: any) {
    this.data = eventData;
  }

  /**
   * This will convert the event data to the Phoenix format.
   */
  getEventData(): any {
    const processedEventData = {
      Tracks: {},
      Hits: {},
      CustomPhysicsObject: {},
    };

    // These get functions are a part of the loader and will convert
    // each type of event data to the Phoenix format
    processedEventData.Tracks = this.getTracks();
    processedEventData.Hits = this.getHits();
    processedEventData.CustomPhysicsObject = this.getCustomPhysicsObject();

    return processedEventData;
  }

  /**
   * If you have introduced a new physics object. Then you need to override this method add your object type.
   * @param eventData This is the processed event data in Phoenix format handled by the `PhoenixLoader`.
   */
  protected loadObjectTypes(eventData: any) {
    // Call the PhoenixLoader method to load the supported physics objects
    super.loadObjectTypes(eventData);
    // Process the custom physics object
    if (eventData.CustomPhysicsObject) {
      this.addObjectType(
        eventData.CustomPhysicsObject,
        CustomObjects.getCustomPhysicsObject,
        'CustomPhysicsObject'
      );
    }
  }

  /**
   * Get Tracks properties from your event data format.
   */
  private getTracks() {
    // Logic to process Tracks from your event data format (this.data) to Phoenix format
  }

  /**
   * Get Hits properties from your event data format.
   */
  private getHits() {
    // Logic to process Hits from your event data format (this.data) to Phoenix format
  }

  /**
   * Get CustomPhysicsObject properties from your event data format.
   */
  private getCustomPhysicsObject() {
    // Logic to process CustomPhysicsObject from your event data format (this.data) to Phoenix format
  }
}
```

### Using the custom loader

```ts
import EventDisplay from 'phoenix-event-display';
import CustomLoader from 'custom-loader.ts';

// Instantiate the new custom loader
const customLoader = new CustomLoader();

// Specify the configuration and use your custom loader as the event data loader
const configuration = {
  elementId: '<wrapper_element_id>',
  eventDataLoader: customLoader
}

// Create the event display
const eventDisplay = new EventDisplay(configuration);

// Fetch data of your event file
fetch('path/to/your/event/file.custom')
  .then((res) => res.text())
  .then((rawEventData) => {

    // Set the raw event data in the custom loader
    customLoader.setRawEventData(rawEventData);
    // Process the raw event data and get it in Phoenix format
    const eventData = customLoader.getEventData();
    // Process the converted event data and display it
    eventDisplay.buildEventDataFromJSON(eventData);

  });
```
