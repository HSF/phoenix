import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentInfoComponent } from './experiment-info.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('ExperimentInfoComponent', () => {
  let component: ExperimentInfoComponent;
  let fixture: ComponentFixture<ExperimentInfoComponent>;

  const mockEventDisplayService = jasmine.createSpyObj('EventDisplayService', [
    'getEventMetadata',
    'listenToDisplayedEventChange',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplayService,
        },
      ],
    }).compileComponents();
  });

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
    expect(
      mockEventDisplayService.listenToDisplayedEventChange
    ).toHaveBeenCalled();
  });
});
