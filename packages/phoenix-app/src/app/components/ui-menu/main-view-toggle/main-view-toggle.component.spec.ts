import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainViewToggleComponent } from './main-view-toggle.component';
import { AppModule } from '../../../app.module';
import { EventDisplayService } from 'src/app/services/event-display.service';

describe('MainViewToggleComponent', () => {
  let component: MainViewToggleComponent;
  let fixture: ComponentFixture<MainViewToggleComponent>;

  let mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getUIManager: jasmine.createSpyObj('UIManager', ['toggleOrthographicView'])
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
      }],
      declarations: [MainViewToggleComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainViewToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch main view', () => {
    expect(component.orthographicView).toBe(false);
    component.switchMainView();
    expect(component.orthographicView).toBe(true);
    expect(mockEventDisplay.getUIManager().toggleOrthographicView).toHaveBeenCalled();
  });
});
