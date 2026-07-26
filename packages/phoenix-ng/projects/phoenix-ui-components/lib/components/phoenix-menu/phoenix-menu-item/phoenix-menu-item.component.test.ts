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
      [],
    );
  });

  it('should detect compact options nodes', () => {
    const optionsNode = component.currentNode.addChild(
      'Color Options',
      undefined,
      'color-options',
    );
    optionsNode.addConfig({
      type: 'button',
      label: 'Random',
      onClick: () => {},
    });

    // A leaf with only configs and an icon is compact.
    expect(component.isCompactOptionsNode(optionsNode)).toBe(true);

    // Nodes with a toggle, children, no configs or no icon are not.
    const toggleNode = component.currentNode.addChild(
      'Collection',
      () => {},
      'color-options',
    );
    toggleNode.addConfig({
      type: 'button',
      label: 'Random',
      onClick: () => {},
    });
    expect(component.isCompactOptionsNode(toggleNode)).toBe(false);
    expect(component.isCompactOptionsNode(component.currentNode)).toBe(false);
  });

  it('should partition children into compact and regular ones', () => {
    const optionsNode = component.currentNode.addChild(
      'Draw Options',
      undefined,
      'draw-options',
    );
    optionsNode.addConfig({ type: 'button', label: 'Test', onClick: () => {} });
    const regularNode = component.currentNode.addChild('Collection', () => {});

    expect(component.compactChildren).toEqual([optionsNode]);
    expect(component.regularChildren).toEqual([regularNode]);
  });

  it('should shorten the compact label', () => {
    component.currentNode.name = 'Draw Options';
    expect(component.compactLabel).toBe('Draw');

    component.currentNode.name = 'Something Else';
    expect(component.compactLabel).toBe('Something Else');
  });
});
