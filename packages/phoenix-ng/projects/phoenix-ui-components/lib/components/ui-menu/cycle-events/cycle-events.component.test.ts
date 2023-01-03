import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

import { CycleEventsComponent } from './cycle-events.component';

describe('CycleEventsComponent', () => {
  let component: CycleEventsComponent;
  let fixture: ComponentFixture<CycleEventsComponent>;

  const mockEventDisplay = {
    listenToLoadedEventsChange: jest.fn((callback) =>
      callback(['eventKey1', 'eventKey2'])
    ),
    loadEvent: jest.fn(),
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
      declarations: [CycleEventsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CycleEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should listen to change in events', () => {
    expect(mockEventDisplay.listenToLoadedEventsChange).toHaveBeenCalled();
  });

  it('should start rotating through events on toggle', () => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    component.interval = 1000;

    component.toggleCycle();

    expect(component.active).toBeTruthy();

    jest.advanceTimersByTime(1200);

    expect(mockEventDisplay.loadEvent).toHaveBeenCalledWith('eventKey2');

    jest.clearAllTimers();
  });
});
