import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayViewWindowComponent } from './overlay-view-window.component';
import { AppModule } from 'src/app/app.module';
import { UIService } from '../../../../services/ui.service';
import { EventdisplayService } from '../../../../services/eventdisplay.service';
import { ElementRef } from '@angular/core';
import { ThreeService } from '../../../../services/three.service';

describe('OverlayViewWindowComponent', () => {
  let component: OverlayViewWindowComponent;
  let fixture: ComponentFixture<OverlayViewWindowComponent>;

  const mockUIService = jasmine.createSpyObj('UIService',
    ['setOverlayRenderer', 'toggleOrthographicView']);
  const mockEventdisplayService = jasmine.createSpyObj('EventdisplayDisplay',
    ['fixOverlayView']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventdisplayService,
        useValue: mockEventdisplayService
      }, {
        provide: UIService,
        useValue: mockUIService
      }],
      declarations: [OverlayViewWindowComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayViewWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize overlay view window canvas', () => {
    spyOn(component, 'initializeCanvas').and.callThrough();

    const mockCanvasElement = new ElementRef(document.createElement('canvas'));
    component.overlayWindow = mockCanvasElement;

    component.ngAfterViewInit();

    expect(component.initializeCanvas).toHaveBeenCalledWith(mockCanvasElement.nativeElement);
    expect(mockUIService.setOverlayRenderer).toHaveBeenCalledWith(mockCanvasElement.nativeElement);
  });

  it('should switch view of overlay view window', () => {
    expect(component.orthographicView).toBe(false);
    component.switchOverlayView();
    expect(component.orthographicView).toBe(true);
  });

  it('should fix overlay view', () => {
    expect(component.overlayViewFixed).toBe(false);
    component.fixOverlayView();
    expect(component.overlayViewFixed).toBe(true);
  });
});
