import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPanelComponent } from './info-panel.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { ComponentPortal } from '@angular/cdk/portal';

describe.skip('InfoPanelComponent', () => {
  let component: InfoPanelComponent;
  let fixture: ComponentFixture<InfoPanelComponent>;

  const mockOverlay = {
    create: jest.fn().mockReturnValue(OverlayRef),
    attach: jest.fn(),
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
    const overlayRef: OverlayRef = mockOverlay.create() as OverlayRef;
    const overlayPortal = new ComponentPortal(InfoPanelComponent);
    const overlayWindow = overlayRef.attach(overlayPortal);
  });

  it.only('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize/create info panel overlay', () => {
    component.ngOnInit();

    expect(component.overlayWindow).toBeTruthy();
  });

  it('should toggle info panel overlay', () => {
    expect(component.showInfoPanel).toBeFalsy();

    component.toggleOverlay();

    expect(component.showInfoPanel).toBeTruthy();

    // Expect the overlay window to be visible
    expect(component.overlayWindow.instance.showInfoPanel).toBeTruthy();
  });

  it('should destroy info panel overlay', () => {
    jest.spyOn(component.overlayWindow, 'destroy');

    component.ngOnDestroy();

    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });
});
