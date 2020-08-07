import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentInfoComponent } from './experiment-info.component';
import { AppModule } from 'src/app/app.module';
import { EventdisplayService } from '../../../services/eventdisplay.service';

describe('ExperimentInfoComponent', () => {
  let component: ExperimentInfoComponent;
  let fixture: ComponentFixture<ExperimentInfoComponent>;

  const mockEventdisplayService = jasmine.createSpyObj('EventdisplayService', ['getEventMetadata', 'listenToDisplayedEventChange']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventdisplayService,
        useValue: mockEventdisplayService
      }]
    })
      .compileComponents();
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
    component.ngOnInit();
    expect(mockEventdisplayService.listenToDisplayedEventChange).toHaveBeenCalled();
  });
});
