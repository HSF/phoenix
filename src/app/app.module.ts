import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { GeometryComponent } from './sections/geometry/geometry.component';
import { AtlasComponent } from './sections/atlas/atlas.component';
import { LHCbComponent } from './sections/lhcb/lhcb.component';
import { TrackmlComponent } from './sections/trackml/trackml.component';
import { NavComponent } from './components/nav/nav.component';
import { RouterModule, Routes } from '@angular/router';
import { PlaygroundComponent } from './sections/playground/playground.component';
import { PlaygroundVrComponent } from './sections/playground-vr/playground-vr.component';
import { AttributePipe } from './services/extras/attribute.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { UiMenuComponent } from './components/ui-menu/ui-menu.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { CollectionsInfoComponent } from './components/ui-menu/collections-info/collections-info.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { MenuToggleComponent } from './components/ui-menu/menu-toggle/menu-toggle.component';
import { CollectionsInfoOverlayComponent } from './components/ui-menu/collections-info/collections-info-overlay/collections-info-overlay.component';
import { IoOptionsComponent } from './components/ui-menu/io-options/io-options.component';
import { IOOptionsDialogComponent } from './components/ui-menu/io-options/io-options-dialog/io-options-dialog.component';
import { OverlayViewComponent } from './components/ui-menu/overlay-view/overlay-view.component';
import { ObjectSelectionComponent } from './components/ui-menu/object-selection/object-selection.component';
import { ObjectSelectionOverlayComponent } from './components/ui-menu/object-selection/object-selection-overlay/object-selection-overlay.component';
import { EventSelectorComponent } from './components/ui-menu/event-selector/event-selector.component';
import { ObjectClippingComponent } from './components/ui-menu/object-clipping/object-clipping.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DarkThemeComponent } from './components/ui-menu/dark-theme/dark-theme.component';
import { AutoRotateComponent } from './components/ui-menu/auto-rotate/auto-rotate.component';
import { ViewOptionsComponent } from './components/ui-menu/view-options/view-options.component';
import { OverlayViewWindowComponent } from './components/ui-menu/overlay-view/overlay-view-window/overlay-view-window.component';
import { ExperimentInfoComponent } from './components/ui-menu/experiment-info/experiment-info.component';
import { InfoPanelComponent } from './components/ui-menu/info-panel/info-panel.component';
import { InfoPanelOverlayComponent } from './components/ui-menu/info-panel/info-panel-overlay/info-panel-overlay.component';
import { OverlayComponent } from './components/ui-menu/overlay/overlay.component';
import { MainViewToggleComponent } from './components/ui-menu/main-view-toggle/main-view-toggle.component';
import { ZoomControlsComponent } from './components/ui-menu/zoom-controls/zoom-controls.component';
import { TracerMenuComponent } from './components/ui-menu/tracer-menu/tracer-menu.component';
import { MatIconModule } from '@angular/material/icon';
import { TracerMenuItemComponent } from './components/ui-menu/tracer-menu/tracer-menu-item/tracer-menu-item.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'geometry', component: GeometryComponent },
  { path: 'atlas', component: AtlasComponent },
  { path: 'lhcb', component: LHCbComponent },
  { path: 'trackml', component: TrackmlComponent },
  { path: 'playground', component: PlaygroundComponent },
  { path: 'playgroundVR', component: PlaygroundVrComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GeometryComponent,
    AtlasComponent,
    LHCbComponent,
    TrackmlComponent,
    NavComponent,
    PlaygroundComponent,
    PlaygroundVrComponent,
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
    TracerMenuComponent,
    TracerMenuItemComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    DragDropModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    OverlayModule,
    MatMenuModule,
    MatSliderModule,
    MatCheckboxModule,
    MatIconModule
  ],
  entryComponents: [
    IOOptionsDialogComponent,
    CollectionsInfoOverlayComponent,
    ObjectSelectionOverlayComponent,
    InfoPanelOverlayComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
