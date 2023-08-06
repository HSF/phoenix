import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectClippingComponent } from './object-clipping.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('ObjectClippingComponent', () => {
  let component: ObjectClippingComponent;
  let fixture: ComponentFixture<ObjectClippingComponent>;

  const mockUIManager = {
    rotateStartAngleClipping: jest.fn(),
    rotateOpeningAngleClipping: jest.fn(),
    setClipping: jest.fn(),
  };

  const mockEventDisplay = {
    getUIManager: jest.fn(() => mockUIManager),
    getStateManager: () => ({
      clippingEnabled: {
        onUpdate: jest.fn(),
      },
      startClippingAngle: {
        onUpdate: jest.fn(),
      },
      openingClippingAngle: {
        onUpdate: jest.fn(),
      },
    }),
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
      declarations: [ObjectClippingComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectClippingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle clipping', () => {
    expect(component.clippingEnabled).toBeUndefined();
    const matCheckboxChange = new MatCheckboxChange();

    // Check for true
    matCheckboxChange.checked = true;
    component.toggleClipping(matCheckboxChange);
    expect(component.clippingEnabled).toBe(true);

    // Check for false
    matCheckboxChange.checked = false;
    component.toggleClipping(matCheckboxChange);
    expect(component.clippingEnabled).toBe(false);
  });

  it('should change clipping angle', () => {
    const sliderValue = 10;

    component.changeStartClippingAngle(sliderValue);
    expect(
      mockEventDisplay.getUIManager().rotateStartAngleClipping,
    ).toHaveBeenCalledWith(sliderValue);

    component.changeOpeningClippingAngle(sliderValue);
    expect(
      mockEventDisplay.getUIManager().rotateOpeningAngleClipping,
    ).toHaveBeenCalledWith(sliderValue);
  });
});
