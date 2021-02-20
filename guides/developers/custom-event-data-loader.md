# Event data loader

An event data loader in Phoenix is used to convert an event data format into something conceivable by Phoenix. In most cases, the loader reads the data from an unfamiliar format and converts it to the intermediate [Phoenix format](../users.md#format) which can then be used to create physics objects like Tracks and Hits.

Under the hood, the event data loader processes the event data and constructs three.js objects out of it which are then added to the scene along with some configurable options.

The [`EventDataLoader`](../../packages/phoenix-event-display/src/loaders/event-data-loader.ts) interface works as a base for implementing all the loaders including the `PhoenixLoader`.

## Examples

* [`PhoenixLoader`](../../packages/phoenix-event-display/src/loaders/phoenix-loader.ts)
* Extended from `PhoenixLoader`
  * [`JiveXMLLoader`](../../packages/phoenix-event-display/src/loaders/jivexml-loader.ts)
  * [`CMSLoader`](../../packages/phoenix-event-display/src/loaders/cms-loader.ts)

## Creating a custom event data loader

An event data loader can be created from ground up but if there are objects (for example Tracks and Hits) that can be used from an already existing loader, then the new loader is extended from that loader. This also takes care of linking the event data to UI elements like the Phoenix menu and collections info panel etc.

Extending the new loader from an already existing one can take care of the 3D construction of supported physics objects but the event format still has to be converted to a Phoenix friendly format (which is the Phoenix format for now).

For constructing physics object(s) currently not a part of [`PhoenixObjects`](../../packages/phoenix-event-display/src/loaders/objects/phoenix-objects.ts), their construction can be custom coded and included in the loader. Like the `MuonChambers` constructed through [`CMSObjects`](../../packages/phoenix-event-display/src/loaders/objects/cms-objects.ts) and loaded through the [`CMSLoader`](../../packages/phoenix-event-display/src/loaders/cms-loader.ts#L31).

Depending on the type of your event data, you made need to process it to a JavaScript object so you can read the data. For example, in the [`CMSLoader`](../../packages/phoenix-event-display/src/loaders/cms-loader.ts), the ".ig" archive is read and the events inside are converted to a JavaScript array of objects which is then processed to get the properties of the different physics objects and convert them to the Phoenix format.

### Sample code for a custom loader

Now let's get to the code.

We will need to create a new event data loader class extended from the `PhoenixLoader`. For simplicity, we are assuming that the new event data format which the loader is for is a text file and contains data for a single event.

```ts
import PhoenixLoader from 'phoenix-event-display';

export class CustomLoader extends PhoenixLoader {

  constructor(eventData: any) {
    // `eventData` is inherited from `PhoenixLoader`
    this.eventData = eventData;
  }

  /**
   * This will convert the event data to the Phoenix format.
   */
  getEventData(): any {
    const processedEventData = {
      Tracks: {},
      Hits: {},
      CustomPhysicsObject: {}
    };

    // These get functions are a part of the laoder and will convert
    // each type of event data to the Phoenix format
    processedEventData.Tracks = this.getTracks();
    processedEventData.Hits = this.getHits();
    processedEventData.CustomPhysicsObject = this.getCustomPhysicsObject();

    return processedEventData;
  }

  /**
   * Get Tracks properties from your event data format.
   */
  private getTracks() {
    // Logic to process Tracks from your event data format to Phoenix format
  }

  /**
   * Get Hits properties from your event data format.
   */
  private getHits() {
    // Logic to process Hits from your event data format to Phoenix format
  }

  /**
   * Get CustomPhysicsObject properties from your event data format.
   */
  private getCustomPhysicsObject() {
    // Logic to process CustomPhysicsObject from your event data format to Phoenix format
  }

}
```
