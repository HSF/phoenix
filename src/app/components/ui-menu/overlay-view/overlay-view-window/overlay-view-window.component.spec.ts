import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayViewWindowComponent } from './overlay-view-window.component';

describe('OverlayViewWindowComponent', () => {
  let component: OverlayViewWindowComponent;
  let fixture: ComponentFixture<OverlayViewWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
});
