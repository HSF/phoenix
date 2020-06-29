import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TracerMenuComponent } from './tracer-menu.component';

describe('TracerMenuComponent', () => {
  let component: TracerMenuComponent;
  let fixture: ComponentFixture<TracerMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TracerMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TracerMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
