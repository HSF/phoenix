import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuToggleComponent } from './menu-toggle.component';

describe('MenuToggleComponent', () => {
  let component: MenuToggleComponent;
  let fixture: ComponentFixture<MenuToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MenuToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
