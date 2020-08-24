import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomControlsComponent } from './zoom-controls.component';
import { AppModule } from 'src/app/app.module';
import { EventdisplayService } from '../../../services/eventdisplay.service';

describe('ZoomControlsComponent', () => {
  let component: ZoomControlsComponent;
  let fixture: ComponentFixture<ZoomControlsComponent>;

  let mockEventdisplayService: any;

  beforeEach(async(() => {
    mockEventdisplayService = jasmine.createSpyObj('EventdisplayService', ['zoomTo']);

    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventdisplayService,
        useValue: mockEventdisplayService
      }],
      declarations: [ZoomControlsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should zoom in event display', () => {
    component.zoomIn(true);
    expect(mockEventdisplayService.zoomTo).toHaveBeenCalled();
  });

  it('should not zoom in event display', () => {
    component.zoomIn(false);
    expect(mockEventdisplayService.zoomTo).toHaveBeenCalledTimes(0);
  });

  it('should zoom out event display', () => {
    component.zoomOut(true);
    expect(mockEventdisplayService.zoomTo).toHaveBeenCalled();
  });

  it('should not zoom out event display', () => {
    component.zoomOut(false);
    expect(mockEventdisplayService.zoomTo).toHaveBeenCalledTimes(0);
  });

  it('should clear zoom acceleration', () => {
    component.zoomIn(true);
    expect((component as any).zoomTime).toBeLessThan(200);
    component.clearZoom();
    expect((component as any).zoomTime).toEqual(200);
  });
});
