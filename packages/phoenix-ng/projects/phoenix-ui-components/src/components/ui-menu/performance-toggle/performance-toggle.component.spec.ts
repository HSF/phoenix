import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from '../../../services/event-display.service';

import { PerformanceToggleComponent } from './performance-toggle.component';

describe('PerformanceToggleComponent', () => {
  let component: PerformanceToggleComponent;
  let fixture: ComponentFixture<PerformanceToggleComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getThreeManager: jasmine.createSpyObj('ThreeManager', ['setAntialiasing'])
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PerformanceToggleComponent],
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PerformanceToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle antialiasing', () => {
    expect(component.antialiasing).toBeFalse();
    component.toggleAntialiasing();
    expect(component.antialiasing).toBeTrue();
  });
});
