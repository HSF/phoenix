import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { Task1Component } from './task1/task1.component';
import { HomeComponent } from './home/home.component';
import { GeometryComponent } from './geometry/geometry.component';
import { AtlasComponent } from './atlas/atlas.component';
import { TrackmlComponent } from './trackml/trackml.component';
import { AppRoutingModule } from './app-routing.module';
import { NavComponent } from './nav/nav.component';

@NgModule({
  declarations: [
    AppComponent,
    Task1Component,
    HomeComponent,
    GeometryComponent,
    AtlasComponent,
    TrackmlComponent,
    NavComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
