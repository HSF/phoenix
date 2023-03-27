import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeometryBrowserComponent } from './geometry-browser.component';

describe('GeometryBrowserComponent', () => {
  let component: GeometryBrowserComponent;
  let fixture: ComponentFixture<GeometryBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeometryBrowserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeometryBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
