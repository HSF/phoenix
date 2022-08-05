import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarkThemeComponent } from './dark-theme.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { UIManager } from 'phoenix-event-display';
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

  it('should set/toggle dark theme', () => {
    expect(component.darkTheme).toBeTruthy();
    component.setDarkTheme();
    expect(component.darkTheme).toBeFalsy();
  });
});