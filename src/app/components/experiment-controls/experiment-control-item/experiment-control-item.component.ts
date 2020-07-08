import { Component, OnInit, Input, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef } from '@angular/core';
import { ConfigCheckboxComponent } from './config-checkbox/config-checkbox.component';
import { isArray } from 'util';

@Component({
  selector: 'app-experiment-control-item',
  templateUrl: './experiment-control-item.component.html',
  styleUrls: ['./experiment-control-item.component.scss']
})
export class ExperimentControlItemComponent implements OnInit {

  @ViewChild('itemConfig', { read: ViewContainerRef }) itemConfig;
  @ViewChild('itemChildren', { read: ViewContainerRef }) itemChildren;

  @Input() name: string;
  @Input() geometryName: string;
  @Input() onToggle: (value: boolean) => void;
  children: ExperimentControlItemComponent[] = [];
  visible: boolean = true;
  hasConfig: boolean = false;
  configActive: boolean = false;
  childrenActive: boolean = false;

  constructor(private resolver: ComponentFactoryResolver) { }

  ngOnInit(): void {
  }

  addChild(name: string, onToggle?: () => void, config?: any[] | any)
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
    return componentRef.instance;
  }

  addConfig(options: any) {
    const factory = this.resolver.resolveComponentFactory(options.component);
    const componentRef = this.itemConfig.createComponent(factory);
    for (const option of Object.keys(options)) {
      if (option !== 'component') {
        componentRef.instance[option] = options[option];
      }
    }
    this.hasConfig = true;
  }

}
