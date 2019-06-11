import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeometryComponent } from './geometry.component';

describe('GeometryComponent', () => {
  let component: GeometryComponent;
  let fixture: ComponentFixture<GeometryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeometryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeometryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
