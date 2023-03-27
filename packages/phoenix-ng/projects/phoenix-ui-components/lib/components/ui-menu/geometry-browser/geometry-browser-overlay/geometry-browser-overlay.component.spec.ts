import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeometryBrowserOverlayComponent } from './geometry-browser-overlay.component';

describe('GeometryBrowserOverlayComponent', () => {
  let component: GeometryBrowserOverlayComponent;
  let fixture: ComponentFixture<GeometryBrowserOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeometryBrowserOverlayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeometryBrowserOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
