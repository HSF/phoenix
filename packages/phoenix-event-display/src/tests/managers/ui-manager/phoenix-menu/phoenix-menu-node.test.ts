/**
 * @jest-environment jsdom
 */
import { PhoenixMenuNode } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';

/**
 * The state of a node as it would be read back from a saved file, rather than
 * the live configs `getNodeState` hands out references to.
 */
const savedState = (node: PhoenixMenuNode) =>
  JSON.parse(JSON.stringify(node.getNodeState()));

describe('PhoenixMenuNode', () => {
  describe('loadStateFromJSON', () => {
    it('should restore the value of a select config and apply it', () => {
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('test');
      node.addConfig({
        type: 'select',
        label: 'Color by',
        options: ['Charge', 'Momentum'],
        onChange,
      });
      // Adding the config without a value should not apply anything.
      expect(onChange).not.toHaveBeenCalled();

      const state = node.getNodeState();
      state['configs'][0]['value'] = 'Momentum';
      node.loadStateFromJSON(state);

      expect(onChange).toHaveBeenCalledWith('Momentum');
    });

    it('should not overwrite the options of a select config from a saved state', () => {
      const node = new PhoenixMenuNode('test');
      const config = {
        type: 'select' as const,
        label: 'Color by',
        options: ['Charge', 'Momentum'],
        onChange: jest.fn(),
      };
      node.addConfig(config);

      // Simulate a state saved when the select had an extra option.
      const state = node.getNodeState();
      state['configs'][0] = {
        ...state['configs'][0],
        options: ['Charge', 'Momentum', 'Vertex'],
      };
      node.loadStateFromJSON(state);

      expect(config.options).toEqual(['Charge', 'Momentum']);
    });

    it('should not apply grouped color configs when adding them, only on state load', () => {
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('test');
      node.addConfig({
        type: 'color',
        label: 'q=1',
        group: 'charge',
        color: '#ff0000',
        onChange,
      });
      expect(onChange).not.toHaveBeenCalled();

      node.loadStateFromJSON(node.getNodeState());

      expect(onChange).toHaveBeenCalledWith('#ff0000');
    });

    it('should apply ungrouped color configs on state load but not on creation', () => {
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('test');
      node.addConfig({
        type: 'color',
        label: 'Color',
        color: '#00ff00',
        onChange,
      });
      // The collection already has this color when the menu is built.
      expect(onChange).not.toHaveBeenCalled();

      node.loadStateFromJSON(node.getNodeState());

      expect(onChange).toHaveBeenCalledWith('#00ff00');
    });

    it('should apply the collection color before the "Color by" options', () => {
      // The color by options paint over the collection color, so they have to
      // be applied after it for the restored state to look right.
      const applied: string[] = [];
      const node = new PhoenixMenuNode('test');
      node
        .addConfig({
          type: 'color',
          label: 'Color',
          color: '#00ff00',
          onChange: () => applied.push('Color'),
        })
        .addConfig({
          type: 'select',
          label: 'Color by',
          options: ['Charge q'],
          value: 'Charge q',
          onChange: () => applied.push('Color by'),
        })
        .addConfig({
          type: 'color',
          label: 'q=1',
          group: 'charge',
          color: '#ff0000',
          onChange: () => applied.push('q=1'),
        });

      const state = node.getNodeState();
      // Only the order in which the saved state is applied matters here.
      applied.length = 0;
      node.loadStateFromJSON(state);

      expect(applied).toEqual(['Color', 'Color by', 'q=1']);
    });

    it('should apply falsy config values from a saved state', () => {
      // A saved `false` or `0` describes the scene just as much as a truthy
      // value does, so it has to be applied too.
      const onCheckboxChange = jest.fn();
      const onSliderChange = jest.fn();
      const node = new PhoenixMenuNode('test');
      node
        .addConfig({
          type: 'checkbox',
          label: 'Wireframe',
          isChecked: false,
          onChange: onCheckboxChange,
        })
        .addConfig({
          type: 'slider',
          label: 'Opacity',
          value: 0,
          onChange: onSliderChange,
        });
      // Not applied when the configs are added.
      expect(onCheckboxChange).not.toHaveBeenCalled();
      expect(onSliderChange).not.toHaveBeenCalled();

      node.loadStateFromJSON(node.getNodeState());

      expect(onCheckboxChange).toHaveBeenCalledWith(false);
      expect(onSliderChange).toHaveBeenCalledWith(0);
    });

    it('should restore the rest of a node when a saved config is gone', () => {
      // The menu is built from the event data, so a state saved with one event
      // can hold configs another event has no equivalent of - a cut on an
      // attribute its objects do not have, for example.
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('Collection');
      node.addConfig({
        type: 'color',
        label: 'Color',
        color: '#ff0000',
        onChange,
      });

      const state = savedState(node);
      state['configs'].unshift({
        type: 'rangeSlider',
        label: 'A cut this event does not have',
        value: 1,
        highValue: 2,
      });
      state['configs'][1].color = '#0adb2d';

      node.loadStateFromJSON(state);

      expect(onChange).toHaveBeenCalledWith('#0adb2d');
    });

    it('should restore child nodes when a saved config is gone', () => {
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('Collection');
      const child = node.addChild('Color Options');
      child.addConfig({
        type: 'color',
        label: 'Color',
        color: '#ff0000',
        onChange,
      });

      const state = savedState(node);
      state['configs'].push({
        type: 'checkbox',
        label: 'An option this event does not have',
        isChecked: true,
      });
      state['children'][0].configs[0].color = '#0adb2d';

      node.loadStateFromJSON(state);

      expect(onChange).toHaveBeenCalledWith('#0adb2d');
    });

    it('should restore what it can from a partial state', () => {
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('Collection');
      node.addConfig({
        type: 'color',
        label: 'Color',
        color: '#ff0000',
        onChange,
      });

      // A hand written config file need not spell out every node.
      expect(() =>
        node.loadStateFromJSON({ name: 'Collection' }),
      ).not.toThrow();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should apply the color of a Labels node when the config is added', () => {
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('Labels');
      node.addConfig({
        type: 'color',
        label: 'Color',
        color: '#a8a8a8',
        onChange,
      });

      expect(onChange).toHaveBeenCalledWith('#a8a8a8');
    });

    it('should warn when a node which can be toggled has no toggle state', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const node = new PhoenixMenuNode('Pixel', undefined, jest.fn());

      node.loadStateFromJSON({ name: 'Pixel' });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Pixel'));
      warn.mockRestore();
    });

    it('should not warn about a node which has nothing to toggle', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const node = new PhoenixMenuNode('Cut Options');

      node.loadStateFromJSON({ name: 'Cut Options' });

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('toggleSelfAndDescendants', () => {
    /** A group with two collections under it, as the event data menu is built. */
    const eventDataGroup = () => {
      const group = new PhoenixMenuNode('Hits', undefined, jest.fn());
      group.addChild('Pixel', jest.fn());
      group.addChild('SCT', jest.fn());
      return group;
    };

    it('should restore the previous state of children toggled off through it', () => {
      const group = eventDataGroup();
      group.children[1].toggleSelfAndDescendants(false);

      group.toggleSelfAndDescendants(false);
      group.toggleSelfAndDescendants(true);

      expect(group.children[0].toggleState).toBe(true);
      expect(group.children[1].toggleState).toBe(false);
    });

    it('should not leave children without a toggle state when switched on first', () => {
      const group = eventDataGroup();
      // A loaded state switches the group off without descending into it, so
      // nothing is remembered about the children.
      group.loadStateFromJSON({ name: 'Hits', toggleState: false });

      group.toggleSelfAndDescendants(true);

      for (const child of group.children) {
        expect(child.toggleState).toBe(true);
        expect(child.onToggle).toHaveBeenCalledWith(true);
      }
    });

    it('should keep what children were before, when an ancestor is toggled off too', () => {
      const root = new PhoenixMenuNode('Event Data', undefined, jest.fn());
      const group = root.addChild('Hits', jest.fn());
      group.addChild('Pixel', jest.fn());
      group.addChild('SCT', jest.fn());

      group.children[1].toggleSelfAndDescendants(false); // SCT off
      group.toggleSelfAndDescendants(false); // the group off
      root.toggleSelfAndDescendants(false); // and all of Event Data off

      root.toggleSelfAndDescendants(true);
      group.toggleSelfAndDescendants(true);

      // Pixel was on before any of this, so it comes back on. Switching the
      // group off through Event Data must not have overwritten that with the
      // false the group had already imposed on it.
      expect(group.children[0].toggleState).toBe(true);
      expect(group.children[1].toggleState).toBe(false);
    });

    it('should save a toggle state for every node', () => {
      const group = eventDataGroup();
      group.loadStateFromJSON({ name: 'Hits', toggleState: false });
      group.toggleSelfAndDescendants(true);
      group.children[0].toggleSelfAndDescendants(false);

      const state = savedState(group);

      expect(state['children'][0]).toHaveProperty('toggleState', false);
      expect(state['children'][1]).toHaveProperty('toggleState', true);
    });
  });
});
