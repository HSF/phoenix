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

    /**
     * Create the phoenix menu node.
     * @param name Name of the node.
     * @param icon Icon of the node.
     * @param onToggle Function on toggling the node.
     * @param children Children of the node.
     * @param configs Configuration options in the node.
     * @param parent Parent of the node.
     */
    constructor(name: string,
        icon?: string,
        onToggle?: (value: boolean) => void,
        children?: PhoenixMenuNode[],
        configs?: any[],
        parent?: PhoenixMenuNode) {
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
        this.parent.removeChild(this);
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
        this.onToggle(value);
        this.toggleState = value;
        for (const child of this.children) {
            child.toggleSelfAndDescendants(value);
        }
    }
}
