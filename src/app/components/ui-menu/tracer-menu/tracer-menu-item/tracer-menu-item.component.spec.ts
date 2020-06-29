import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TracerMenuItemComponent } from './tracer-menu-item.component';

describe('TracerMenuItemComponent', () => {
  let component: TracerMenuItemComponent;
  let fixture: ComponentFixture<TracerMenuItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TracerMenuItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TracerMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
