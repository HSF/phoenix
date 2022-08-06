import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayViewComponent } from './overlay-view.component';
import { Overlay } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { ComponentPortal } from '@angular/cdk/portal';

describe('OverlayViewComponent', () => {
  let component: OverlayViewComponent;
  let fixture: ComponentFixture<OverlayViewComponent>;

  const mockOverlay = {
    create: jest.fn().mockReturnThis(),
    attach: jest.fn().mockReturnThis(),
    overlayWindow: jest.fn().mockReturnThis(),
    instance: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: Overlay,
          useValue: mockOverlay,
        },
      ],
      declarations: [OverlayViewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize/create overlay view', () => {
    const overlayRef = mockOverlay.create();
    const overlayPortal = new ComponentPortal(OverlayViewComponent);

    mockOverlay.overlayWindow = overlayRef.attach(overlayPortal);

    component.ngOnInit();

    expect(component.overlayWindow).toBeTruthy();
  });

  it('should toggle overlay view', () => {
    expect(component.showOverlay).toBe(false);

    component.toggleOverlay();

    expect(component.showOverlay).toBe(true);

    // Expect the overlay window to be visible
    expect(component.overlayWindow.instance.showOverlay).toBe(true);
  });

  it('should destroy overlay view', () => {
    jest.spyOn(component.overlayWindow, 'destroy').mockImplementation(() => {});

    component.ngOnDestroy();

    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });
});
