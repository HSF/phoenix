import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateEventComponent } from './animate-event.component';

describe('AnimateEventComponent', () => {
  let component: AnimateEventComponent;
  let fixture: ComponentFixture<AnimateEventComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnimateEventComponent ]
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
});
