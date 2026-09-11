import type {
  PhoenixEventsData,
  PhoenixEventData,
  MissingEnergyParams,
} from '../lib/types/event-data';

/** Summary of a single event for browsing/filtering. */
export interface EventSummary {
  /** The key used to look up this event in PhoenixEventsData. */
  eventKey: string;
  /** Event number from metadata (if available). */
  eventNumber: string | number | undefined;
  /** Run number from metadata (if available). */
  runNumber: string | number | undefined;
  /** Total number of physics objects across all collections. */
  totalObjects: number;
  /** Count of objects per collection type (e.g. "Tracks": 42, "Jets": 5). */
  collectionCounts: { [typeName: string]: number };
  /** Missing transverse energy magnitude in MeV (NaN if no MET collection). */
  met: number;
}

/** Known collection types that hold arrays of physics objects. */
const OBJECT_COLLECTION_TYPES = [
  'Tracks',
  'Jets',
  'Hits',
  'CaloClusters',
  'CaloCells',
  'Muons',
  'Photons',
  'Electrons',
  'Vertices',
  'MissingEnergy',
  'PlanarCaloCells',
  'IrregularCaloCells',
] as const;

/**
 * Count all physics objects in a single event.
 * Each collection type (Tracks, Jets, etc.) can have multiple named sub-collections.
 */
function countCollections(eventData: PhoenixEventData): {
  counts: { [typeName: string]: number };
  total: number;
} {
  const counts: { [typeName: string]: number } = {};
  let total = 0;

  for (const typeName of OBJECT_COLLECTION_TYPES) {
    const typeData = eventData[typeName];
    if (!typeData || typeof typeData !== 'object') continue;

    let typeCount = 0;

    if (typeName === 'PlanarCaloCells') {
      // PlanarCaloCells has a special structure: { collName: { plane: [...], cells: [...] } }
      for (const collName of Object.keys(typeData)) {
        const coll = (typeData as any)[collName];
        if (coll?.cells && Array.isArray(coll.cells)) {
          typeCount += coll.cells.length;
        }
      }
    } else {
      // Standard structure: { collName: objectArray }
      for (const collName of Object.keys(typeData)) {
        const coll = (typeData as any)[collName];
        if (Array.isArray(coll)) {
          typeCount += coll.length;
        }
      }
    }

    if (typeCount > 0) {
      counts[typeName] = typeCount;
      total += typeCount;
    }
  }

  return { counts, total };
}

/**
 * Compute missing transverse energy magnitude from MET collections.
 * Returns NaN if no MET data is present.
 */
function computeMET(eventData: PhoenixEventData): number {
  const metCollections = eventData.MissingEnergy;
  if (!metCollections || typeof metCollections !== 'object') return NaN;

  // Use the first MET collection found, take its first entry
  for (const collName of Object.keys(metCollections)) {
    const metArray = metCollections[collName];
    if (Array.isArray(metArray) && metArray.length > 0) {
      const met = metArray[0] as MissingEnergyParams;
      if (met.etx !== undefined && met.ety !== undefined) {
        return Math.sqrt(met.etx * met.etx + met.ety * met.ety);
      }
    }
  }

  return NaN;
}

/**
 * Build a summary for a single event.
 */
export function summarizeEvent(
  eventKey: string,
  eventData: PhoenixEventData,
): EventSummary {
  const { counts, total } = countCollections(eventData);
  const met = computeMET(eventData);

  return {
    eventKey,
    eventNumber:
      eventData['event number'] ?? eventData.eventNumber ?? undefined,
    runNumber: eventData['run number'] ?? eventData.runNumber ?? undefined,
    totalObjects: total,
    collectionCounts: counts,
    met,
  };
}

/**
 * Pre-scan all events and build a summary index.
 * This is the main entry point for the event browser.
 */
export function buildEventSummaries(
  eventsData: PhoenixEventsData,
): EventSummary[] {
  const summaries: EventSummary[] = [];

  for (const eventKey of Object.keys(eventsData)) {
    const eventData = eventsData[eventKey];
    if (eventData && typeof eventData === 'object') {
      summaries.push(summarizeEvent(eventKey, eventData));
    }
  }

  return summaries;
}

/** Detector-level types that are fixed per detector, not per event. */
const DETECTOR_LEVEL_TYPES = new Set([
  'CaloCells',
  'Hits',
  'PlanarCaloCells',
  'IrregularCaloCells',
]);

/**
 * Get all unique collection type names across all events.
 * Reconstructed physics objects are listed first, detector-level types last.
 */
export function getAvailableColumns(summaries: EventSummary[]): string[] {
  const columnSet = new Set<string>();
  for (const summary of summaries) {
    for (const typeName of Object.keys(summary.collectionCounts)) {
      columnSet.add(typeName);
    }
  }
  const reco: string[] = [];
  const detector: string[] = [];
  for (const col of Array.from(columnSet).sort()) {
    if (DETECTOR_LEVEL_TYPES.has(col)) {
      detector.push(col);
    } else {
      reco.push(col);
    }
  }
  return [...reco, ...detector];
}
