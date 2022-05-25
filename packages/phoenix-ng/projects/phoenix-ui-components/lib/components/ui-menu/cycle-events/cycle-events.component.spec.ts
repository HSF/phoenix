import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CycleEventsComponent } from './cycle-events.component';

describe('CycleEventsComponent', () => {
  let component: CycleEventsComponent;
  let fixture: ComponentFixture<CycleEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CycleEventsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CycleEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
