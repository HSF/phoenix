/**
 * @jest-environment jsdom
 */
import { PhoenixMenuNode } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';

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

    it('should not apply ungrouped color configs on creation or state load', () => {
      const onChange = jest.fn();
      const node = new PhoenixMenuNode('test');
      node.addConfig({
        type: 'color',
        label: 'Color',
        color: '#00ff00',
        onChange,
      });
      node.loadStateFromJSON(node.getNodeState());

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
