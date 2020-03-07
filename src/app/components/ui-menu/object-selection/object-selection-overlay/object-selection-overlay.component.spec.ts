import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectSelectionOverlayComponent } from './object-selection-overlay.component';

describe('ObjectSelectionOverlayComponent', () => {
  let component: ObjectSelectionOverlayComponent;
  let fixture: ComponentFixture<ObjectSelectionOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectSelectionOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectSelectionOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
