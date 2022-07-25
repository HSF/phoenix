import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Object3D } from 'three';

import { CollectionsInfoOverlayComponent } from './collections-info-overlay.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('CollectionsInfoOverlayComponent', () => {
  let component: CollectionsInfoOverlayComponent;
  let fixture: ComponentFixture<CollectionsInfoOverlayComponent>;
  let eventDisplayService: EventDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [EventDisplayService],
      declarations: [CollectionsInfoOverlayComponent],
    }).compileComponents();
    eventDisplayService = TestBed.inject(EventDisplayService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsInfoOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get collections', () => {
    jest.spyOn(eventDisplayService, 'listenToDisplayedEventChange');
    component.ngOnInit();

    // Expect to start listening to changes in the currently displayed event
    expect(eventDisplayService.listenToDisplayedEventChange).toHaveBeenCalled();
  });

  it('should initially get active object ID', () => {
    // Adding an element with the ID of the collections info row
    const ROW_ID = 'abcd1234';
    const activeObjectRow = document.createElement('div');
    activeObjectRow.setAttribute('id', ROW_ID);
    document.body.appendChild(activeObjectRow);

    // Return mocked row ID from the getActiveObjectId function same as the element we added above
    jest.spyOn(eventDisplayService, 'getActiveObjectId');

    component.ngOnInit();
    component.activeObject.value = ROW_ID;

    expect(eventDisplayService.getActiveObjectId).toHaveBeenCalled();
  });

  it('should change collection', () => {
    const uuid = 'abcd1234';
    const group = new Object3D();
    const object = new Object3D();
    object.uuid = uuid;

    jest
      .spyOn(
        eventDisplayService.getThreeManager().getSceneManager().getScene(),
        'getObjectByName'
      )
      .mockImplementation(() => group);

    jest
      .spyOn(eventDisplayService, 'getCollection')
      .mockImplementation(() => [{ uuid, otherProp: 'testPropValue' }]);

    const mockSelectedValue = 'TestCollection';

    component.changeCollection(mockSelectedValue);

    expect(eventDisplayService.getCollection).toHaveBeenCalledWith(
      mockSelectedValue
    );
  });

  it('should look at object through event display', () => {
    const mockUuid = 'abcd1234';

    jest.spyOn(eventDisplayService, 'lookAtObject');
    component.lookAtObject(mockUuid);
    expect(eventDisplayService.lookAtObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should not look at object with undefined uuid through event display', () => {
    jest.spyOn(eventDisplayService, 'lookAtObject');

    // Branch for undefined or null uuid
    component.lookAtObject(undefined);
    expect(eventDisplayService.lookAtObject).toHaveBeenCalledTimes(0);
  });

  it('should highlight object through event display', () => {
    const mockUuid = 'abcd123'; // Wrong uuid to cover else

    jest.spyOn(eventDisplayService, 'highlightObject');
    component.highlightObject(mockUuid);
    expect(eventDisplayService.highlightObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should not highlight object with undefined uuid through event display', () => {
    jest.spyOn(eventDisplayService, 'highlightObject');

    // Branch for undefined or null uuid
    component.highlightObject(undefined);
    expect(eventDisplayService.highlightObject).toHaveBeenCalledTimes(0);
  });
});
