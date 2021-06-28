import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainViewToggleComponent } from './main-view-toggle.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('MainViewToggleComponent', () => {
  let component: MainViewToggleComponent;
  let fixture: ComponentFixture<MainViewToggleComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getUIManager: jasmine.createSpyObj('UIManager', ['toggleOrthographicView']),
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [MainViewToggleComponent],
    }).compileComponents();
  });

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
    expect(
      mockEventDisplay.getUIManager().toggleOrthographicView
    ).toHaveBeenCalled();
  });
});
