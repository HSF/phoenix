import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSelectorComponent } from './event-selector.component';
import { AppModule } from 'src/app/app.module';

describe('EventSelectorComponent', () => {
  let component: EventSelectorComponent;
  let fixture: ComponentFixture<EventSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
