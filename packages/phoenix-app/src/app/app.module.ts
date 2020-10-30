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
import { PhoenixUIModule } from 'phoenix-ui';
import { RouterModule, Routes } from '@angular/router';
import { PlaygroundComponent } from './sections/playground/playground.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes, { useHash: true }),
    BrowserAnimationsModule,
    PhoenixUIModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
