import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentInfoComponent } from './experiment-info.component';
import { AppModule } from 'src/app/app.module';
import { EventdisplayService } from '../../../services/eventdisplay.service';

describe('ExperimentInfoComponent', () => {
  let component: ExperimentInfoComponent;
  let fixture: ComponentFixture<ExperimentInfoComponent>;

  let eventDisplayService: EventdisplayService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [EventdisplayService]
    })
      .compileComponents();

    eventDisplayService = TestBed.get(EventdisplayService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize experiment info', () => {
    spyOn(eventDisplayService, 'getEventMetadata').and.stub();
    spyOn(eventDisplayService, 'listenToDisplayedEventChange').and.callThrough();
    component.ngOnInit();
    expect(eventDisplayService.listenToDisplayedEventChange).toHaveBeenCalled();
  });
});
