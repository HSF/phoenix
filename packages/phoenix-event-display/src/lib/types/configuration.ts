import { PresetView } from '../models/preset-view.model.js';
import { EventDataLoader } from '../../loaders/event-data-loader.js';
import { PhoenixMenuNode } from '../../managers/ui-manager/phoenix-menu/phoenix-menu-node.js';
import { AnimationPreset } from '../../managers/three-manager/animations-manager.js';
import { DepthPackingStrategies } from 'three';

/**
 * Configuration of the event display.
 */
export interface Configuration {
  /** Default view [x,y,z]. */
  defaultView?: number[];
  /** Preset views for switching event display camera. */
  presetViews?: PresetView[];
  /** Preset animations for switching event display camera. */
  presetAnimations?: AnimationPreset[];
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
  /** Whether to force a theme ('dark' or 'light' are current options) */
  forceColourTheme?: string;
}
