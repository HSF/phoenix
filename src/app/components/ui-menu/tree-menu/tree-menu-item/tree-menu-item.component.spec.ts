import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeMenuItemComponent } from './tree-menu-item.component';

describe('TreeMenuItemComponent', () => {
  let component: TreeMenuItemComponent;
  let fixture: ComponentFixture<TreeMenuItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeMenuItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
