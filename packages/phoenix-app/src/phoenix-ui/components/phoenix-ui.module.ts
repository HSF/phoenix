import { NgModule } from '@angular/core';
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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { BrowserModule } from '@angular/platform-browser';



@NgModule({
  declarations: [
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
  ],
  imports: [
    BrowserModule,
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
  ]
})
export class PhoenixUIModule { }
