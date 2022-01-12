import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayViewComponent } from './overlay-view.component';
import { Overlay } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('OverlayViewComponent', () => {
  let component: OverlayViewComponent;
  let fixture: ComponentFixture<OverlayViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [Overlay],
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
    spyOn(component.overlayWindow, 'destroy');

    component.ngOnDestroy();
    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });
});
