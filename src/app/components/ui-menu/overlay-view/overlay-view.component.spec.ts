import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayViewComponent } from './overlay-view.component';

describe('OverlayViewComponent', () => {
  let component: OverlayViewComponent;
  let fixture: ComponentFixture<OverlayViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverlayViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
