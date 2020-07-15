import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoenixMenuItemComponent } from './phoenix-menu-item.component';

describe('PhoenixMenuItemComponent', () => {
  let component: PhoenixMenuItemComponent;
  let fixture: ComponentFixture<PhoenixMenuItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhoenixMenuItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoenixMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
