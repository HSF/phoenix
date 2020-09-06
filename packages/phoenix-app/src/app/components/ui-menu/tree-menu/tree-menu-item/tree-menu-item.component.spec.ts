import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeMenuItemComponent } from './tree-menu-item.component';
import { UIService } from '../../../../services/ui.service';
import { QueryList } from '@angular/core';
import { AppModule } from '../../../../app.module';

describe('TreeMenuItemComponent', () => {
  let component: TreeMenuItemComponent;
  let fixture: ComponentFixture<TreeMenuItemComponent>;

  const mockUIService: UIService = jasmine.createSpyObj('UIService', ['geometryVisibility']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: UIService,
        useValue: mockUIService
      }],
      declarations: [TreeMenuItemComponent]
    })
      .compileComponents();
  }));

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
    const mockChildTreeMenuItem = jasmine.createSpyObj('TreeMenuItemComponent', ['toggleVisibility']);
    (component as any).children = [mockChildTreeMenuItem];

    component.toggleVisibility(true);

    expect(mockChildTreeMenuItem.toggleVisibility).toHaveBeenCalled();
  });
});
