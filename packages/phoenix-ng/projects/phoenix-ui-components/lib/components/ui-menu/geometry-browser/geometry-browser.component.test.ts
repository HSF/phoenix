import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeometryBrowserComponent } from './geometry-browser.component';
import { Overlay } from '@angular/cdk/overlay';
import {
  GeometryBrowserOverlayComponent,
  PhoenixUIModule,
} from 'phoenix-ui-components';
import { ComponentPortal } from '@angular/cdk/portal';

describe('GeometryBrowserComponent', () => {
  let component: GeometryBrowserComponent;
  let fixture: ComponentFixture<GeometryBrowserComponent>;

  const mockOverlay = {
    create: jest.fn().mockReturnThis(),
    attach: jest.fn().mockReturnThis(),
    overlayWindow: jest.fn().mockReturnThis(),
    instance: {
      enableHighlighting: jest.fn(),
    },
    destroy: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [GeometryBrowserComponent, GeometryBrowserOverlayComponent],
      providers: [
        {
          provide: Overlay,
          useValue: mockOverlay,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GeometryBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create and initialise the overlay', () => {
    const overlayRef = mockOverlay.create();
    const overlayPortal = new ComponentPortal(GeometryBrowserOverlayComponent);

    mockOverlay.overlayWindow = overlayRef.attach(overlayPortal);

    component.ngOnInit();

    expect(component.overlayWindow).toBeTruthy();

    component.ngOnDestroy();
    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });

  it('should toggle geometry browser overlay', () => {
    expect(component.browseDetectorParts).toBe(false);

    component.toggleOverlay();

    expect(component.browseDetectorParts).toBe(true);

    // Expect overlay window to be visible
    expect(component.overlayWindow.instance.browseDetectorParts).toBe(true);

    expect(
      component.overlayWindow.instance.enableHighlighting,
    ).toHaveBeenCalled();
  });
});
