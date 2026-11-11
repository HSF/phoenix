# Track Line Width

## Overview

The thickness of a track can be set in the event data with the optional `linewidth` attribute of the track (see the [event data format](./event_data_format.md)). The default is 2. This is useful to make some tracks, for example muons, stand out.

The thickness of all the tracks in a collection can also be changed after the event is loaded, from the menu.

## User Interface

The option is available on a **per-collection basis** for track collections, through both the dat.GUI menu and the Phoenix menu.

### dat.GUI

For each track collection, you'll find:
- **Line width scale** (slider, 0.1-10)

### Phoenix Menu

Under each track collection's "Draw Options":
- **Line width scale** (slider, 0.1-10, with an input for a custom value)

The scale is a factor applied on top of the `linewidth` of each track, so a scale of 2 makes every track in the collection twice as thick as it is in the event data, and a scale of 1 (the default) restores the original widths. Tracks that were given a larger `linewidth` stay proportionally thicker than the others.

Changes take effect immediately: the track geometries of the collection are rebuilt in the scene.

## Implementation Details

`SceneManager.setCollectionLineWidthScale(collectionName, scale)` (also exposed by `ThreeManager`) rebuilds the tube geometry of each track in the collection with a radius of `linewidth * scale`, reusing the path of the existing tube. The scale is stored as `lineWidthScale` in the `userData` of each track group, so it is also applied when the tracks are rebuilt, for example when they are [extended to a radius](./track-extension.md).

```typescript
// Make all the tracks of the "Muons" collection three times as thick
sceneManager.setCollectionLineWidthScale('Muons', 3);

// Go back to the widths from the event data
sceneManager.setCollectionLineWidthScale('Muons', 1);
```

## Testing

Integration tests for `SceneManager.setCollectionLineWidthScale`:
- `packages/phoenix-event-display/src/tests/managers/three-manager/scene-manager.test.ts`

## Related Files

- `packages/phoenix-event-display/src/managers/three-manager/scene-manager.ts`
- `packages/phoenix-event-display/src/managers/ui-manager/dat-gui-ui.ts`
- `packages/phoenix-event-display/src/managers/ui-manager/phoenix-menu/phoenix-menu-ui.ts`
