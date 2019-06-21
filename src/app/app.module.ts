import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';

import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {GeometryComponent} from './geometry/geometry.component';
import {AtlasComponent} from './atlas/atlas.component';
import {TrackmlComponent} from './trackml/trackml.component';
import {NavComponent} from './nav/nav.component';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'home', component: HomeComponent},
  {path: 'geometry', component: GeometryComponent},
  {path: 'atlas', component: AtlasComponent},
  {path: 'trackml', component: TrackmlComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GeometryComponent,
    AtlasComponent,
    TrackmlComponent,
    NavComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
