import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from '../../../services/event-display.service';

import { AntialiasToggleComponent } from './antialias-toggle.component';

describe('AntialiasToggleComponent', () => {
  let component: AntialiasToggleComponent;
  let fixture: ComponentFixture<AntialiasToggleComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getThreeManager: jasmine.createSpyObj('ThreeManager', ['setAntialiasing'])
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AntialiasToggleComponent],
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AntialiasToggleComponent);
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
