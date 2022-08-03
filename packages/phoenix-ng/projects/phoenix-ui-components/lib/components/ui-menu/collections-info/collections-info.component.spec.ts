import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsInfoComponent } from './collections-info.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { ComponentRef } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { CollectionsInfoOverlayComponent } from 'phoenix-ui-components';

describe.skip('CollectionsInfoComponent', () => {
  let component: CollectionsInfoComponent;
  let fixture: ComponentFixture<CollectionsInfoComponent>;

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
      declarations: [CollectionsInfoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsInfoComponent);
    component = fixture.componentInstance;
    //fixture.detectChanges();
  });

  it.only('should initialize/create collections info overlay', () => {
    const overlayRef: OverlayRef = mockOverlay.create();
    const overlayPortal = new ComponentPortal(CollectionsInfoOverlayComponent);
    let overlayWindow: ComponentRef<CollectionsInfoOverlayComponent>;
    overlayRef.attach = jest.fn();
    component.overlayWindow = overlayRef.attach(
      overlayPortal
    ) as typeof overlayWindow;

    console.log(component.overlayWindow);
    component.ngOnInit();
    expect(component.overlayWindow).toBeTruthy();
  });

  it('should toggle collections info overlay', () => {
    expect(component.showObjectsInfo).toBeFalsy();
    component.toggleOverlay();
    expect(component.showObjectsInfo).toBeTruthy();

    // Expect the overlay window to be visible
    expect(component.overlayWindow.instance.showObjectsInfo).toBeTruthy();
  });
});
