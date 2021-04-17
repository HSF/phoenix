import { LoadingManager } from 'three';
import { EventDisplay } from './event-display';
import { Cut } from './extras/cut.model';
import { PresetView } from './extras/preset-view.model';
import { PrettySymbols } from './helpers/pretty-symbols';
import { RKHelper } from './helpers/rk-helper';
import { RungeKutta } from './helpers/runge-kutta';
import { InfoLogger } from './helpers/info-logger';
import { CMSLoader } from './loaders/cms-loader';
import { JiveXMLLoader } from './loaders/jivexml-loader';
import { JSRootEventLoader } from './loaders/jsroot-event-loader';
import { LHCbLoader } from './loaders/lhcb-loader';
import { CMSObjects } from './loaders/objects/cms-objects';
import { PhoenixObjects } from './loaders/objects/phoenix-objects';
import { PhoenixLoader } from './loaders/phoenix-loader';
import { ScriptLoader } from './loaders/script-loader';
import { TrackmlLoader } from './loaders/trackml-loader';
import { StateManager } from './managers/state-manager';
import { URLOptionsManager } from './managers/url-options-manager';
import { ThreeManager } from './managers/three-manager';
import { UIManager } from './managers/ui-manager';
import { PhoenixMenuNode } from './managers/ui-manager/phoenix-menu/phoenix-menu-node';

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
    LHCbLoader,
    PhoenixLoader,
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
