import { LoadingManager } from 'three';
import { EventDisplay } from './event-display.js';
import { Cut } from './lib/models/cut.model.js';
import { PresetView } from './lib/models/preset-view.model.js';
import { PrettySymbols } from './helpers/pretty-symbols.js';
import { RKHelper } from './helpers/rk-helper.js';
import { RungeKutta } from './helpers/runge-kutta.js';
import { InfoLogger } from './helpers/info-logger.js';
import { CMSLoader } from './loaders/cms-loader.js';
import { JiveXMLLoader } from './loaders/jivexml-loader.js';
import { JSRootEventLoader } from './loaders/jsroot-event-loader.js';
import { CMSObjects } from './loaders/objects/cms-objects.js';
import { PhoenixObjects } from './loaders/objects/phoenix-objects.js';
import { PhoenixLoader } from './loaders/phoenix-loader.js';
import { Edm4hepJsonLoader } from './loaders/edm4hep-json-loader.js';
import { ScriptLoader } from './loaders/script-loader.js';
import { TrackmlLoader } from './loaders/trackml-loader.js';
import { StateManager } from './managers/state-manager.js';
import { URLOptionsManager } from './managers/url-options-manager.js';
import { ThreeManager } from './managers/three-manager/index.js';
import { UIManager } from './managers/ui-manager/index.js';
import { PhoenixMenuNode } from './managers/ui-manager/phoenix-menu/phoenix-menu-node.js';

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
