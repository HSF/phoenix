import {
  Component, Input, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, ChangeDetectorRef
} from '@angular/core';

@Component({
  selector: 'app-experiment-control-item',
  templateUrl: './experiment-control-item.component.html',
  styleUrls: ['./experiment-control-item.component.scss']
})
export class ExperimentControlItemComponent {

  @ViewChild('itemConfig', { read: ViewContainerRef }) itemConfig: ViewContainerRef;
  @ViewChild('itemChildren', { read: ViewContainerRef }) itemChildren: ViewContainerRef;

  @Input() name: string;
  @Input() onToggle: (value: boolean) => void;
  children = [];
  parent: ExperimentControlItemComponent;
  visible: boolean = true;
  hasConfig: boolean = false;
  configActive: boolean = false;
  childrenActive: boolean = false;

  constructor(private resolver: ComponentFactoryResolver, private cd: ChangeDetectorRef) { }

  /**
   * Add a child to the experiment control item.
   * @param name Name of the child.
   * @param onToggle Function on toggling the child.
   * @param config Configuration options to be added to the child.
   * @returns The child node.
   */
  addChild(name: string, onToggle?: (value: boolean) => void)
    : ExperimentControlItemComponent {
    const childFactory: ComponentFactory<ExperimentControlItemComponent> = this.resolver
      .resolveComponentFactory(ExperimentControlItemComponent);
    const componentRef: ComponentRef<ExperimentControlItemComponent> = this.itemChildren
      .createComponent(childFactory);

    componentRef.instance.parent = this;

    componentRef.instance.name = name;
    if (onToggle) {
      componentRef.instance.onToggle = onToggle;
    }

    this.children.push(componentRef.instance);
    this.cd.detectChanges();
    return componentRef.instance;
  }

  /**
   * Remove a child of this node.
   * @param child The child node to be removed.
   * @returns The current node.
   */
  removeChild(child: ExperimentControlItemComponent) {
    const childIndex = this.children.indexOf(child);
    this.itemChildren.remove(childIndex);
    this.children.splice(childIndex, 1);
    return this;
  }

  /**
   * Remove this node.
   */
  remove() {
    this.parent.removeChild(this);
  }

  /**
   * Add a config to the experiment control item.
   * @param options Options for the config.
   * @returns The current node.
   */
  addConfig(options: any): ExperimentControlItemComponent {
    const configFactory = this.resolver.resolveComponentFactory(options.component);
    const componentRef = this.itemConfig.createComponent(configFactory);
    for (const option of Object.keys(options)) {
      if (option !== 'component') {
        componentRef.instance[option] = options[option];
      }
    }
    this.hasConfig = true;
    this.cd.detectChanges();
    return this;
  }

}
