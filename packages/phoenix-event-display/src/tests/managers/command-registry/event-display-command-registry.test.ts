/**
 * @jest-environment jsdom
 */
import { EventDisplay } from '../../../event-display';
import {
  CommandRegistry,
  COMMAND_EXECUTED_EVENT,
} from '../../../managers/command-registry';

function makeEventDisplay(): EventDisplay {
  const ed = Object.create(EventDisplay.prototype) as EventDisplay;
  (ed as any).eventBus = new Map();
  (ed as any).eventBusWildcard = new Set();
  (ed as any).commandRegistry = null;
  (ed as any).ui = { setDarkTheme: jest.fn() };
  (ed as any).graphicsLibrary = { revertMainCamera: jest.fn() };
  (ed as any).stateManager = {};
  (ed as any).nextEvent = jest.fn();
  (ed as any).getCollection = jest.fn(() => [{ uuid: 'u0' }, { uuid: 'u1' }]);
  return ed;
}

describe('EventDisplay command registry wiring', () => {
  it('returns a singleton registry populated with defaults', () => {
    const ed = makeEventDisplay();
    const reg = ed.getCommandRegistry();
    expect(reg).toBeInstanceOf(CommandRegistry);
    expect(ed.getCommandRegistry()).toBe(reg);
    expect(reg.list().length).toBeGreaterThan(10);
  });

  it('emits command-executed on the real bus when a command runs', async () => {
    const ed = makeEventDisplay();
    const seen: any[] = [];
    ed.on(COMMAND_EXECUTED_EVENT, (d) => seen.push(d));
    await ed.getCommandRegistry().execute('next-event');
    expect((ed as any).nextEvent).toHaveBeenCalled();
    expect(seen).toHaveLength(1);
    expect(seen[0].name).toBe('next-event');
  });

  it('buildCommandHost.resolveObject maps collection+index to uuid', () => {
    const ed = makeEventDisplay();
    const host = (ed as any).buildCommandHost();
    expect(host.resolveObject('Tracks', 1)).toEqual({ uuid: 'u1' });
    expect(host.resolveObject('Tracks', 9)).toBeUndefined();
  });
});
