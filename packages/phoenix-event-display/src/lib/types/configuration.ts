import { PresetView } from '../models/preset-view.model';
import { EventDataLoader } from '../../loaders/event-data-loader';
import { PhoenixMenuNode } from '../../managers/ui-manager/phoenix-menu/phoenix-menu-node';

/**
 * Configuration of the event display.
 */
export interface Configuration {
  /** Default view [x,y,z]. */
  defaultView?: number[];
  /** Preset views for switching event display camera. */
  presetViews?: PresetView[];
  /** Event data loader responsible for processing and loading event data. */
  eventDataLoader?: EventDataLoader;
  /** Root node of the phoenix menu. */
  phoenixMenuRoot?: PhoenixMenuNode;
  /** Whether to enable dat.GUI menu or not. */
  enableDatGUIMenu?: boolean;
  /** ID of the wrapper element. */
  elementId?: string;
  /** Default event to load when none given in URL. */
  defaultEventFile?: { eventFile: string; eventType: string };
  /** Whether to allow URL options or not (true by default). */
  allowUrlOptions?: boolean;
}
