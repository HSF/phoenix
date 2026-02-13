# Track Extension to Radius

## Overview

Phoenix supports optionally extending tracks with measured hits out to a specified transverse radius using Runge-Kutta propagation. This feature addresses issue #177 and allows tracks that already have measurements (e.g., `CombinedInDetTracks`) to be extended so they reach the calorimeter region, similar to tracks without measurements that are automatically propagated.

## User Interface

The extension feature is available on a **per-collection basis** through both the dat.GUI menu and Phoenix menu.

### dat.GUI

For each track collection, you'll find:
- **Extend to radius** (checkbox): Toggle to enable/disable track extension
- **Radius** (slider, 100-5000 mm): Set the target transverse radius

### Phoenix Menu

Under each track collection's "Draw Options":
- **Extend to radius** (checkbox): Toggle extension on/off
- **Extend radius** (slider, 100-5000 mm): Configure target radius

Changes take effect immediately — toggling or adjusting the radius rebuilds the track geometries in the scene.

## Implementation Details

### RKHelper

A new method `RKHelper.extrapolateFromLastPosition(track, radius)` extrapolates from the last measured hit outward until the track reaches the specified transverse radius (or propagation limits are hit).

**Parameters:**
- `track`: Track object with `pos` (measured hits) and `dparams` (track parameters)
- `radius`: Target transverse radius in mm

**Returns:** Array of additional position points `[x, y, z][]` (does not include the last measured point)

### SceneManager

The `SceneManager.extendCollectionTracks(collectionName, radius, enable)` method applies extension to all tracks in a collection:

1. Retrieves the collection group from EventData
2. For each track:
   - Calls `RKHelper.extrapolateFromLastPosition` if enabled
   - Rebuilds the tube and line geometries using measured + extrapolated points
   - Persists extension state in `userData`:
     - `extendedToRadius`: boolean (enabled/disabled)
     - `extendRadius`: number (radius in mm)
     - `extendedPos`: number[][] (array of extrapolated points)

**Note:** The original `track.pos` array is never modified — extrapolated points are stored separately.

### Performance Considerations

For collections with thousands of tracks:
- **Throttling**: Consider debouncing UI slider changes (e.g., only apply on `onFinishChange`)
- **Worker threads**: For very large datasets, compute extrapolation in a Web Worker to avoid blocking the main thread
- **Current implementation**: Uses synchronous RK propagation; suitable for typical event sizes (< 1000 tracks per collection)

## Example Usage

```typescript
// Enable extension for "CombinedInDetTracks" collection to 1500 mm radius
sceneManager.extendCollectionTracks('CombinedInDetTracks', 1500, true);

// Disable extension (revert to measured-only)
sceneManager.extendCollectionTracks('CombinedInDetTracks', 1500, false);

// Access extension state
const trackGroup = collection.children[0];
const params = trackGroup.userData;
if (params.extendedToRadius) {
  console.log(`Extended to ${params.extendRadius} mm`);
  console.log(`Extrapolated points:`, params.extendedPos);
}
```

## Testing

Unit test for `RKHelper.extrapolateFromLastPosition`:
- `packages/phoenix-event-display/src/tests/helpers/rk-helper.test.ts`

Integration test for `SceneManager.extendCollectionTracks`:
- `packages/phoenix-event-display/src/tests/managers/three-manager/scene-manager.test.ts`

## Related Files

- `packages/phoenix-event-display/src/helpers/rk-helper.ts`
- `packages/phoenix-event-display/src/managers/three-manager/scene-manager.ts`
- `packages/phoenix-event-display/src/managers/ui-manager/dat-gui-ui.ts`
- `packages/phoenix-event-display/src/managers/ui-manager/phoenix-menu/phoenix-menu-ui.ts`

## See Also

- [Event display guide](./event-display.md)
- [Event data format](./event_data_format.md)
- Issue #177: "Optionally extend all tracks to a radius"
