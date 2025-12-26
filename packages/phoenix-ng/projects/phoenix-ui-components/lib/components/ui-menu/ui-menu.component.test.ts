import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventDataFormat } from '../../services/extras/event-data-import';

import { UiMenuComponent } from './ui-menu.component';
import { EventDisplayService } from '../../services/event-display.service';
import { Vector3 } from 'three';
import { of } from 'rxjs/internal/observable/of';

describe('UiMenuComponent', () => {
  let component: UiMenuComponent;
  let fixture: ComponentFixture<UiMenuComponent>;

  const mockEventDataFormat = {};

  const origin = new Vector3(100, 200, 300);

  const mockEventDisplay = {
    init: jest.fn(),
    getStateManager: jest.fn().mockReturnThis(),
    clippingEnabled: jest.fn().mockReturnThis(),
    startClippingAngle: jest.fn().mockReturnThis(),
    openingClippingAngle: jest.fn().mockReturnThis(),
    listenToLoadedEventsChange: jest.fn(),
    getUIManager: jest.fn().mockReturnThis(),
    getThreeManager: jest.fn().mockReturnThis(),
    getPresetViews: jest.fn().mockReturnThis().mockReturnValue([]),
    getDarkTheme: jest.fn().mockReturnThis(),
    buildEventDataFromJSON: jest.fn(),
    setOverlayRenderer: jest.fn().mockReturnThis(),
    allowSelection: jest.fn().mockReturnThis(),
    getInfoLogger: jest.fn().mockReturnThis(),
    getInfoLoggerList: jest.fn().mockReturnThis(),
    originChanged: of(origin),
  };

  const mockStateManager = mockEventDisplay.getStateManager();
  mockStateManager.clippingEnabled.onUpdate = jest.fn();
  mockStateManager.startClippingAngle.onUpdate = jest.fn();
  mockStateManager.openingClippingAngle.onUpdate = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UiMenuComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: EventDataFormat,
          useValue: mockEventDataFormat,
        },
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      imports: [CommonModule, FormsModule, ReactiveFormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UiMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
