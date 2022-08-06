import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

import { PerformanceToggleComponent } from './performance-toggle.component';

describe('PerformanceToggleComponent', () => {
  let component: PerformanceToggleComponent;
  let fixture: ComponentFixture<PerformanceToggleComponent>;

  const mockEventDisplay = {
    getThreeManager: jest.fn().mockReturnThis(),
    setAntialiasing: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PerformanceToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle antialiasing', () => {
    expect(component.performanceMode).toBe(false);

    component.togglePerformance();

    expect(component.performanceMode).toBe(true);
    expect(
      mockEventDisplay.getThreeManager().setAntialiasing
    ).toHaveBeenCalledWith(!component.performanceMode);
  });
});
