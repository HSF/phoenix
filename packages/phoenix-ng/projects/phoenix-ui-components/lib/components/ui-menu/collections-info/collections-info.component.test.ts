import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsInfoComponent } from './collections-info.component';
import { Overlay } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { ComponentPortal } from '@angular/cdk/portal';
import { CollectionsInfoOverlayComponent } from 'phoenix-ui-components';

describe('CollectionsInfoComponent', () => {
  let component: CollectionsInfoComponent;
  let fixture: ComponentFixture<CollectionsInfoComponent>;

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
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize/create collections info overlay', () => {
    const overlayRef = mockOverlay.create();
    const overlayPortal = new ComponentPortal(CollectionsInfoOverlayComponent);

    mockOverlay.overlayWindow = overlayRef.attach(overlayPortal);

    component.ngOnInit();

    expect(component.overlayWindow).toBeTruthy();

    component.ngOnDestroy();
    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });

  it('should toggle collections info overlay', () => {
    expect(component.showObjectsInfo).toBe(false);

    component.toggleOverlay();

    expect(component.showObjectsInfo).toBe(true);

    // Expect the overlay window to be visible
    expect(component.overlayWindow.instance.showObjectsInfo).toBe(true);
  });
});
