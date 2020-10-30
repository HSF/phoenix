import { NgModule, Type } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ng5SliderModule } from 'ng5-slider';
import { AttributePipe } from '../services';
import { NavComponent } from './nav/nav.component';
import {
  PhoenixMenuComponent,
  PhoenixMenuItemComponent,
  ConfigSliderComponent
} from './phoenix-menu';
import {
  UiMenuComponent,
  CollectionsInfoComponent,
  MenuToggleComponent,
  CollectionsInfoOverlayComponent,
  IoOptionsComponent,
  IOOptionsDialogComponent,
  OverlayViewComponent,
  ObjectSelectionComponent,
  ObjectSelectionOverlayComponent,
  EventSelectorComponent,
  ObjectClippingComponent,
  DarkThemeComponent,
  AutoRotateComponent,
  ViewOptionsComponent,
  OverlayViewWindowComponent,
  OverlayComponent,
  ExperimentInfoComponent,
  InfoPanelComponent,
  InfoPanelOverlayComponent,
  MainViewToggleComponent,
  ZoomControlsComponent,
  TreeMenuComponent,
  TreeMenuItemComponent,
  AnimateCameraComponent,
  AnimateEventComponent,
  VrToggleComponent
} from './ui-menu';
import { CommonModule } from '@angular/common';

const phoenixUIComponents: Type<any>[] = [
  NavComponent,
  AttributePipe,
  UiMenuComponent,
  CollectionsInfoComponent,
  MenuToggleComponent,
  CollectionsInfoOverlayComponent,
  IoOptionsComponent,
  IOOptionsDialogComponent,
  OverlayViewComponent,
  ObjectSelectionComponent,
  ObjectSelectionOverlayComponent,
  EventSelectorComponent,
  ObjectClippingComponent,
  DarkThemeComponent,
  AutoRotateComponent,
  ViewOptionsComponent,
  OverlayViewWindowComponent,
  OverlayComponent,
  ExperimentInfoComponent,
  InfoPanelComponent,
  InfoPanelOverlayComponent,
  MainViewToggleComponent,
  ZoomControlsComponent,
  TreeMenuComponent,
  TreeMenuItemComponent,
  PhoenixMenuComponent,
  PhoenixMenuItemComponent,
  ConfigSliderComponent,
  AnimateCameraComponent,
  AnimateEventComponent,
  VrToggleComponent
];

@NgModule({
  declarations: [...phoenixUIComponents],
  imports: [
    CommonModule,
    DragDropModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    OverlayModule,
    MatMenuModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatIconModule,
    Ng5SliderModule
  ],
  entryComponents: [
    IOOptionsDialogComponent,
    CollectionsInfoOverlayComponent,
    ObjectSelectionOverlayComponent,
    InfoPanelOverlayComponent
  ],
  exports: [...phoenixUIComponents]
})
export class PhoenixUIModule { }
