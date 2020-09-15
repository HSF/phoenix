import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateEventComponent } from './animate-event.component';
import { EventDisplayService } from '../../../services/event-display.service';

describe('AnimateEventComponent', () => {
  let component: AnimateEventComponent;
  let fixture: ComponentFixture<AnimateEventComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService',
    ['animateClippingWithCollision', 'animateEventWithCollision']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
      }],
      declarations: [AnimateEventComponent]
    })
      .compileComponents();
  }));

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
  });
});
