import { ErrorHandler, NgModule, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkTreeModule } from '@angular/cdk/tree';

import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { NavComponent } from './nav/nav.component';

import {
  PhoenixMenuComponent,
  PhoenixMenuItemComponent,
  ConfigSliderComponent,
} from './phoenix-menu';

import {
  UiMenuWrapperComponent,
  UiMenuComponent,
  CollectionsInfoComponent,
  MenuToggleComponent,
  GeometryBrowserComponent,
  GeometryBrowserOverlayComponent,
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
  CartesianGridConfigComponent,
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
  DownloadAnimationDialogComponent,
  AnimateEventComponent,
  VrToggleComponent,
  ArToggleComponent,
  SSModeComponent,
  MakePictureComponent,
  PerformanceToggleComponent,
  ShareLinkComponent,
  ShareLinkDialogComponent,
  EventDataExplorerComponent,
  EventDataExplorerDialogComponent,
  CycleEventsComponent,
  EventBrowserComponent,
  EventBrowserOverlayComponent,
  EtaPhiPanelComponent,
  EtaPhiPanelOverlayComponent,
  MoreInfoComponent,
  KinematicsPanelComponent,
  KinematicsPanelOverlayComponent,
  MasterclassPanelComponent,
  MasterclassPanelOverlayComponent,
  SessionPillComponent,
} from './ui-menu';

import { AttributePipe } from '../services/extras/attribute.pipe';
import { EventDisplayService } from '../services/event-display.service';
import { ErrorMessageService } from '../services/error-message-service';
import { GlobalErrorHandler } from '../services/global-error-handler';

import { LoaderComponent } from './loader/loader.component';
import { EmbedMenuComponent } from './embed-menu/embed-menu.component';
import { ExperimentLinkComponent } from './embed-menu/experiment-link/experiment-link.component';
import { FileExplorerComponent } from './file-explorer/file-explorer.component';
import { RingLoaderComponent } from './ring-loader/ring-loader.component';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationToastComponent } from './ui-menu/notification-toast/notification-toast.component';
import { NotificationService } from '../services/notification.service';

const PHOENIX_COMPONENTS: Type<any>[] = [
  NotificationToastComponent,
  NavComponent,
  UiMenuWrapperComponent,
  UiMenuComponent,
  MoreInfoComponent,
  CollectionsInfoComponent,
  GeometryBrowserComponent,
  GeometryBrowserOverlayComponent,
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
  CartesianGridConfigComponent,
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
  DownloadAnimationDialogComponent,
  AnimateEventComponent,
  VrToggleComponent,
  ArToggleComponent,
  SSModeComponent,
  MakePictureComponent,
  PerformanceToggleComponent,
  LoaderComponent,
  ShareLinkComponent,
  ShareLinkDialogComponent,
  EmbedMenuComponent,
  ExperimentLinkComponent,
  EventDataExplorerComponent,
  EventDataExplorerDialogComponent,
  FileExplorerComponent,
  RingLoaderComponent,
  CycleEventsComponent,
  EventBrowserComponent,
  EventBrowserOverlayComponent,
  EtaPhiPanelComponent,
  EtaPhiPanelOverlayComponent,
  KinematicsPanelComponent,
  KinematicsPanelOverlayComponent,
  MasterclassPanelComponent,
  MasterclassPanelOverlayComponent,
  SessionPillComponent,
];

@NgModule({
  declarations: PHOENIX_COMPONENTS,
  imports: [
    MatSnackBarModule,
    AttributePipe, // Correct: standalone items must be in imports
    CommonModule,
    RouterModule,
    DragDropModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    OverlayModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatRadioModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatIconModule,
    CdkTreeModule,
    MatTabsModule,
    MatProgressBarModule,
  ],
  exports: [
    ...PHOENIX_COMPONENTS,
    AttributePipe, // Export it so components in other modules can use it
  ],
  providers: [
    NotificationService,
    EventDisplayService,
    ErrorMessageService,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
})
export class PhoenixUIModule {}
