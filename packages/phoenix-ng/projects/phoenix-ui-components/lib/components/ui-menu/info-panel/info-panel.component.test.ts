import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPanelComponent } from './info-panel.component';
import { Overlay } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { ComponentPortal } from '@angular/cdk/portal';

describe('InfoPanelComponent', () => {
  let component: InfoPanelComponent;
  let fixture: ComponentFixture<InfoPanelComponent>;

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
      declarations: [InfoPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize/create info panel overlay', () => {
    const overlayRef = mockOverlay.create();
    const overlayPortal = new ComponentPortal(InfoPanelComponent);

    mockOverlay.overlayWindow = overlayRef.attach(overlayPortal);

    component.ngOnInit();

    expect(component.overlayWindow).toBeTruthy();
  });

  it('should toggle info panel overlay', () => {
    expect(component.showInfoPanel).toBe(false);

    component.toggleOverlay();

    expect(component.showInfoPanel).toBe(true);

    // Expect the overlay window to be visible
    expect(component.overlayWindow.instance.showInfoPanel).toBe(true);
  });

  it('should destroy info panel overlay', () => {
    jest.spyOn(component.overlayWindow, 'destroy');

    component.ngOnDestroy();

    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });
});
