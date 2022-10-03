import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarkThemeComponent } from './dark-theme.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('DarkThemeComponent', () => {
  let component: DarkThemeComponent;
  let fixture: ComponentFixture<DarkThemeComponent>;

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    getDarkTheme: jest.fn().mockReturnThis(),
    setDarkTheme: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [DarkThemeComponent],
    }).compileComponents();
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
    jest.spyOn(mockEventDisplay, 'getDarkTheme');
    component.ngOnInit();
    expect(mockEventDisplay.getDarkTheme).toHaveBeenCalled();
  });

  it('should set/toggle dark theme', () => {
    component.darkTheme = false;
    component.setDarkTheme();
    expect(component.darkTheme).toBe(true);
  });
});
