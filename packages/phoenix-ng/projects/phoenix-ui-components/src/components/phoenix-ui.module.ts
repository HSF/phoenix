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
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NavComponent } from './nav/nav.component';
import {
  PhoenixMenuComponent,
  PhoenixMenuItemComponent,
  ConfigSliderComponent,
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
  VrToggleComponent,
  SSModeComponent,
  PerformanceToggleComponent,
  ShareLinkComponent,
  ShareLinkDialogComponent,
} from './ui-menu';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AttributePipe } from '../services/extras/attribute.pipe';
import { LoaderComponent } from './loader/loader.component';
import { EmbedMenuComponent } from './embed-menu/embed-menu.component';
import { ExperimentLinkComponent } from './embed-menu/experiment-link/experiment-link.component';

const PHOENIX_COMPONENTS: Type<any>[] = [
  NavComponent,
  UiMenuComponent,
  CollectionsInfoComponent,
  MenuToggleComponent,
  CollectionsInfoOverlayComponent,
  IoOptionsComponent,
  IOOptionsDialogComponent,
  OverlayViewComponent,
  AttributePipe,
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
  VrToggleComponent,
  SSModeComponent,
  PerformanceToggleComponent,
  LoaderComponent,
  ShareLinkComponent,
  ShareLinkDialogComponent,
  EmbedMenuComponent,
  ExperimentLinkComponent,
];

@NgModule({
  declarations: [...PHOENIX_COMPONENTS],
  imports: [
    CommonModule,
    RouterModule,
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
    NgxSliderModule,
  ],
  entryComponents: [
    OverlayComponent,
    OverlayViewWindowComponent,
    IOOptionsDialogComponent,
    CollectionsInfoOverlayComponent,
    ObjectSelectionOverlayComponent,
    InfoPanelOverlayComponent,
  ],
  exports: [PHOENIX_COMPONENTS],
})
export class PhoenixUIModule {}
