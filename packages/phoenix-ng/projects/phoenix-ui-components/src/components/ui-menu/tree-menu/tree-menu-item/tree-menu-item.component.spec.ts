import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeMenuItemComponent } from './tree-menu-item.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('TreeMenuItemComponent', () => {
  let component: TreeMenuItemComponent;
  let fixture: ComponentFixture<TreeMenuItemComponent>;

  const mockEventDisplay = {
    getUIManager: () =>
      jasmine.createSpyObj('UIManager', ['geometryVisibility']),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [TreeMenuItemComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.node = { name: 'TestNode', geometryId: 'abcd1234', children: [] };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle self visibility', () => {
    expect(component.visible).toBe(true);
    component.toggleVisibility(false);
    expect(component.visible).toBe(false);
  });

  it('should toggle children visibility', () => {
    // Creating a mock child tree menu item
    const mockChildTreeMenuItem = jasmine.createSpyObj(
      'TreeMenuItemComponent',
      ['toggleVisibility']
    );
    (component as any).children = [mockChildTreeMenuItem];

    component.toggleVisibility(true);

    expect(mockChildTreeMenuItem.toggleVisibility).toHaveBeenCalled();
  });
});
