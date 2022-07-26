import {
  async,
  ComponentFixture,
  TestBed,
  fakeAsync,
} from '@angular/core/testing';

import { TrackmlComponent } from './trackml.component';
import { EventDisplayService } from 'phoenix-ui-components';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AppModule } from '../../app.module';

describe('TrackmlComponent', () => {
  let component: TrackmlComponent;
  let http: HttpClient;
  let fixture: ComponentFixture<TrackmlComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [EventDisplayService, HttpClient],
      declarations: [TrackmlComponent],
    }).compileComponents;
    http = TestBed.get(HttpClient);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test if event data is processed
  it('should process event data', fakeAsync(() => {
    spyOn<any>(component, 'loadHits').and.callThrough();
    spyOn<any>(component, 'loadParticles').and.callThrough();
    spyOn<any>(component, 'loadTruth').and.callThrough();

    // Calling a fake implementation of `loadTrackMLData`
    spyOn<any>(component, 'loadTrackMLData').and.callFake(() => {
      (component as any).loadHits(`hit_id,x,y,z,volume_id,layer_id,module_id
      1,-64.4099,-7.1637,-1502.5,7,2,1
      2,-55.3361,0.635342,-1502.5,7,2,1`);
      (component as any).loadParticles(`particle_id,vx,vy,vz,px,py,pz,q,nhits
      4503668346847232,-0.00928816,0.00986098,-0.0778789,-0.0552689,0.323272,-0.203492,-1,8
      4503737066323968,-0.00928816,0.00986098,-0.0778789,-0.948125,0.470892,2.01006,1,11`);
      (component as any)
        .loadTruth(`hit_id,particle_id,tx,ty,tz,tpx,tpy,tpz,weight
      1,0,-64.4116,-7.16412,-1502.5,250710,-149908,-956385,     0
      2,22525763437723648,-55.3385,0.630805,-1502.5,-0.570605,0.0283904,-15.4922,9.86408e-06`);
    });

    // Testing by using a mock value from http get (not valid for every type of event data)
    // spyOn(http, 'get').and.returnValue(of(`hit_id,x,y,z,volume_id,layer_id,module_id
    // 1,-64.4099,-7.1637,-1502.5,7,2,1
    // 2,-55.3361,0.635342,-1502.5,7,2,1`));

    component.ngOnInit();

    expect((component as any).loadTrackMLData).toHaveBeenCalled();
    expect((component as any).loadHits).toHaveBeenCalled();
    expect((component as any).loadParticles).toHaveBeenCalled();
    expect((component as any).loadTruth).toHaveBeenCalled();
  }));

  it('should load TrackML data', () => {
    spyOn<any>(component, 'loadTrackMLData').and.callThrough();
    spyOn(http, 'get').and.returnValue(
      of(`hit_id,x,y,z,volume_id,layer_id,module_id
    1,-64.4099,-7.1637,-1502.5,7,2,1
    2,-55.3361,0.635342,-1502.5,7,2,1`)
    );
    component.ngOnInit();

    expect((component as any).loadTrackMLData).toHaveBeenCalled();
  });
});
