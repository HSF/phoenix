import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateEventComponent } from './animate-event.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('AnimateEventComponent', () => {
  let component: AnimateEventComponent;
  let fixture: ComponentFixture<AnimateEventComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', [
    'animateClippingWithCollision',
    'animateEventWithCollision',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [AnimateEventComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should animate event', () => {
    component.toggleAnimateEvent();
    expect(component.isAnimating).toBeTrue();
    component.toggleAnimateEvent();
  });
});
