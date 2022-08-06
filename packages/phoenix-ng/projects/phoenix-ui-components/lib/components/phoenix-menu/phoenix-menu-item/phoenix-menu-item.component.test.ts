import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoenixMenuItemComponent } from './phoenix-menu-item.component';
import { PhoenixMenuNode } from 'phoenix-event-display';
import { PhoenixMenuConfigs } from 'phoenix-event-display/src/managers/ui-manager/phoenix-menu/config-types';
import { ConfigLabel } from '../../../../../../../phoenix-event-display/src/managers/ui-manager/phoenix-menu/config-types';

describe('PhoenixMenuItemComponent', () => {
  let component: PhoenixMenuItemComponent;
  let fixture: ComponentFixture<PhoenixMenuItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PhoenixMenuItemComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoenixMenuItemComponent);
    component = fixture.componentInstance;
    component.currentNode = new PhoenixMenuNode('Test Node');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate configTop', () => {
    expect(component.configTop).toBeUndefined();
    component.calculateConfigTop();
    expect(component.configTop).toBe(0);
  });

  it('should cast configs to any', () => {
    expect(component.castConfigsToAny(component.currentNode.configs)).toEqual(
      []
    );
  });
});
