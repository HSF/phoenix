import type { Command, CommandParamSchema } from './command.model';
import type { CommandRegistry } from './command-registry';

/** No-argument object schema shared by parameterless commands. */
const NO_ARGS: CommandParamSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

/** A collection-name + row-index schema for object-addressed commands. */
const OBJECT_REF: CommandParamSchema = {
  type: 'object',
  properties: {
    collection: {
      type: 'string',
      description: 'Collection name',
      enumSource: 'collections',
    },
    index: {
      type: 'integer',
      description: 'Row index within the collection',
      minimum: 0,
    },
  },
  required: ['collection', 'index'],
  additionalProperties: false,
};

/**
 * Build the generic, experiment-agnostic v1 command set. Every command wraps
 * an existing deterministic Phoenix method; object args use (collection,index)
 * and mutating view state goes through UIManager to stay state-synced.
 * @returns The default commands.
 */
export function defaultCommands(): Command[] {
  return [
    {
      name: 'next-event',
      title: 'Next event',
      description: 'Load the next event in the dataset.',
      category: 'Navigation',
      inputSchema: { ...NO_ARGS },
      mutates: true,
      run: (_a, h) => h.eventDisplay.nextEvent(),
    },
    {
      name: 'previous-event',
      title: 'Previous event',
      description: 'Load the previous event in the dataset.',
      category: 'Navigation',
      inputSchema: { ...NO_ARGS },
      mutates: true,
      run: (_a, h) => h.eventDisplay.previousEvent(),
    },
    {
      name: 'load-event',
      title: 'Load event',
      description: 'Load a specific event by its key.',
      category: 'Navigation',
      inputSchema: {
        type: 'object',
        properties: {
          eventKey: {
            type: 'string',
            description: 'Event key',
            enumSource: 'eventKeys',
          },
        },
        required: ['eventKey'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => {
        // EventDisplay.loadEvent silently ignores a key it does not hold, so an
        // unknown key used to report success and change nothing, which an
        // agent that cannot see the display takes as done. Refuse instead, and
        // name a few real keys so the caller can correct itself. A host that
        // cannot list its events is left permissive, as with geometry parts.
        const getEventsData = h.eventDisplay?.getEventsData;
        if (typeof getEventsData === 'function') {
          const keys = Object.keys(getEventsData.call(h.eventDisplay) ?? {});
          if (!keys.includes(a.eventKey)) {
            const asked = String(a.eventKey).slice(0, 80);
            if (!keys.length) {
              throw new Error(`no event '${asked}': no events are loaded`);
            }
            const more =
              keys.length > 10 ? ` and ${keys.length - 10} more` : '';
            throw new Error(
              `no event '${asked}' is loaded. Available: ${keys.slice(0, 10).join(', ')}${more}`,
            );
          }
        }
        return h.eventDisplay.loadEvent(a.eventKey);
      },
    },

    {
      name: 'set-theme',
      title: 'Set theme',
      description: 'Switch between dark and light theme.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {
          dark: { type: 'boolean', description: 'True for dark theme' },
        },
        required: ['dark'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => h.ui.setDarkTheme(a.dark),
    },
    {
      name: 'preset-view',
      title: 'Preset view',
      description: 'Snap the camera to a named preset view.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {
          view: {
            type: 'string',
            description: 'Preset view name',
            enumSource: 'presetViews',
          },
        },
        required: ['view'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => {
        const match = (h.ui.getPresetViews?.() ?? []).find(
          (v: any) => v.name === a.view,
        );
        if (!match) throw new Error(`unknown view '${a.view}'`);
        // Settle the camera first: a named view is only useful if auto-rotate
        // is not still spinning the camera past it. Done only once the view is
        // known valid, so a failed command never changes rotation state.
        h.ui.setAutoRotate(false);
        h.ui.displayView(match);
      },
    },
    {
      name: 'zoom',
      title: 'Zoom',
      description: 'Zoom the camera in or out.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            enum: ['in', 'out'],
            description: 'Zoom direction',
          },
        },
        required: ['direction'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) =>
        h.eventDisplay.zoomTo(a.direction === 'in' ? 1 / 1.2 : 1.2, 100),
    },
    {
      name: 'toggle-auto-rotate',
      title: 'Auto-rotate',
      description: 'Turn camera auto-rotation on or off.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: { on: { type: 'boolean' } },
        required: ['on'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => h.ui.setAutoRotate(a.on),
    },
    {
      name: 'set-clipping',
      title: 'Clipping',
      description: 'Enable or disable the geometry clipping planes.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: { on: { type: 'boolean' } },
        required: ['on'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => h.ui.setClipping(a.on),
    },
    {
      name: 'show-axis',
      title: 'Show axis',
      description: 'Show or hide the XYZ axis helper.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: { show: { type: 'boolean' } },
        required: ['show'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => h.ui.setShowAxis(a.show),
    },
    {
      name: 'toggle-camera-projection',
      title: 'Camera projection',
      description:
        'Switch the main camera between perspective and orthographic. Pass orthographic to ask for one in particular, or omit it to flip.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {
          orthographic: {
            type: 'boolean',
            description:
              'True for orthographic, false for perspective. Omit to flip whichever is current.',
          },
        },
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => {
        // With a target stated, this is idempotent: already being in the asked
        // state is success, not a reason to flip out of it. A plain toggle
        // meant that repeating a request undid it, which is wrong for a spoken
        // instruction and worse for an agent retrying a tools/call.
        if (typeof a.orthographic === 'boolean') {
          if (h.three.isMainCameraOrthographic() === a.orthographic) {
            return a.orthographic;
          }
        }
        return h.three.revertMainCamera();
      },
    },

    {
      name: 'set-geometry-visibility',
      title: 'Show/hide geometry',
      description: 'Show or hide a named detector geometry part.',
      category: 'Geometry',
      inputSchema: {
        type: 'object',
        properties: {
          part: {
            type: 'string',
            description: 'Geometry part name',
            enumSource: 'geometryParts',
          },
          visible: { type: 'boolean' },
        },
        required: ['part', 'visible'],
        additionalProperties: false,
      },
      mutates: true,
      run: (a, h) => {
        // Reporting success for a part that is not in the scene is the worst
        // outcome for a caller that cannot see the result: an agent, or a
        // student who was told it worked. Refuse, and name what would have
        // been accepted so the caller can correct itself.
        const parts = h.listGeometryParts?.() ?? [];
        let part = a.part;
        if (parts.length) {
          const match = parts.find(
            (p) => p.toLowerCase() === String(part).toLowerCase(),
          );
          if (!match) {
            throw new Error(
              `no geometry part named '${part}'. Available: ${parts.join(', ')}`,
            );
          }
          // Use the scene's own spelling, since the request may be spoken.
          part = match;
        }
        return h.ui.geometryVisibility(part, a.visible);
      },
    },

    {
      name: 'highlight-object',
      title: 'Highlight object',
      description: 'Outline an object selected by collection and row index.',
      category: 'Selection',
      inputSchema: { ...OBJECT_REF },
      mutates: true,
      run: (a, h) => {
        const obj = h.resolveObject(a.collection, a.index);
        if (!obj) throw new Error(`no object at ${a.collection}[${a.index}]`);
        h.eventDisplay.highlightObject(obj.uuid);
      },
    },
    {
      name: 'look-at-object',
      title: 'Look at object',
      description:
        'Move the camera to an object selected by collection and row index.',
      category: 'Selection',
      inputSchema: { ...OBJECT_REF },
      mutates: true,
      run: (a, h) => {
        const obj = h.resolveObject(a.collection, a.index);
        if (!obj) throw new Error(`no object at ${a.collection}[${a.index}]`);
        // Stop auto-rotate so the focused object stays framed instead of the
        // camera orbiting away from it. Only after the object is resolved, so a
        // failed lookup leaves rotation untouched.
        h.ui.setAutoRotate(false);
        h.eventDisplay.lookAtObject(obj.uuid);
      },
    },

    {
      name: 'list-collections',
      title: 'List collections',
      description: 'List the event-data collections grouped by type.',
      category: 'Query',
      inputSchema: { ...NO_ARGS },
      mutates: false,
      run: (_a, h) => h.eventDisplay.getCollections(),
    },
    {
      name: 'describe-event',
      title: 'Describe event',
      description: 'Report the current event key and metadata.',
      category: 'Query',
      inputSchema: { ...NO_ARGS },
      mutates: false,
      run: (_a, h) => ({
        eventKey: h.eventDisplay.getCurrentEventKey(),
        metadata: h.eventDisplay.getEventMetadata(),
      }),
    },
    {
      name: 'get-object',
      title: 'Get object',
      description:
        'Return the raw data of one object by collection and row index.',
      category: 'Query',
      inputSchema: { ...OBJECT_REF },
      mutates: false,
      run: (a, h) => {
        const arr = h.eventDisplay.getCollection(a.collection);
        return arr?.[a.index];
      },
    },
  ];
}

/**
 * Register the generic v1 command set on a registry.
 * @param registry The registry to populate.
 */
export function registerDefaultCommands(registry: CommandRegistry): void {
  for (const command of defaultCommands()) {
    registry.register(command);
  }
}
