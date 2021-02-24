# Phoenix event display

The [`EventDisplay`](../../packages/phoenix-event-display/src/event-display.ts) class is the primary building block of Phoenix. As in the [Phoenix architecture](../#application-architecture), it interconnects the `ThreeManager`, `UIManager` and `EventDataLoader`. It works as the primary endpoint for accessing all Phoenix functions.

See the [API docs for `EventDisplay`](https://hepsoftwarefoundation.org/phoenix/api-docs/classes/EventDisplay.html) to have a deeper look at the available functions.

## Modularity and architectural overview

As specified in the [Phoenix architecture](../#application-architecture), the `EventDisplay` depends on some underlying managers to perform operations. Almost none of the functions of the `EventDisplay` are implemented directly in the `EventDisplay`. Instead the `EventDisplay` works as an intermediate interface that uses different managers and services to perform the relevant operations and interconnects them.\
Such an architecture helps in maintaining the modularity of Phoenix and makes it easier to add new functionality in isolation if needed.

The modular and extendable nature of Phoenix is not limited to just the `EventDisplay`. The managers are also further divided into sub managers each of which is responsible for handling and maintaining different aspects and features.

## [`ThreeManager`](../../packages/phoenix-event-display/src/three/index.ts)

The `ThreeManager` is responsible for performing all `three.js` related functions. Any feature that depends on the `three.js` library is implemented through the `ThreeManager`. Since Phoenix has a lot of features implemented through `three.js`, the `ThreeManager` is further divided into sub managers which have different roles.

Here is a a list of sub managers of `ThreeManager`:

* [**`AnimationsManager`**](../../packages/phoenix-event-display/src/three/animations-manager.ts)  
  Responsible for animation related operations. For example, animating the camera through the event.
* [**`ControlsManager`**](../../packages/phoenix-event-display/src/three/controls-manager.ts)  
  Manages are controls related functionality which includes the camera, orbit controls and zoom controls.
* [**`EffectsManager`**](../../packages/phoenix-event-display/src/three/effects-manager.ts)  
  Used for managing event display effects like the outline pass for selected object.
* [**`ExportManager`**](../../packages/phoenix-event-display/src/three/export-manager.ts)  
  Manages export related functions like exporting the event display to an `.obj` file or to the `.phnx` (Phoenix scene) file.
* [**`ImportManager`**](../../packages/phoenix-event-display/src/three/import-manager.ts)  
  Manages import related functions like importing different types of 3D geometries (`.gltf`, `.root`, `.obj` etc.) or event data.
* [**`RendererManager`**](../../packages/phoenix-event-display/src/three/renderer-manager.ts)  
  Manages `three.js` renderers used by Phoenix including both the main and overlay renderer (as in the overlay view).
* [**`SceneManager`**](../../packages/phoenix-event-display/src/three/scene-manager.ts)  
  Used to manage `three.js` scene related operations like traversing through the scene, applying color or opacity to 3D objects, managing scene lights etc.
* [**`SelectionManager`**](../../packages/phoenix-event-display/src/three/selection-manager.ts)  
  Manages selection functionality of the event display like applying outline pass to a selected object or getting selected object info for the object selection overlay.
* [**`VRManager`**](../../packages/phoenix-event-display/src/three/vr-manager.ts)  
  Used to manage VR related functions like starting a VR session, setting up VR controls etc.
