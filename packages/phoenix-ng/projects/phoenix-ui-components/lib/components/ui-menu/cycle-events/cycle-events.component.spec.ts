import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService, PhoenixUIModule } from 'phoenix-ui-components';

import { CycleEventsComponent } from './cycle-events.component';

fdescribe('CycleEventsComponent', () => {
  let component: CycleEventsComponent;
  let fixture: ComponentFixture<CycleEventsComponent>;
  const mockEventDisplay = {
    listenToLoadedEventsChange: jasmine
      .createSpy()
      .and.callFake((callback) => callback(['eventKey1', 'eventKey2'])),
    loadEvent: jasmine.createSpy().and.stub(),
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
    jasmine.clock().uninstall();
    jasmine.clock().install();
    component.interval = 1000;

    component.toggleCycle();
    expect(component.active).toBeTrue();

    jasmine.clock().tick(1200);
    expect(mockEventDisplay.loadEvent).toHaveBeenCalledWith('eventKey2');

    jasmine.clock().uninstall();
  });
});
