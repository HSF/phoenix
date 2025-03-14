import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Object3D } from 'three';

import { CollectionsInfoOverlayComponent } from './collections-info-overlay.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('CollectionsInfoOverlayComponent', () => {
  let component: CollectionsInfoOverlayComponent;
  let fixture: ComponentFixture<CollectionsInfoOverlayComponent>;

  const mockEventDisplay = {
    listenToDisplayedEventChange: jest.fn((callback) => callback()),
    getCollections: jest.fn().mockReturnValue({
      Hits: ['hitsCollection1', 'hitsCollection2'],
      Tracks: ['trackCollection1'],
    }),
    getActiveObjectId: jest.fn().mockReturnValue({
      value: '',
      onUpdate: jest.fn((callback) => callback('1234')),
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
      onUpdate: jest.fn(),
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
    jest.spyOn(mockEventDisplay, 'getActiveObjectId');
    component.ngOnInit();

    expect(mockEventDisplay.getActiveObjectId).toHaveBeenCalled();
    expect(component.activeObject.value).toBe('1234');
  });

  it('should change collection', () => {
    const mockSelectedValue = 'hitsCollection1';

    jest.spyOn(mockEventDisplay, 'getCollection');
    component.changeCollection(mockSelectedValue);

    expect(mockEventDisplay.getCollection).toHaveBeenCalledWith(
      mockSelectedValue,
    );
    expect(component.showingCollection).toEqual([
      { uuid: '1234', labelText: 'test', isCut: true },
    ]);
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
