import { LoadingManager } from 'three';
import { EventDisplay } from '../dist/event-display.js';
import { Cut } from '../dist/lib/models/cut.model.js';
import { PresetView } from '../dist/lib/models/preset-view.model.js';
import { PrettySymbols } from '../dist/helpers/pretty-symbols.js';
import { RKHelper } from '../dist/helpers/rk-helper.js';
import { RungeKutta } from '../dist/helpers/runge-kutta.js';
import { InfoLogger } from '../dist/helpers/info-logger.js';
import { CMSLoader } from '../dist/loaders/cms-loader.js';
import { JiveXMLLoader } from '../dist/loaders/jivexml-loader.js';
import { JSRootEventLoader } from '../dist/loaders/jsroot-event-loader.js';
import { CMSObjects } from '../dist/loaders/objects/cms-objects.js';
import { PhoenixObjects } from '../dist/loaders/objects/phoenix-objects.js';
import { PhoenixLoader } from '../dist/loaders/phoenix-loader.js';
import { Edm4hepJsonLoader } from '../dist/loaders/edm4hep-json-loader.js';
import { ScriptLoader } from '../dist/loaders/script-loader.js';
import { TrackmlLoader } from '../dist/loaders/trackml-loader.js';
import { StateManager } from '../dist/managers/state-manager.js';
import { URLOptionsManager } from '../dist/managers/url-options-manager.js';
import { ThreeManager } from '../dist/managers/three-manager/index.js';
import { UIManager } from '../dist/managers/ui-manager/index.js';
import { PhoenixMenuNode } from '../dist/managers/ui-manager/phoenix-menu/phoenix-menu-node.js';

if (typeof globalThis !== 'undefined') {
  // `globalThis` makes Phoenix modules available in the browser
  // e.g. `const eventDisplay = new EventDisplay();`
  Object.assign(globalThis, {
    // Event display
    EventDisplay,
    // Misc
    InfoLogger,
    // Three
    ThreeManager,
    // UI
    UIManager,
    PhoenixMenuNode,
    // Extras
    Cut,
    PresetView,
    // Helpers
    RKHelper,
    RungeKutta,
    PrettySymbols,
    // Loaders
    CMSLoader,
    JiveXMLLoader,
    JSRootEventLoader,
    PhoenixLoader,
    Edm4hepJsonLoader,
    ScriptLoader,
    TrackmlLoader,
    // Physics objects
    CMSObjects,
    PhoenixObjects,
    // Managers
    StateManager,
    LoadingManager,
    URLOptionsManager,
  });
}
