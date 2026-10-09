import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { GeometryComponent } from './sections/geometry/geometry.component';
import { AtlasComponent } from './sections/atlas/atlas.component';
import { AtlasMasterclassComponent } from './sections/atlas-masterclass/atlas-masterclass.component';
import { LHCbComponent } from './sections/lhcb/lhcb.component';
import { VPToggleComponent } from './sections/lhcb/vp-toggle/vp-toggle.component';
import { CMSComponent } from './sections/cms/cms.component';
import { TrackmlComponent } from './sections/trackml/trackml.component';
import {
  PhoenixUIModule,
  provideAgentBridge,
  NL_ENGINE_FACTORY,
  type NlEngine,
  type NlEngineFactory,
  type NlProgress,
} from 'phoenix-ui-components';
import { RouterModule, type Routes } from '@angular/router';
import { PlaygroundComponent } from './sections/playground/playground.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';

// const routes: Routes;
const singleEvent = environment?.singleEvent;
// if (singleEvent) {
//   routes = [{ path: '', component: AtlasComponent }];
// } else {
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'geometry', component: GeometryComponent },
  { path: 'atlas', component: AtlasComponent },
  { path: 'atlas-masterclass', component: AtlasMasterclassComponent },
  { path: 'lhcb', component: LHCbComponent },
  { path: 'cms', component: CMSComponent },
  { path: 'trackml', component: TrackmlComponent },
  { path: 'playground', component: PlaygroundComponent },
];
// }

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GeometryComponent,
    AtlasComponent,
    AtlasMasterclassComponent,
    LHCbComponent,
    VPToggleComponent,
    CMSComponent,
    TrackmlComponent,
    PlaygroundComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    PhoenixUIModule,
  ],
  providers: [
    // Supply the in-browser natural-language model to the command palette's
    // "Ask" mode. The provider is dynamically imported so WebLLM (and its
    // import.meta worker wiring) stays out of the initial bundle AND out of
    // unit-test module graphs; the palette falls back to deterministic keyword
    // matching wherever this is unavailable (no WebGPU, or chunk load fails).
    {
      provide: NL_ENGINE_FACTORY,
      useValue: ((onProgress: (p: NlProgress) => void): Promise<NlEngine> =>
        import('./nl/webllm-engine.provider').then((m) =>
          m.createWebLlmEngineFactory()(onProgress),
        )) as NlEngineFactory,
    },
    // Agent bridge (#942/#826), owned by the application rather than by any
    // component: it is one listener over the one root event display, so it has
    // to outlive every route change and must not depend on the command palette
    // being rendered. It stays dormant unless this page was opened with the
    // loopback-only ?agent=1 switch; a deployment that wants a known embedder
    // to drive it passes origins here instead.
    provideAgentBridge(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
