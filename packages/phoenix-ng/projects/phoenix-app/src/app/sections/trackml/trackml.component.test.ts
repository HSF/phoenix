import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';

import { TrackmlComponent } from './trackml.component';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AppModule } from '../../app.module';

describe('TrackmlComponent', () => {
  let component: TrackmlComponent;
  let http: HttpClient;
  let fixture: ComponentFixture<TrackmlComponent>;

  const mockEventDisplay = {
    init: jest.fn(),
    getStateManager: jest.fn().mockReturnThis(),
    clippingEnabled: jest.fn().mockReturnThis(),
    startClippingAngle: jest.fn().mockReturnThis(),
    openingClippingAngle: jest.fn().mockReturnThis(),
    loadOBJGeometry: jest.fn(),
    getLoadingManager: jest.fn().mockReturnThis(),
    addProgressListener: jest.fn().mockImplementation(() => {
      component.loadingProgress = 100;
    }),
    addLoadListenerWithCheck: jest.fn().mockImplementation(() => {
      component.loaded = true;
    }),
    listenToLoadedEventsChange: jest.fn(),
    getUIManager: jest.fn().mockReturnThis(),
    getPresetViews: jest.fn().mockReturnThis().mockReturnValue([]),
    getDarkTheme: jest.fn().mockReturnThis(),
    buildEventDataFromJSON: jest.fn(),
    setOverlayRenderer: jest.fn().mockReturnThis(),
    allowSelection: jest.fn().mockReturnThis(),
    getInfoLogger: jest.fn().mockReturnThis(),
    getInfoLoggerList: jest.fn().mockReturnThis(),
  };

  const mockStateManager = mockEventDisplay.getStateManager();
  mockStateManager.clippingEnabled.onUpdate = jest.fn();
  mockStateManager.startClippingAngle.onUpdate = jest.fn();
  mockStateManager.openingClippingAngle.onUpdate = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    }).compileComponents();
    http = TestBed.get(HttpClient);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test if event data is processed
  it('should process event data', fakeAsync(() => {
    jest.spyOn<any, any>(component, 'loadHits');
    jest.spyOn<any, any>(component, 'loadParticles');
    jest.spyOn<any, any>(component, 'loadTruth');

    // Calling a fake implementation of `loadTrackMLData`
    jest
      .spyOn<any, any>(component, 'loadTrackMLData')
      .mockImplementation(() => {
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
    jest.spyOn<any, any>(component, 'loadTrackMLData');
    jest.spyOn(http, 'get').mockReturnValue(
      of(`hit_id,x,y,z,volume_id,layer_id,module_id
    1,-64.4099,-7.1637,-1502.5,7,2,1
    2,-55.3361,0.635342,-1502.5,7,2,1`)
    );
    component.ngOnInit();

    expect((component as any).loadTrackMLData).toHaveBeenCalled();
  });
});
