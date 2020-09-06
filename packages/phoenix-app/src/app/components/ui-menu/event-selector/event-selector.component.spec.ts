import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSelectorComponent } from './event-selector.component';
import { AppModule } from 'src/app/app.module';
import { EventdisplayService } from '../../../services/eventdisplay.service';

describe('EventSelectorComponent', () => {
  let component: EventSelectorComponent;
  let fixture: ComponentFixture<EventSelectorComponent>;

  const mockEventdisplayService = jasmine.createSpyObj('EventdisplayService',
    ['listenToLoadedEventsChange', 'loadEvent']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventdisplayService,
        useValue: mockEventdisplayService
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
    expect(mockEventdisplayService.listenToLoadedEventsChange).toHaveBeenCalled();
  });

  it('should change event through event display', () => {
    const mockSelectEvent = { target: { value: 'TestEvent' } };
    component.changeEvent(mockSelectEvent);
    expect(mockEventdisplayService.loadEvent).toHaveBeenCalledWith(mockSelectEvent.target.value);
  });
});
