import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {GeometryComponent} from './geometry/geometry.component';
import {HomeComponent} from './home/home.component';
import {TrackmlComponent} from './trackml/trackml.component';
import {AtlasComponent} from './atlas/atlas.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'geometry', component: GeometryComponent },
  { path: 'atlas', component: AtlasComponent },
  { path: 'trackml', component: TrackmlComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {

}
