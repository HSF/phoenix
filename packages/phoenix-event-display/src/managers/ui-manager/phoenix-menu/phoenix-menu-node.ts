import { PhoenixMenuConfigs } from './config-types';

/**
 * A single node of phoenix menu item.
 */
export class PhoenixMenuNode {
  /** Name of the node. */
  name: string;
  /** Icon of the node. */
  icon: string;
  /** Function on toggling the node. */
  onToggle: (value: boolean) => void;
  /** If the node toggle state is true or false. */
  toggleState: boolean = true;
  /** Children of the node. */
  children: PhoenixMenuNode[] = [];
  /** Configuration options in the node. */
  configs: PhoenixMenuConfigs[keyof PhoenixMenuConfigs][] = [];
  /** Level of the node. */
  nodeLevel: number = 0;
  /** Parent of the node. */
  private parent: PhoenixMenuNode;
  /**
   * Previous toggle state of child nodes. This is so that the
   * previous state of child can be restored if we toggle the parent back on.
   */
  private childrenToggleState = {};

  /** If the node children are active or not. */
  childrenActive: boolean = false;
  /** If the node configuration options are active or not. */
  configActive: boolean = false;

  /**
   * Create the phoenix menu node.
   * @param name Name of the node.
   * @param icon Icon of the node.
   * @param onToggle Function on toggling the node.
   * @param children Children of the node.
   * @param configs Configuration options in the node.
   * @param parent Parent of the node.
   */
  constructor(
    name: string,
    icon?: string,
    onToggle?: (value: boolean) => void,
    children?: PhoenixMenuNode[],
    configs?: PhoenixMenuConfigs[keyof PhoenixMenuConfigs][],
    parent?: PhoenixMenuNode
  ) {
    this.name = name;
    this.icon = icon;
    this.onToggle = onToggle;
    if (children) this.children = children;
    if (configs) this.configs = configs;
    if (parent) this.parent = parent;
  }

  /**
   * Add a child to the phoenix menu item.
   * @param name Name of the child.
   * @param onToggle Function on toggling the child.
   * @param icon Icon of the child.
   * @returns The child node.
   */
  addChild(
    name: string,
    onToggle?: (value: boolean) => void,
    icon?: string
  ): PhoenixMenuNode {
    const child = new PhoenixMenuNode(name, icon, onToggle);
    child.parent = this;
    child.nodeLevel = this.nodeLevel + 1;
    this.children.push(child);
    return child;
  }

  /**
   * Remove a child node.
   * @param child The child node to be removed.
   * @returns The current node.
   */
  removeChild(child: PhoenixMenuNode): PhoenixMenuNode {
    const childIndex = this.children.indexOf(child);
    this.children.splice(childIndex, 1);
    return this;
  }

