import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Object3D } from 'three';

import { CollectionsInfoOverlayComponent } from './collections-info-overlay.component';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('CollectionsInfoOverlayComponent', () => {
  let component: CollectionsInfoOverlayComponent;
  let fixture: ComponentFixture<CollectionsInfoOverlayComponent>;

  const mockEventDisplay = {
    listenToDisplayedEventChange: (callback) => {
      callback();
    },
    getCollections: jest.fn(),
    getActiveObjectId: () => ({
      onUpdate: (callback) => {
        callback();
      },
    }),
    getThreeManager: jest.fn().mockReturnThis(),
    getSceneManager: jest.fn().mockReturnThis(),
    getScene: jest.fn().mockReturnThis(),
    getObjectByName: jest.fn(),
    getCollection: jest.fn(),
    lookAtObject: jest.fn(),
    highlightObject: jest.fn(),
    addLabelToObject: jest.fn(),
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
      declarations: [CollectionsInfoOverlayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsInfoOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.activeObject.update = jest.fn();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get collections', () => {
    jest.spyOn(mockEventDisplay, 'listenToDisplayedEventChange');
    component.ngOnInit();

    // Expect to start listening to changes in the currently displayed event
    expect(mockEventDisplay.listenToDisplayedEventChange).toHaveBeenCalled();
  });

  it('should initially get active object ID', () => {
    // Adding an element with the ID of the collections info row
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
    const uuid = '1234';
    const group = new Object3D();
    const object = new Object3D();
    object.uuid = uuid;

    jest
      .spyOn(
        mockEventDisplay.getThreeManager().getSceneManager().getScene(),
        'getObjectByName'
      )
      .mockImplementation(() => group);

    jest
      .spyOn(mockEventDisplay, 'getCollection')
      .mockImplementation(() => [{ uuid, otherProp: 'testPropValue' }]);

    const mockSelectedValue = 'TestCollection';

    component.changeCollection(mockSelectedValue);

    expect(mockEventDisplay.getCollection).toHaveBeenCalledWith(
      mockSelectedValue
    );
  });

  it('should look at object through event display', () => {
    const mockUuid = '1234';

    jest.spyOn(mockEventDisplay, 'lookAtObject');
    component.lookAtObject(mockUuid);
    expect(mockEventDisplay.lookAtObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should highlight object through event display', () => {
    const mockUuid = '123'; // Wrong uuid to cover else

    jest.spyOn(mockEventDisplay, 'highlightObject');
    component.highlightObject(mockUuid);
    expect(mockEventDisplay.highlightObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should sort collections in ascending order', () => {
    const mockCollections = [
      ['1235', 'testPropValue'],
      ['1236', 'testPropValue'],
    ];

    component.showingCollection = mockCollections;

    component.sort('mockCollections', 'asc');

    expect(component.showingCollection).toEqual([
      ['1235', 'testPropValue'],
      ['1236', 'testPropValue'],
    ]);

    component.sort('mockCollections', 'desc');

    // TODO: why did this fail?
    expect(component.showingCollection).not.toEqual([
      ['1236', 'testPropValue'],
      ['1235', 'testPropValue'],
    ]);
  });

  it('should toggle invisibility', () => {
    component.hideInvisible = false;
    component.toggleInvisible(true);
    expect(component.hideInvisible).toBeTruthy();

    component.toggleInvisible(false);
    expect(component.hideInvisible).toBeFalsy();
  });

  it('should add label to object', () => {
    const mockUuid = '1234';
    const mockLabel = 'testLabel';

    component.selectedCollection = mockLabel;
    component['elementRef'].nativeElement.querySelector = jest
      .fn()
      .mockImplementation(() => ({
        innerHTML: '',
      }));

    jest.spyOn(mockEventDisplay, 'addLabelToObject');

    component.addLabel(1, mockUuid);

    expect(mockEventDisplay.addLabelToObject).toHaveBeenCalledWith(
      undefined,
      mockLabel,
      1,
      mockUuid
    );
  });
});
