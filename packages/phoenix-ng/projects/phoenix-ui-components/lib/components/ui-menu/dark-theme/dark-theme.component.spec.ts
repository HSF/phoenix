import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarkThemeComponent } from './dark-theme.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { UIManager } from 'phoenix-event-display';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('DarkThemeComponent', () => {
  let component: DarkThemeComponent;
  let fixture: ComponentFixture<DarkThemeComponent>;

  let eventDisplay: EventDisplayService;
  let uiManager: UIManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [EventDisplayService],
      declarations: [DarkThemeComponent],
    }).compileComponents();

    eventDisplay = TestBed.get(EventDisplayService);
    uiManager = eventDisplay.getUIManager();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DarkThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get dark theme', () => {
    spyOn(uiManager, 'getDarkTheme').and.callThrough();

    component.ngOnInit();
    expect(uiManager.getDarkTheme).toHaveBeenCalled();
  });

  it('should set/toggle dark theme', () => {
    spyOn(uiManager, 'setDarkTheme').and.callThrough();

    expect(component.darkTheme).toBeFalsy();
    component.setDarkTheme();
    expect(component.darkTheme).toBe(true);

    expect(uiManager.setDarkTheme).toHaveBeenCalled();
  });
});