  /**
   * Remove the current node.
   */
  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    } else {
      console.error(
        'Cannot delete root node of phoenix menu. Set it to undefined/null instead.'
      );
    }
  }

  /**
   * Remove all children.
   */
  truncate() {
    this.children = [];
  }

  /**
   * Add a config to the phoenix menu item.
   * @param type Type of configuration.
   * @param options Options for the config.
   * @returns The current node.
   */
  addConfig<T extends keyof PhoenixMenuConfigs>(
    type: T,
    options: Omit<PhoenixMenuConfigs[T], 'type'>
  ): PhoenixMenuNode {
    const configsLength = this.configs.push({ type, ...options });
    // Apply the values of config
    this.applyConfigState(this.configs[configsLength - 1]);
    return this;
  }

  /**
   * Function for toggling the current and all child nodes.
   * @param value If the node itself and descendants are to be made true or false.
   */
  toggleSelfAndDescendants(value: boolean) {
    this.onToggle?.(value);
    this.toggleState = value;
    for (const child of this.children) {
      if (!value) {
        // Save previous toggle state of children and toggle them false
        this.childrenToggleState[child.name] = child.toggleState;
        child.toggleSelfAndDescendants(value);
      } else {
        // Restore previous toggle state of children
        child.toggleState = this.childrenToggleState[child.name];
        child.toggleSelfAndDescendants(child.toggleState);
      }
    }
  }

  /**
   * Apply the current values of config by calling the change function.
   * @param config Config whose values are to be applied.
   */
  applyConfigState(config: any) {
    // Apply configs of different config types - manual
    if (config.type === 'checkbox' && config?.['isChecked']) {
      config.onChange?.(config?.['isChecked']);
    } else if (config.type === 'color' && config?.['color'] && !config.group) {
      // Ignore color by options with `!config.group`, otherwise the collection color is overridden
      config.onChange?.(config?.['color']);
    } else if (config.type === 'slider' && config?.['value']) {
      config.onChange?.(config?.['value']);
    } else if (
      config.type === 'rangeSlider' &&
      config?.['value'] !== undefined
    ) {
      config.onChange?.({
        value: config?.['value'],
        highValue: config?.['highValue'],
      });
    }
  }

  /**
   * Get current state of the node as an object.
   * @returns State of the node as an object.
   */
  getNodeState(): { [key: string]: any } {
    const phoenixNodeJSON: { [key: string]: any } = {};

    phoenixNodeJSON['name'] = this.name;
    phoenixNodeJSON['nodeLevel'] = this.nodeLevel;
    phoenixNodeJSON['toggleState'] = this.toggleState;
    phoenixNodeJSON['childrenActive'] = this.childrenActive;
    phoenixNodeJSON['configs'] = this.configs;
    phoenixNodeJSON['children'] = [];

    for (const child of this.children) {
      phoenixNodeJSON['children'].push(child.getNodeState());
    }

    return phoenixNodeJSON;
  }

  /**
   * Load the state of the phoenix menu node from JSON.
   * @param json JSON containing the phoenix menu node state.
   */
  loadStateFromJSON(json: string | { [key: string]: any }) {
    let jsonObject: any;
    if (typeof json === 'string') {
      jsonObject = JSON.parse(json);
    } else {
      jsonObject = json;
    }

    this.childrenActive = jsonObject['childrenActive'];
    this.toggleState = jsonObject['toggleState'];
    this.toggleState !== undefined && this.onToggle?.(this.toggleState);

    for (const configState of jsonObject['configs']) {
      const nodeConfig = this.configs.find(
        (nodeConfig) =>
          nodeConfig.type === configState['type'] &&
          nodeConfig.label === configState['label']
      );

      if (nodeConfig) {
        for (const prop in configState) {
          nodeConfig[prop] = configState[prop];
        }

        this.applyConfigState(nodeConfig);
      }
    }

    for (const childState of jsonObject['children']) {
      const nodeChild = this.children.filter(
        (nodeChild) =>
          nodeChild.name === childState.name &&
          nodeChild.nodeLevel === childState.nodeLevel
      )[0];

      if (nodeChild) {
        nodeChild.loadStateFromJSON(childState);
      }
    }
  }

  /**
   * Find a node in the tree by name.
   * @param name Name of the node to find.
   * @returns The found node.
   */
  findInTree(name: string): PhoenixMenuNode {
    if (this.name === name) {
      return this;
    } else {
      for (const child of this.children) {
        const nodeFound = child.findInTree(name);
        if (nodeFound) {
          return nodeFound;
        }
      }
    }
  }

  /**
   * Find a node in the tree by name or create one.
   * @param name Name of the node to find or create.
   * @returns The found or created node.
   */
  findInTreeOrCreate(name: string): PhoenixMenuNode {
    let prevNode: PhoenixMenuNode = this;
    name.split('>').forEach((nodeName) => {
      nodeName = nodeName.trim();
      const nodeFound = prevNode.findInTree(nodeName);
      // const nodeFound = prevNode.children.find(child => child.name === nodeName);

      prevNode = nodeFound ? nodeFound : prevNode.addChild(nodeName, () => {});
    });
    return prevNode;
  }
}
