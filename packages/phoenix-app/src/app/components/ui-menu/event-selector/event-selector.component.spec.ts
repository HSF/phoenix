import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSelectorComponent } from './event-selector.component';
import { AppModule } from 'src/app/app.module';
import { EventDisplayService } from '../../../services/eventdisplay.service';

describe('EventSelectorComponent', () => {
  let component: EventSelectorComponent;
  let fixture: ComponentFixture<EventSelectorComponent>;

  const mockEventDisplayService = jasmine.createSpyObj('EventDisplayService',
    ['listenToLoadedEventsChange', 'loadEvent']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplayService
      }],
      declarations: [EventSelectorComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize to listen to loaded events change', () => {
    component.ngOnInit();
    expect(mockEventDisplayService.listenToLoadedEventsChange).toHaveBeenCalled();
  });

  it('should change event through event display', () => {
    const mockSelectEvent = { target: { value: 'TestEvent' } };
    component.changeEvent(mockSelectEvent);
    expect(mockEventDisplayService.loadEvent).toHaveBeenCalledWith(mockSelectEvent.target.value);
  });
});