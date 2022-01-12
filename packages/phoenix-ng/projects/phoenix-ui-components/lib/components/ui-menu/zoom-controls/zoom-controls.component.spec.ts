import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomControlsComponent } from './zoom-controls.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('ZoomControlsComponent', () => {
  let component: ZoomControlsComponent;
  let fixture: ComponentFixture<ZoomControlsComponent>;

  let mockEventDisplayService: any;

  beforeEach(() => {
    mockEventDisplayService = jasmine.createSpyObj('EventDisplayService', [
      'zoomTo',
    ]);

    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplayService,
        },
      ],
      declarations: [ZoomControlsComponent],
    }).compileComponents();
  });

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
    expect(mockEventDisplayService.zoomTo).toHaveBeenCalled();
  });

  it('should not zoom in event display', () => {
    component.zoomIn(false);
    expect(mockEventDisplayService.zoomTo).toHaveBeenCalledTimes(0);
  });

  it('should zoom out event display', () => {
    component.zoomOut(true);
    expect(mockEventDisplayService.zoomTo).toHaveBeenCalled();
  });

  it('should not zoom out event display', () => {
    component.zoomOut(false);
    expect(mockEventDisplayService.zoomTo).toHaveBeenCalledTimes(0);
  });

  it('should clear zoom acceleration', () => {
    component.zoomIn(true);
    expect((component as any).zoomTime).toBeLessThan(200);
    component.clearZoom();
    expect((component as any).zoomTime).toEqual(200);
  });
});
