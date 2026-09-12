import { type PhoenixMenuConfigs } from './config-types';

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
  private childrenToggleState: { [key: string]: boolean } = {};

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
    parent?: PhoenixMenuNode,
  ) {
    this.name = name;
    if (icon) this.icon = icon;
    if (onToggle) this.onToggle = onToggle;
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
    icon?: string,
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
        'Cannot delete root node of phoenix menu. Set it to undefined/null instead.',
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
   * @param config config to be displayed as a Phoenix Menu item.
   * @returns The current node.
   */
  addConfig(
    config: PhoenixMenuConfigs[keyof PhoenixMenuConfigs],
  ): PhoenixMenuNode {
    this.configs.push(config);
    // Apply the values of config
    this.applyConfigState(config);
    return this;
  }

  /**
   * Function for toggling the current and all child nodes.
   * @param value If the node itself and descendants are to be made true or false.
   */
  toggleSelfAndDescendants(value: boolean) {
    // Whether this node is actually going from on to off, as opposed to being
    // switched off again while already off - which happens whenever an
    // ancestor is toggled off.
    const isBeingSwitchedOff = !value && (this.toggleState ?? true);

    this.onToggle?.(value);
    this.toggleState = value;
    for (const child of this.children) {
      if (!value) {
        // Save previous toggle state of children and toggle them false. Only
        // on the way from on to off: an already off node has children it has
        // itself forced to false, and saving those would overwrite what they
        // were before with the states this node imposed on them.
        if (isBeingSwitchedOff) {
          this.childrenToggleState[child.name] = child.toggleState;
        }
        child.toggleSelfAndDescendants(value);
      } else {
        // Restore previous toggle state of children. There is no saved entry
        // for a child which was never toggled off through this node - for
        // instance when this node was switched off by a loaded state rather
        // than by its own toggle - so fall back to the child's current state
        // instead of propagating `undefined` down the tree.
        child.toggleState =
          this.childrenToggleState[child.name] ?? child.toggleState ?? true;
        child.toggleSelfAndDescendants(child.toggleState);
      }
    }
  }

  /**
   * Apply the current values of config by calling the change function.
   * @param config Config whose values are to be applied.
   * @param fromStateLoad Whether the config is being applied from a saved
   * state, as opposed to being newly added to the menu.
   */
  applyConfigState(config: any, fromStateLoad: boolean = false) {
    if (fromStateLoad) {
      // A saved state describes what the scene should look like, so every
      // stored value is applied - including falsy ones like an unchecked
      // checkbox or a zero slider. Otherwise the menu would show settings the
      // scene does not actually have.
      this.applySavedConfigState(config);
      return;
    }

    // Apply configs of different config types - manual
    if (config.type === 'checkbox' && config?.['isChecked']) {
      config.onChange?.(config?.['isChecked']);
    } else if (config.type === 'color' && config?.['color']) {
      // Colors are deliberately not applied when a config is added: the
      // collection already has its color, and the grouped "color by" swatches
      // would repaint it. They are applied on state load instead.
      if (this.name === 'Labels' || this.parent?.name === 'Labels') {
        // Exception for Labels node (and sub labels), which should always have color applied
        config.onChange?.(config?.['color']);
      }
    } else if (config.type === 'slider' && config?.['value']) {
      config.onChange?.(config?.['value']);
    } else if (config.type === 'select' && config?.['value']) {
      config.onChange?.(config?.['value']);
    } else if (
      config.type === 'rangeSlider' &&
      config?.['value'] !== undefined
    ) {
      config.onChange?.({
        value: config?.['value'],
        highValue: config?.['highValue'],
      });
      config.setEnableMin?.(config?.['enableMin']);
      config.setEnableMax?.(config?.['enableMax']);
    }
  }

  /**
   * Apply the values of a config restored from a saved state, so that the scene
   * matches what the menu displays.
   * @param config Config whose values are to be applied.
   */
  private applySavedConfigState(config: any) {
    switch (config.type) {
      case 'checkbox':
        if (config['isChecked'] !== undefined) {
          config.onChange?.(config['isChecked']);
        }
        break;
      case 'color':
        if (config['color'] !== undefined) {
          config.onChange?.(config['color']);
        }
        break;
      case 'slider':
      case 'select':
        if (config['value'] !== undefined) {
          config.onChange?.(config['value']);
        }
        break;
      case 'rangeSlider':
        if (config['value'] !== undefined) {
          config.onChange?.({
            value: config['value'],
            highValue: config['highValue'],
          });
        }
        config.setEnableMin?.(config['enableMin']);
        config.setEnableMax?.(config['enableMax']);
        break;
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
    // `?? true` so that a node whose toggle state was somehow lost is still
    // serialised with one - `JSON.stringify` drops an `undefined` value
    // entirely, and a state file missing the key cannot restore visibility.
    phoenixNodeJSON['toggleState'] = this.toggleState ?? true;
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
    let jsonObject;
    if (typeof json === 'string') {
      jsonObject = JSON.parse(json);
    } else {
      jsonObject = json;
    }

    if (jsonObject['childrenActive'] !== undefined) {
      this.childrenActive = jsonObject['childrenActive'];
    }

    if (jsonObject['toggleState'] !== undefined) {
      this.toggleState = jsonObject['toggleState'];
      this.onToggle?.(this.toggleState);
    } else if (this.onToggle) {
      // A node which can hide something is expected to carry a toggle state.
      // Missing it means the scene can end up disagreeing with the file - the
      // menu shows one thing, the state file says nothing - so say so rather
      // than leaving the mismatch to be found on screen. Nodes without a
      // toggle handler (the "Cut Options" style folders) are left alone, as
      // hand-written configs routinely omit their toggle state.
      console.warn(
        `No toggle state for "${this.name}" in the saved state, so its ` +
          'visibility is left as it is. The state was likely written by a ' +
          'version of Phoenix which could drop the toggle state of a node.',
      );
    }

    for (const configState of jsonObject['configs'] ?? []) {
      const nodeConfigs = this.configs.filter(
        (nodeConfig) =>
          nodeConfig.type === configState['type'] &&
          nodeConfig.label === configState['label'],
      );
      if (nodeConfigs.length > 1) {
        console.error(
          'Multiple configs found with same label and type in phoenix menu node.',
        );
      }

      if (nodeConfigs.length === 0) {
        // The menu is built from the event data, so a state saved with one
        // event can name configs another event has no equivalent of - a cut on
        // an attribute its objects do not have, for example. The rest of the
        // state still describes this node and its children, so only the config
        // which is gone is skipped.
        console.warn(
          `Ignoring "${configState['label']}" of "${this.name}" from the ` +
            'saved state, as the menu has no such option.',
        );
        continue;
      }

      const nodeConfig = nodeConfigs[0];
      // console.log('nodeConfig', nodeConfig);
      if (nodeConfig) {
        for (const prop in configState) {
          if (prop === 'options' || prop === 'onChange' || prop === 'hidden') {
            // The available options of a `select` are structural (derived from
            // the loaded event data), not user state - a saved state must not
            // overwrite them.
            // The function 'onChange' depends on the available options.
            // Whether a config is shown is derived from the state which is
            // being restored here, so it is left to the owner of the config to
            // work out once everything has been applied.
            continue;
          }
          const key = prop as keyof typeof nodeConfig;
          // console.log('prop',prop, 'key', key, 'nodeConfig[key]', nodeConfig[key]);
          (nodeConfig as any)[key] = configState[key];
        }

        this.applyConfigState(nodeConfig, true);
      }
    }

    // Now handle children
    for (const childState of jsonObject['children'] ?? []) {
      const nodeChild = this.children.filter(
        (nodeChild) =>
          nodeChild.name === childState.name &&
          nodeChild.nodeLevel === childState.nodeLevel,
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
  findInTree(name: string): PhoenixMenuNode | undefined {
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
