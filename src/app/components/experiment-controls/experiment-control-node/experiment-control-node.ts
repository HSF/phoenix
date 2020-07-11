/**
 * A single node of experiment control item.
 */
export class ExperimentControlNode {
    /** Name of the node. */
    name: string;
    /** Function on toggling the node. */
    onToggle: (value: boolean) => void;
    /** Function for toggling the current and all child nodes. */
    toggleSelfAndDescendants: (value: boolean) => void = (value: boolean) => {
        this.onToggle(value);
        this.toggleState = value;
        for (const child of this.children) {
            child.toggleSelfAndDescendants(value);
        }
    }
    /** If the node toggle state is true or false. */
    toggleState: boolean = true;
    /** Children of the node. */
    children: ExperimentControlNode[] = [];
    /** Configuration options in the node. */
    configs: any[] = [];
    /** Level of the node. */
    nodeLevel: number = 0;
    /** Parent of the node. */
    private parent: ExperimentControlNode;

    /**
     * Create the experiment control node.
     * @param name Name of the node.
     * @param onToggle Function on toggling the node.
     * @param children Children of the node.
     * @param configs Configuration options in the node.
     * @param parent Parent of the node.
     */
    constructor(name: string,
        onToggle?: (value: boolean) => void,
        children?: ExperimentControlNode[],
        configs?: any[],
        parent?: ExperimentControlNode) {
        this.name = name;
        this.onToggle = onToggle;
        if (children)
            this.children = children;
        if (configs)
            this.configs = configs;
        this.parent = parent;
    }

    /**
     * Add a child to the experiment control item.
     * @param name Name of the child.
     * @param onToggle Function on toggling the child.
     * @returns The child node.
     */
    addChild(name: string, onToggle?: (value: boolean) => void): ExperimentControlNode {
        const child = new ExperimentControlNode(name, onToggle);
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
    removeChild(child: ExperimentControlNode): ExperimentControlNode {
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
     * Add a config to the experiment control item.
     * @param options Options for the config.
     * @returns The current node.
     */
    addConfig(type: string, options: any): ExperimentControlNode {
        let configOptions = { type: type };
        Object.assign(configOptions, options);
        this.configs.push(configOptions);
        return this;
    }
}
