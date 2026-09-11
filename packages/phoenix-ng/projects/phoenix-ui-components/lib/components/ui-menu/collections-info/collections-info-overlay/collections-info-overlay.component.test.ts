import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Object3D } from 'three';

import { CollectionsInfoOverlayComponent } from './collections-info-overlay.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('CollectionsInfoOverlayComponent', () => {
  let component: CollectionsInfoOverlayComponent;
  let fixture: ComponentFixture<CollectionsInfoOverlayComponent>;

  const mockEventDisplay = {
    listenToDisplayedEventChange: jest.fn((callback) => {
      callback();
      return jest.fn();
    }),
    getCollections: jest.fn().mockReturnValue({
      Hits: ['hitsCollection1', 'hitsCollection2'],
      Tracks: ['trackCollection1'],
    }),
    getActiveObjectId: () => ({
      onUpdate: (callback) => {
        callback();
        return jest.fn();
      },
    }),
    enableHighlighting: jest.fn(),
    disableHighlighting: jest.fn(),
    getThreeManager: jest.fn().mockReturnThis(),
    getSceneManager: jest.fn().mockReturnThis(),
    getScene: jest.fn().mockReturnThis(),
    getObjectByName: jest.fn(),
    getCollection: jest
      .fn()
      .mockReturnValue([{ uuid: '1234', labelText: 'test' }]),
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

    component.activeObject = {
      value: '',
      update: jest.fn(),
      onUpdate: jest.fn(() => jest.fn()),
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get collections', () => {
    jest.spyOn(mockEventDisplay, 'listenToDisplayedEventChange');
    component.ngOnInit();

    expect(mockEventDisplay.listenToDisplayedEventChange).toHaveBeenCalled();
    expect(component.collections).toEqual([
      { type: 'Hits', collections: ['hitsCollection1', 'hitsCollection2'] },
      { type: 'Tracks', collections: ['trackCollection1'] },
    ]);
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
    const uuid = '1234';
    const group = new Object3D();
    const object = new Object3D();
    object.uuid = uuid;

    jest
      .spyOn(
        mockEventDisplay.getThreeManager().getSceneManager().getScene(),
        'getObjectByName',
      )
      .mockImplementation(() => group);

    jest
      .spyOn(mockEventDisplay, 'getCollection')
      .mockImplementation(() => [{ uuid, otherProp: 'testPropValue' }]);

    const mockSelectedValue = 'TestCollection';

    component.changeCollection(mockSelectedValue);

    expect(mockEventDisplay.getCollection).toHaveBeenCalledWith(
      mockSelectedValue,
    );
  });

  it('should look at object through event display', () => {
    const mockUuid = '1234';

    jest.spyOn(mockEventDisplay, 'lookAtObject');
    component.lookAtObject(mockUuid);

    expect(mockEventDisplay.lookAtObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should highlight object through event display', () => {
    const mockUuid = '1234';

    jest.spyOn(mockEventDisplay, 'highlightObject');
    component.highlightObject(mockUuid);

    expect(mockEventDisplay.highlightObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should enable highlighting', () => {
    component.enableHighlighting();

    expect(mockEventDisplay.enableHighlighting).toHaveBeenCalled();
  });

  it('should disable highlighting', () => {
    component.disableHighlighting();

    expect(mockEventDisplay.disableHighlighting).toHaveBeenCalled();
  });

  it('should sort collections in ascending order', () => {
    component.showingCollection = [
      { uuid: '2', labelText: 'b' },
      { uuid: '1', labelText: 'a' },
    ];

    component.sort('labelText', 'asc');
    expect(component.showingCollection).toEqual([
      { uuid: '1', labelText: 'a' },
      { uuid: '2', labelText: 'b' },
    ]);

    component.sort('labelText', 'desc');
    expect(component.showingCollection).toEqual([
      { uuid: '2', labelText: 'b' },
      { uuid: '1', labelText: 'a' },
    ]);
  });

  it('should toggle invisibility', () => {
    component.hideInvisible = false;

    component.toggleInvisible(true);
    expect(component.hideInvisible).toBe(true);

    component.toggleInvisible(false);
    expect(component.hideInvisible).toBe(false);
  });

  it('should format numbers to 2 decimal places', () => {
    expect(component.formatValue(1.123456)).toBe('1.12');
    expect(component.formatValue(5)).toBe('5');
    expect(component.formatValue(-1.239)).toBe('-1.24');
  });

  it('should format a track pos array (array of [x, y, z] points) recursively', () => {
    // Real shape returned for track.pos: an array of points, each an
    // [x, y, z] triplet - i.e. a 2D array, not a flat array of numbers.
    const pos = [
      [0.0025628636759723617, -0.011743023176942868, -0.05242818281548735],
      [29.50923086259338, -107.72085890394575, -487.4091843499314],
    ];

    expect(component.formatValue(pos)).toBe(
      '[[0.00, -0.01, -0.05], [29.51, -107.72, -487.41]]',
    );
  });

  it('should format a Vector3-like object as [x, y, z]', () => {
    expect(component.formatValue({ x: 1.239, y: 2, z: -3.14159 })).toBe(
      '[1.24, 2, -3.14]',
    );
  });

  it('should add label to object', () => {
    const mockUuid = '1234';
    const mockLabel = 'testLabel';

    component.selectedCollection = 'hitsCollection1';
    component['elementRef'].nativeElement.querySelector = jest
      .fn()
      .mockReturnValue({
        value: mockLabel,
      });

    jest.spyOn(mockEventDisplay, 'addLabelToObject');
    component.addLabel(0, mockUuid);

    expect(mockEventDisplay.addLabelToObject).toHaveBeenCalledWith(
      mockLabel,
      'hitsCollection1',
      0,
      mockUuid,
    );
  });
});
