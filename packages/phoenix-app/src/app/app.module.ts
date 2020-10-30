import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { GeometryComponent } from './sections/geometry/geometry.component';
import { AtlasComponent } from './sections/atlas/atlas.component';
import { LHCbComponent } from './sections/lhcb/lhcb.component';
import { CMSComponent } from './sections/cms/cms.component';
import { TrackmlComponent } from './sections/trackml/trackml.component';
import { NavComponent } from 'phoenix-ui';
import { RouterModule, Routes } from '@angular/router';
import { PlaygroundComponent } from './sections/playground/playground.component';
import { AttributePipe } from 'phoenix-ui';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { UiMenuComponent } from 'phoenix-ui';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CollectionsInfoComponent } from 'phoenix-ui';
import { OverlayModule } from '@angular/cdk/overlay';
import { MenuToggleComponent } from 'phoenix-ui';
import { CollectionsInfoOverlayComponent } from 'phoenix-ui';
import { IoOptionsComponent } from 'phoenix-ui';
import { IOOptionsDialogComponent } from 'phoenix-ui';
import { OverlayViewComponent } from 'phoenix-ui';
import { ObjectSelectionComponent } from 'phoenix-ui';
import { ObjectSelectionOverlayComponent } from 'phoenix-ui';
import { EventSelectorComponent } from 'phoenix-ui';
import { ObjectClippingComponent } from 'phoenix-ui';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DarkThemeComponent } from 'phoenix-ui';
import { AutoRotateComponent } from 'phoenix-ui';
import { ViewOptionsComponent } from 'phoenix-ui';
import { OverlayViewWindowComponent } from 'phoenix-ui';
import { ExperimentInfoComponent } from 'phoenix-ui';
import { InfoPanelComponent } from 'phoenix-ui';
import { InfoPanelOverlayComponent } from 'phoenix-ui';
import { OverlayComponent } from 'phoenix-ui';
import { MainViewToggleComponent } from 'phoenix-ui';
import { ZoomControlsComponent } from 'phoenix-ui';
import { TreeMenuComponent } from 'phoenix-ui';
import { MatIconModule } from '@angular/material/icon';
import { TreeMenuItemComponent } from 'phoenix-ui';
import { PhoenixMenuComponent } from 'phoenix-ui';
import { PhoenixMenuItemComponent } from 'phoenix-ui';
import { ConfigSliderComponent } from 'phoenix-ui';
import { AnimateCameraComponent } from 'phoenix-ui';
import { AnimateEventComponent } from 'phoenix-ui';
import { VrToggleComponent } from 'phoenix-ui';
import { Ng5SliderModule } from 'ng5-slider';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'geometry', component: GeometryComponent },
  { path: 'atlas', component: AtlasComponent },
  { path: 'lhcb', component: LHCbComponent },
  { path: 'cms', component: CMSComponent },
  { path: 'trackml', component: TrackmlComponent },
  { path: 'playground', component: PlaygroundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GeometryComponent,
    AtlasComponent,
    LHCbComponent,
    CMSComponent,
    TrackmlComponent,
    NavComponent,
    PlaygroundComponent,
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
    HttpClientModule,
    DragDropModule,
    RouterModule.forRoot(routes, { useHash: true }),
    BrowserAnimationsModule,
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
  bootstrap: [AppComponent]
})
export class AppModule { }
