# Phoenix event display

* [Introduction](#introduction)
* [Modularity and architectural overview](#modularity-and-architectural-overview)
* [`ThreeManager`](#threemanager)
* [`UIManager`](#uimanager)
  * [`PhoenixUI`](#phoenixui)
  * [`PhoenixMenuNode`](#phoenixmenunode)
* [Miscellaneous managers](#miscellaneous-managers)
* [Event data loaders](#event-data-loaders)

## Introduction

The [`EventDisplay`](../../packages/phoenix-event-display/src/event-display.ts) class is the primary building block of Phoenix. As in the [Phoenix architecture](./#phoenix-architecture), it interconnects the [`ThreeManager`](#threemanager), [`UIManager`](#uimanager) and [`EventDataLoader`](#event-data-loaders). It works as the primary endpoint for accessing all Phoenix functions.

See the [API docs for `EventDisplay`](https://hepsoftwarefoundation.org/phoenix/api-docs/classes/EventDisplay.html) to have a deeper look at the available functions.

## Modularity and architectural overview

As specified in the [Phoenix architecture](./#phoenix-architecture), the `EventDisplay` depends on some underlying managers to perform operations. Almost none of the functions of the `EventDisplay` are implemented directly in the `EventDisplay`. Instead the `EventDisplay` works as an intermediate interface that uses different managers and services to perform the relevant operations and interconnects them.\
This architectural approach helps in maintaining the modularity of Phoenix and makes it easier to add new functionality in isolation if needed.

The modular and extendable nature of Phoenix is not limited to just the `EventDisplay`. The managers are also further divided into sub managers each of which is responsible for handling and maintaining different aspects and features.

## [`ThreeManager`](../../packages/phoenix-event-display/src/managers/three-manager/index.ts)

The `ThreeManager` is responsible for performing all `three.js` related functions. Any feature that depends on the `three.js` library is implemented through the `ThreeManager`. Since Phoenix has a lot of features implemented through `three.js`, the `ThreeManager` is further divided into sub managers which have different roles.

Here is a list of sub managers of `ThreeManager`:

* [**`AnimationsManager`**](../../packages/phoenix-event-display/src/managers/three-manager/animations-manager.ts)  
  Responsible for animation related operations. For example, animating the camera through the event.
* [**`ColorManager`**](../../packages/phoenix-event-display/src/managers/three-manager/color-manager.ts)  
  Provides functionality for managing coloring of objects in the scene.
* [**`ControlsManager`**](../../packages/phoenix-event-display/src/managers/three-manager/controls-manager.ts)  
  Manages all controls related functionality which includes the camera, orbit controls and zoom controls.
* [**`EffectsManager`**](../../packages/phoenix-event-display/src/managers/three-manager/effects-manager.ts)  
  Used for managing event display effects like the outline pass for selected object.
* [**`ExportManager`**](../../packages/phoenix-event-display/src/managers/three-manager/export-manager.ts)  
  Manages export related functions like exporting the event display to an `.obj` file or to the `.phnx` (Phoenix scene) file.
* [**`ImportManager`**](../../packages/phoenix-event-display/src/managers/three-manager/import-manager.ts)  
  Manages import related functions like importing different types of 3D geometries (`.gltf`, `.root`, `.obj`, etc.) or event data (`.json`, `.xml`, etc.).
* [**`RendererManager`**](../../packages/phoenix-event-display/src/managers/three-manager/renderer-manager.ts)  
  Manages `three.js` renderers used by Phoenix including both the main and overlay renderer (used in the overlay view).
* [**`SceneManager`**](../../packages/phoenix-event-display/src/managers/three-manager/scene-manager.ts)  
  Used to manage `three.js` scene related operations like traversing through the scene, applying color or opacity to 3D objects, managing scene lights, etc.
* [**`SelectionManager`**](../../packages/phoenix-event-display/src/managers/three-manager/selection-manager.ts)  
  Manages selection functionality of the event display like applying outline pass to a selected object or getting selected object info for the object selection overlay.
* [**`XRManager`**](../../packages/phoenix-event-display/src/managers/three-manager/xr/xr-manager.ts)  
  Provides common functionality of AR/VR like setting up the session and XR camera.
  * [**`ARManager`**](../../packages/phoenix-event-display/src/managers/three-manager/xr/ar-manager.ts)  
    Extended from `XRManager`. Used to manage AR related functions like starting an AR session and showing overlay in AR mode.
  * [**`VRManager`**](../../packages/phoenix-event-display/src/managers/three-manager/xr/vr-manager.ts)  
    Extended from `XRManager`. Used to manage VR related functions like setting up VR controls and movement.

Currently the sub managers are not big enough to be divided into multiple parts. However, if at some point their code gets large, it should be further divided.

## [`UIManager`](../../packages/phoenix-event-display/src/managers/ui-manager/index.ts)

The `UIManager` is responsible for all the UI aspects of the `EventDisplay`. This includes the Phoenix menu, dat.GUI menu, stats UI, etc.

It takes care of tasks like:

* Adding configuration options to Phoenix UI on loading geometry or event data.
* Setting the UI color theme to dark or light.
* Applying clipping to geometries.
* Linking UI menu options with the `EventDisplay`.
* Configuring different color options for event data.
* etc.

It also has [**`ColorOptions`**](../../packages/phoenix-event-display/src/managers/ui-manager/color-options.ts) which contains logic to color event data.

### [`PhoenixUI`](../../packages/phoenix-event-display/src/managers/ui-manager/phoenix-ui.ts)  

`PhoenixUI` is used as a common interface for implementing UI menus in Phoenix. It currently has the following implementations:

* [**`DatGUIMenuUI`**](../../packages/phoenix-event-display/src/managers/ui-manager/dat-gui-ui.ts)
  Contains functions for setting up all the options in dat.GUI menu.
* [**`PhoenixMenuUI`**](../../packages/phoenix-event-display/src/managers/ui-manager/phoenix-menu/phoenix-menu-ui.ts)  
  Contains functions for setting up all the options in Phoenix menu.

### [`PhoenixMenuNode`](../../packages/phoenix-event-display/src/managers/ui-manager/phoenix-menu/phoenix-menu-node.ts)

The `PhoenixMenuNode` is a class that maintains all the options of Phoenix menu at the program level. It doesn't implement the UI for Phoenix menu but contains all the logic.\
It is designed to be adaptable to custom UIs. This class can be used to create a custom Phoenix menu like interface in any kind of frontend framework.

For an overview, it contains functions for:

* Adding children (of the same `PhoenixMenuNode` type) to a node.
* Adding custom configuration of different types (like `checkbox`, `slider`, `button`, `label`, etc.) to a node.
* Getting and loading the state of a node.
* Removing a single child node, current node, or all child nodes.  
* Finding a node in tree by name, or create one if not found.
* etc.  

## Miscellaneous managers

These are some independent managers not part of the `ThreeManager` or `UIManager` but used inside the `EventDisplay`.

* [**`LoadingManager`**](../../packages/phoenix-event-display/src/managers/loading-manager.ts)  
  Maintains a list of loadable items with addable callbacks that are called when the loading of an item completes.
* [**`StateManager`**](../../packages/phoenix-event-display/src/managers/state-manager.ts)  
  Manages the state of the `EventDisplay` including the Phoenix menu state, camera state and clipping state. The state can be saved to a file and loaded later.
* [**`URLOptionsManager`**](../../packages/phoenix-event-display/src/managers/url-options-manager.ts)  
  Manages `EventDisplay` options available through the URL like loading an event through the URL (`file` & `type`) or hiding overlay widgets (`hideWidgets`).

## Event data loaders

See [Event data loader](./event-data-loader.md) for details.
