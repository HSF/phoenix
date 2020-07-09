import {
  Component, Input, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, ChangeDetectorRef
} from '@angular/core';
import { isArray } from 'util';

@Component({
  selector: 'app-experiment-control-item',
  templateUrl: './experiment-control-item.component.html',
  styleUrls: ['./experiment-control-item.component.scss']
})
export class ExperimentControlItemComponent {

  @ViewChild('itemConfig', { read: ViewContainerRef }) itemConfig: ViewContainerRef;
  @ViewChild('itemChildren', { read: ViewContainerRef }) itemChildren: ViewContainerRef;

  @Input() name: string;
  @Input() geometryName: string;
  @Input() onToggle: (value: boolean) => void;
  children = [];
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
   * @returns The child element.
   */
  addChild(name: string, onToggle?: (value: boolean) => void, config?: any[] | any)
    : ExperimentControlItemComponent {
    const factory: ComponentFactory<ExperimentControlItemComponent> = this.resolver
      .resolveComponentFactory(ExperimentControlItemComponent);
    const componentRef: ComponentRef<ExperimentControlItemComponent> = this.itemChildren
      .createComponent(factory);
    componentRef.instance.name = name;
    componentRef.instance.geometryName = name;
    if (onToggle) {
      componentRef.instance.onToggle = onToggle;
    }
    if (config) {
      if (isArray(config)) {
        for (const configOptions of config) {
          componentRef.instance.addConfig(configOptions);
        }
      } else {
        componentRef.instance.addConfig(config);
      }
    }
    this.children.push(componentRef.instance);
    this.cd.detectChanges();
    return componentRef.instance;
  }

  /**
   * Add a config to experiment control item.
   * @param options Options for the config.
   */
  addConfig(options: any) {
    const factory = this.resolver.resolveComponentFactory(options.component);
    const componentRef = this.itemConfig.createComponent(factory);
    for (const option of Object.keys(options)) {
      if (option !== 'component') {
        componentRef.instance[option] = options[option];
      }
    }
    this.hasConfig = true;
    this.cd.detectChanges();
  }

}
