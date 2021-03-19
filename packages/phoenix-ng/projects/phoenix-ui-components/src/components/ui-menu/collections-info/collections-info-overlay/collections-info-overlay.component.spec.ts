import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsInfoOverlayComponent } from './collections-info-overlay.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('CollectionsInfoOverlayComponent', () => {
  let component: CollectionsInfoOverlayComponent;
  let fixture: ComponentFixture<CollectionsInfoOverlayComponent>;
  let eventDisplayService: EventDisplayService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [EventDisplayService],
      declarations: [CollectionsInfoOverlayComponent],
    }).compileComponents();
    eventDisplayService = TestBed.get(EventDisplayService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsInfoOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get collections', () => {
    spyOn(
      eventDisplayService,
      'listenToDisplayedEventChange'
    ).and.callThrough();
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
    spyOn(eventDisplayService, 'getActiveObjectId').and.callThrough();

    component.ngOnInit();
    component.activeObject.uuid = ROW_ID;

    expect(eventDisplayService.getActiveObjectId).toHaveBeenCalled();
  });

  it('should change collection', () => {
    spyOn(eventDisplayService, 'getCollection').and.callFake(() => {
      return [{ uuid: 'abcd1234', otherProp: 'testPropValue' }];
    });
    const mockSelectedValue = { target: { value: 'TestCollection' } };

    component.changeCollection(mockSelectedValue);

    expect(eventDisplayService.getCollection).toHaveBeenCalledWith(
      mockSelectedValue.target.value
    );
  });

  it('should look at object through event display', () => {
    const mockUuid = 'abcd1234';

    spyOn(eventDisplayService, 'lookAtObject').and.stub();
    component.lookAtObject(mockUuid);
    expect(eventDisplayService.lookAtObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should not look at object with undefined uuid through event display', () => {
    spyOn(eventDisplayService, 'lookAtObject').and.callThrough();

    // Branch for undefined or null uuid
    component.lookAtObject(undefined);
    expect(eventDisplayService.lookAtObject).toHaveBeenCalledTimes(0);
  });

  it('should highlight object through event display', () => {
    const mockUuid = 'abcd123'; // Wrong uuid to cover else

    spyOn(eventDisplayService, 'highlightObject').and.stub();
    component.highlightObject(mockUuid);
    expect(eventDisplayService.highlightObject).toHaveBeenCalledWith(mockUuid);
  });

  it('should not highlight object with undefined uuid through event display', () => {
    spyOn(eventDisplayService, 'highlightObject').and.callThrough();

    // Branch for undefined or null uuid
    component.highlightObject(undefined);
    expect(eventDisplayService.highlightObject).toHaveBeenCalledTimes(0);
  });
});
