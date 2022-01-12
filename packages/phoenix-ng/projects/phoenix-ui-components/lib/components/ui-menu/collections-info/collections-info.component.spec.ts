import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsInfoComponent } from './collections-info.component';
import { Overlay } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('CollectionsInfoComponent', () => {
  let component: CollectionsInfoComponent;
  let fixture: ComponentFixture<CollectionsInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [Overlay],
      declarations: [CollectionsInfoComponent],
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
    component.ngOnInit();
    expect(component.overlayWindow).toBeTruthy();
  });

  it('should toggle collections info overlay', () => {
    expect(component.showObjectsInfo).toBe(false);
    component.toggleOverlay();
    expect(component.showObjectsInfo).toBe(true);

    // Expect the overlay window to be visible
    expect(component.overlayWindow.instance.showObjectsInfo).toBe(true);
  });

  it('should destroy collections info overlay', () => {
    spyOn(component.overlayWindow, 'destroy');

    component.ngOnDestroy();
    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });
});
