import { PhoenixMenuNode } from './phoenix-menu-node';

describe('PhoenixMenuNode', () => {
  let phoenixMenuNode: PhoenixMenuNode;

  beforeAll(() => {
    phoenixMenuNode = new PhoenixMenuNode('Test Node');
  });

  it('should create an instance', () => {
    expect(phoenixMenuNode).toBeTruthy();
  });

  it('should create with children, configs and parent', () => {
    const phoenixMenuChildren = [
      'Test Child 1',
      'Test Child 2',
      'Test Child 3'
    ].map(childName => new PhoenixMenuNode(childName));
    const phoenixMenuParent = new PhoenixMenuNode('Test Parent Node');
    const phoenixMenuConfigs = [{
        type: 'checkbox',
        label: 'Wireframe',
        isChecked: false,
        onChange: (value: boolean) => { }
      }];

    const phoenixMenuNodeComplete = new PhoenixMenuNode(
      'Test Node',          // Node name/title
      'test-icon',          // Node icon
      () => { },            // onToggle
      phoenixMenuChildren,  // Node children
      phoenixMenuConfigs,   // Node configs
      phoenixMenuParent     // Node parent
    );

    expect(phoenixMenuNodeComplete.children).toBe(phoenixMenuChildren);
    expect((phoenixMenuNodeComplete as any).parent).toBe(phoenixMenuParent);
    expect(phoenixMenuNodeComplete.configs).toBe(phoenixMenuConfigs);
  });

  describe('PhoenixMenuNode children', () => {
    let phoenixMenuNodeChild: PhoenixMenuNode;

    it('should add child', () => {
      expect(phoenixMenuNode.children.length).toBe(0);
      phoenixMenuNodeChild = phoenixMenuNode.addChild('Test Child');
      expect(phoenixMenuNode.children[0]).toBe(phoenixMenuNodeChild);
    });

    it('should remove child', () => {
      expect(phoenixMenuNode.children.length).toBeGreaterThan(0);
      phoenixMenuNode.removeChild(phoenixMenuNodeChild);
      expect(phoenixMenuNode.children.length).toBe(0);
    });

    it('should truncate/remove all children', () => {
      phoenixMenuNode.addChild('Test Child 1');
      phoenixMenuNode.addChild('Test Child 2');

      expect(phoenixMenuNode.children.length).toBeGreaterThan(1);

      phoenixMenuNode.truncate();

      expect(phoenixMenuNode.children.length).toBe(0);
    });
  });

  it('should add config', () => {
    const previousConfigsLength = phoenixMenuNode.configs.length;
    phoenixMenuNode.addConfig('checkbox', {
      label: 'Test Config',
      isChecked: false,
      onChange: (value: boolean) => { }
    });
    expect(phoenixMenuNode.configs.length).toBe(previousConfigsLength + 1);
  });

  it('should toggle self and descendants', () => {
    const child = phoenixMenuNode.addChild('Test Child for Toggle', (value: boolean) => { });
    phoenixMenuNode.onToggle = (value: boolean) => { };

    spyOn(child, 'onToggle').and.callThrough();
    spyOn(phoenixMenuNode, 'onToggle').and.callThrough();

    phoenixMenuNode.toggleSelfAndDescendants(true);

    expect(phoenixMenuNode.onToggle).toHaveBeenCalledWith(true);
    expect(child.onToggle).toHaveBeenCalledWith(true);

    // Check when onToggle method is not defined

    phoenixMenuNode.onToggle = undefined;
    phoenixMenuNode.toggleSelfAndDescendants(false);

    expect(child.onToggle).toHaveBeenCalledWith(false);
  });

  it('should remove self', () => {
    // Cannot delete root node (undefine it instead) so add a child to remove for test
    const phoenixMenuNodeToRemove = phoenixMenuNode.addChild('Test Node for Removing');
    const previousChildrenLength = phoenixMenuNode.children.length;

    phoenixMenuNodeToRemove.remove();

    expect(phoenixMenuNode.children.length).toBe(previousChildrenLength - 1);
  });
});
