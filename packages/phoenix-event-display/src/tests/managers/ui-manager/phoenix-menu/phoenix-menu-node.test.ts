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
  });
});
