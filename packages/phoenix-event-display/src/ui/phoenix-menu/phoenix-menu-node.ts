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
  configs: any[] = [];
  /** Level of the node. */
  nodeLevel: number = 0;
  /** Parent of the node. */
  private parent: PhoenixMenuNode;

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
    configs?: any[],
    parent?: PhoenixMenuNode
  ) {
    this.name = name;
    this.icon = icon;
    this.onToggle = onToggle;
    if (children)
      this.children = children;
    if (configs)
      this.configs = configs;
    if (parent)
      this.parent = parent;
  }

  /**
   * Add a child to the phoenix menu item.
   * @param name Name of the child.
   * @param onToggle Function on toggling the child.
   * @param icon Icon of the child.
   * @returns The child node.
   */
  addChild(name: string, onToggle?: (value: boolean) => void, icon?: string): PhoenixMenuNode {
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
      console.error('Cannot delete root node of phoenix menu. Set it to undefined/null instead.');
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
   * @param options Options for the config.
   * @returns The current node.
   */
  addConfig(type: string, options: any): PhoenixMenuNode {
    let configOptions = { type: type };
    Object.assign(configOptions, options);
    this.configs.push(configOptions);
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
      child.toggleSelfAndDescendants(value);
    }
  }

  /**
   * Get current state of the node as an object.
   * @returns State of the node as an object.
   */
  private getNodeState(): object {
    const phoenixNodeJSON: object = {};

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
   * Save the state of the phoenix menu node as JSON.
   */
  saveStateAsJSON() {
    const blob = new Blob([JSON.stringify(this.getNodeState())], {
      type: 'application/json'
    });
    const tempAnchor = document.createElement('a');
    tempAnchor.href = URL.createObjectURL(blob);
    tempAnchor.download = 'phoenix-menu-config.json';
    tempAnchor.click();
    tempAnchor.remove();
  }

  /**
   * Load the state of the phoenix menu node from JSON.
   * @param json JSON containing the phoenix menu node state.
   */
  private loadStateFromJSON(json: string | object) {
    let jsonObject: any;
    if (typeof json === 'string') {
      jsonObject = JSON.parse(json);
    } else {
      jsonObject = json;
    }

    this.childrenActive = jsonObject['childrenActive'];
    this.toggleState = jsonObject['toggleState'];
    this.onToggle?.(this.toggleState);

    for (const configState of jsonObject['configs']) {
      const nodeConfig = this.configs.filter(nodeConfig =>
        nodeConfig.type === configState['type'] && nodeConfig.label === configState['label']
      )[0];
      for (const prop in configState) {
        nodeConfig[prop] = configState[prop];
      }

      // Apply configs of different config types - manual
      if (nodeConfig.type === 'checkbox' && configState?.['isChecked']) {
        nodeConfig.onChange?.(configState?.['isChecked']);
      } else if (nodeConfig.type === 'color' && configState?.['color']) {
        nodeConfig.onChange?.(configState?.['color']);
      } else if (nodeConfig.type === 'slider' && configState?.['value']) {
        nodeConfig.onChange?.(configState?.['value']);
      } else if (nodeConfig.type === 'rangeSlider' && configState?.['value']) {
        nodeConfig.onChange?.({
          value: configState?.['value'],
          highValue: configState?.['highValue']
        });
      }
    }

    for (const childState of jsonObject['children']) {
      const nodeChild = this.children.filter(nodeChild =>
        nodeChild.name === childState.name && nodeChild.nodeLevel === childState.nodeLevel
      )[0];
      if (nodeChild) {
        nodeChild.loadStateFromJSON(childState);
      }
    }
  }

  /**
   * Load data from JSON file.
   * @param onFileRead Callback with JSON file data when the file data is read.
   */
  loadStateFromFile(onFileRead?: (json: object) => void) {
    // Create a mock input file element and use that to read the file
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'application/json';
    inputFile.onchange = (e: any) => {
      const configFile = e.target?.files[0];
      const reader = new FileReader();
      reader.onload = e => {
        const jsonData = JSON.parse(e.target.result.toString());

        onFileRead?.(jsonData);
        this.loadStateFromJSON(jsonData);

        inputFile.remove();
        this.configActive = false;
      };
      reader.readAsText(configFile);
    }
    inputFile.click();
  }
}
