import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeometryBrowserOverlayComponent } from './geometry-browser-overlay.component';
import { EventDisplayService, PhoenixUIModule } from 'phoenix-ui-components';
import { ActiveVariable } from 'phoenix-event-display';
import { Object3D, Object3DEventMap } from 'three';

describe('GeometryBrowserOverlayComponent', () => {
  let component: GeometryBrowserOverlayComponent;
  let fixture: ComponentFixture<GeometryBrowserOverlayComponent>;

  const mockChild1 = new Object3D();
  mockChild1.name = 'TestCollection';
  mockChild1.children = [new Object3D(), new Object3D()];

  const mockChild2 = new Object3D();
  mockChild2.name = 'TestCollection2';
  mockChild2.children = [new Object3D(), new Object3D()];
  const mockEventDisplay = {
    getActiveObjectId: () => ({
      onUpdate: (callback) => {
        callback();
      },
    }),
    enableHighlighting: jest.fn().mockReturnThis(),
    disableHighlighting: jest.fn().mockReturnThis(),
    getThreeManager: jest.fn().mockReturnThis(),
    getSceneManager: jest.fn().mockReturnThis(),
    getGeometries: jest.fn().mockReturnValue({
      children: [new Object3D(), new Object3D()],
    }),
    highlightObject: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [GeometryBrowserOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GeometryBrowserOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.activeObject.update = jest.fn();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get active object ID', () => {
    const ROW_ID = '1234';
    const activeObjectRow = document.createElement('div');
    activeObjectRow.setAttribute('id', ROW_ID);
    document.body.appendChild(activeObjectRow);

    // Return mocked row ID from the getActiveObjectId function same as the element we added above
    jest.spyOn(mockEventDisplay, 'getActiveObjectId');

    component.ngOnInit();
    component.activeObject.value = ROW_ID;

    expect(mockEventDisplay.getActiveObjectId).toHaveBeenCalled();
  });

  it('should change collection', () => {
    const mockChildren = mockEventDisplay
      .getThreeManager()
      .getSceneManager()
      .getGeometries().children;

    const mockSelectedValue = 'TestCollection';

    component.changeCollection(mockSelectedValue);

    const children: Object3D<Object3DEventMap>[] = [];

    for (const child of mockChildren) {
      if (child.name === mockSelectedValue) {
        children.push(child);
        break;
      }
    }

    expect(component.selectedCollection).toBe(mockSelectedValue);
    for (const child of children) {
      expect(component.showingCollection).toBe(child.children);
    }
  });

  it('should highlight object', () => {
    const mockUuid = '123'; // Wrong uuid to cover else

    jest.spyOn(mockEventDisplay, 'highlightObject');

    component.highlightObject(mockUuid);

    expect(mockEventDisplay.highlightObject).toHaveBeenCalledWith(
      mockUuid,
      true,
    );
  });

  it('should enable highlighting', () => {
    component.enableHighlighting();

    expect(mockEventDisplay.enableHighlighting).toHaveBeenCalled();
  });

  it('should disable highlighting', () => {
    component.disableHighlighting();

    expect(mockEventDisplay.disableHighlighting).toHaveBeenCalled();
  });
});
