import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoenixMenuItemComponent } from './phoenix-menu-item.component';
import { PhoenixMenuNode } from '../phoenix-menu-node/phoenix-menu-node';

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
    component.currentNode = new PhoenixMenuNode('Test Node');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
