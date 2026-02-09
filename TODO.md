# Angular 20 Test Migration Plan

## Overview
Migrate failing UI component tests from using heavy `PhoenixUIModule` to lightweight `TestModule` to resolve Angular 20 compatibility issues.

## Created Files
- [x] `packages/phoenix-ng/projects/phoenix-ui-components/lib/components/testing/test.module.ts` - Lightweight test module

## Updated Files
- [x] `packages/phoenix-ng/projects/phoenix-ui-components/lib/components/ui-menu/ui-menu.component.test.ts`

## Remaining Files to Update (68 total)
Update each test file to:
1. Replace `import { PhoenixUIModule } from '../phoenix-ui.module';` with `import { TestModule } from '../testing/test.module';`
2. Add `import { NO_ERRORS_SCHEMA } from '@angular/core';` if not present
3. Replace `imports: [PhoenixUIModule],` with `imports: [TestModule],`
4. Add `schemas: [NO_ERRORS_SCHEMA],` to TestBed configuration
5. Remove any redundant imports

### UI Menu Components (packages/phoenix-ng/projects/phoenix-ui-components/lib/components/ui-menu/)
- [ ] performance-toggle/performance-toggle.component.test.ts
- [ ] zoom-controls/zoom-controls.component.test.ts
- [ ] vr-toggle/vr-toggle.component.test.ts
- [ ] view-options/view-options.component.test.ts
- [ ] view-options/cartesian-grid-config/cartesian-grid-config.component.test.ts
- [ ] tree-menu/tree-menu-item/tree-menu-item.component.test.ts
- [ ] info-panel/info-panel.component.test.ts
- [ ] share-link/share-link-dialog/share-link-dialog.component.test.ts
- [ ] overlay-view/overlay-view.component.test.ts
- [ ] overlay/overlay.component.test.ts
- [ ] overlay-view/overlay-view-window/overlay-view-window.component.test.ts
- [ ] info-panel/info-panel-overlay/info-panel-overlay.component.test.ts
- [ ] object-selection/object-selection.component.test.ts
- [ ] object-selection/object-selection-overlay/object-selection-overlay.component.test.ts
- [ ] object-clipping/object-clipping.component.test.ts
- [ ] main-view-toggle/main-view-toggle.component.test.ts
- [ ] io-options/io-options.component.test.ts
- [ ] make-picture/make-picture.component.test.ts
- [ ] io-options/io-options-dialog/io-options-dialog.component.test.ts
- [ ] cycle-events/cycle-events.component.test.ts
- [ ] experiment-info/experiment-info.component.test.ts
- [ ] geometry-browser/geometry-browser-overlay/geometry-browser-overlay.component.test.ts
- [ ] event-selector/event-selector.component.test.ts
- [ ] geometry-browser/geometry-browser.component.test.ts

### Embed Menu Components (packages/phoenix-ng/projects/phoenix-ui-components/lib/components/embed-menu/)
- [ ] experiment-link/experiment-link.component.test.ts

### Phoenix Menu Components (packages/phoenix-ng/projects/phoenix-ui-components/lib/components/phoenix-menu/)
- [ ] phoenix-menu.component.test.ts

### App Components (packages/phoenix-ng/projects/phoenix-app/src/app/)
- [ ] home/home.component.test.ts
- [ ] sections/playground/playground.component.test.ts
- [ ] sections/trackml/trackml.component.test.ts

## Testing
After updates, run tests to verify:
- No more `TypeError: Cannot read properties of undefined (reading 'ngModule')`
- No more `NullInjectorError: No provider for _CdkPrivateStyleLoader!`
- All tests pass successfully

## Notes
- Use `NO_ERRORS_SCHEMA` to avoid template compilation issues for complex components
- The `TestModule` includes all necessary Angular Material and CDK modules
- Keep mocks for services like `EventDisplayService` as needed
