import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateEventComponent } from './animate-event.component';
import { EventdisplayService } from '../../../services/eventdisplay.service';

describe('AnimateEventComponent', () => {
  let component: AnimateEventComponent;
  let fixture: ComponentFixture<AnimateEventComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventdisplayService',
    ['animateClippingWithCollision', 'animateEventWithCollision']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: EventdisplayService,
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
    expect(mockEventDisplay.animateClippingWithCollision).toHaveBeenCalled();
  });
});
