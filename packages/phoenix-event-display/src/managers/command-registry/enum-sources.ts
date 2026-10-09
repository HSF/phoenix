import type { CommandProperty } from './command.model';

/** Name of a live source a command parameter draws its allowed values from. */
export type EnumSourceName = NonNullable<CommandProperty['enumSource']>;

/** Live values for every enum source: unique, non-empty strings (possibly none). */
export type ResolvedEnumSources = Record<EnumSourceName, string[]>;

/**
 * The slice of the event display the enum sources are read from. Every member
 * is optional so a partial host (a test double, a display that is still
 * booting) is accepted; a missing member simply yields no values.
 */
export interface EnumSourceHost {
  /**
   * Collection names grouped by event-data type, as `EventDisplay.getCollections`.
   * @returns Real collection names (the values) keyed by type (the keys).
   */
  getCollections?(): { [type: string]: string[] } | undefined;
  /**
   * The UI manager, whose preset views name the camera presets.
   * @returns The UI manager, if any.
   */
  getUIManager?(): { getPresetViews?(): { name?: string }[] } | undefined;
  /**
   * All loaded events.
   * @returns The events keyed by event key, if any are loaded.
   */
  getEventsData?(): object | undefined;
  /**
   * Names of the detector-geometry parts currently in the scene.
   * @returns The part names.
   */
  getGeometryPartNames?(): string[];
}

/**
 * Resolve the live allowed values for every `enumSource` command parameter.
 *
 * - `collections`: the collection NAMES, `Object.values(getCollections()).flat()`.
 *   The keys of `getCollections()` are event-data types ("Tracks"), which
 *   `getCollection(name)` cannot resolve; advertising them was a real bug.
 * - `presetViews`: `getUIManager().getPresetViews()` names.
 * - `eventKeys`: the keys of `getEventsData()`.
 * - `geometryParts`: `getGeometryPartNames()`.
 *
 * Never throws: the scene, configuration or UI may not exist yet, and each
 * source is read independently so one failure leaves the others intact. The
 * lists are de-duplicated and stripped of non-strings, so each is usable as a
 * JSON Schema `enum` as it stands.
 * @param host The event display (or any partial host).
 * @returns All four sources, each an array (empty when unavailable).
 */
export function resolveEnumSources(
  host: EnumSourceHost | null | undefined,
): ResolvedEnumSources {
  return {
    collections: readValues(() =>
      Object.values(host?.getCollections?.() ?? {}).flat(),
    ),
    presetViews: readValues(() =>
      (host?.getUIManager?.()?.getPresetViews?.() ?? []).map(
        (view) => view?.name,
      ),
    ),
    eventKeys: readValues(() => Object.keys(host?.getEventsData?.() ?? {})),
    geometryParts: readValues(() => host?.getGeometryPartNames?.() ?? []),
  };
}

/**
 * Run one source read and keep its unique, non-empty string values.
 * @param read Reads the raw values; may throw.
 * @returns The cleaned values, or an empty list if the read failed.
 */
function readValues(read: () => unknown): string[] {
  try {
    const values = read();
    if (!Array.isArray(values)) return [];
    return [
      ...new Set(
        values.filter((v): v is string => typeof v === 'string' && v !== ''),
      ),
    ];
  } catch {
    return [];
  }
}
