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
import { CollectionsInfoComponent } from './components/ui-menu/collections-info/collections-info.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { MenuToggleComponent } from './components/ui-menu/menu-toggle/menu-toggle.component';
import { CollectionsInfoOverlayComponent } from './components/ui-menu/collections-info/collections-info-overlay/collections-info-overlay.component';
import { IoOptionsComponent } from './components/ui-menu/io-options/io-options.component';
import { IOOptionsDialogComponent } from './components/ui-menu/io-options/io-options-dialog/io-options-dialog.component';
import { OverlayViewComponent } from './components/ui-menu/overlay-view/overlay-view.component';

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
    OverlayViewComponent
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
    OverlayModule
  ],
  entryComponents: [
    IOOptionsDialogComponent,
    CollectionsInfoOverlayComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
