import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOptionsComponent } from './view-options.component';
import { PresetView } from 'phoenix-event-display';
import { EventDisplayService } from '../../../services/event-display.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('ViewOptionsComponent', () => {
  let component: ViewOptionsComponent;
  let fixture: ComponentFixture<ViewOptionsComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getUIManager: jasmine.createSpyObj('UIServicie', [
      'getPresetViews',
      'displayView',
      'setShowAxis',
    ]),
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [ViewOptionsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get preset views', () => {
    component.ngOnInit();
    expect(mockEventDisplay.getUIManager().getPresetViews).toHaveBeenCalled();
  });

  it('should display the chosen preset view', () => {
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    const mockPresetView = new PresetView(
      'Test View',
      [0, 0, -12000],
      [0, 0, 0],
      'left-cube'
    );
    component.displayView(mockEvent, mockPresetView);

    expect(mockEventDisplay.getUIManager().displayView).toHaveBeenCalledWith(
      mockPresetView
    );
  });

  it('should set axis', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;
    component.setAxis(event);
    expect(mockEventDisplay.getUIManager().setShowAxis).toHaveBeenCalledWith(
      VALUE
    );
  });
});
