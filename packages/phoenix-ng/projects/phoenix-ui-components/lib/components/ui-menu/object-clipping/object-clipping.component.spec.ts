import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectClippingComponent } from './object-clipping.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSliderChange } from '@angular/material/slider';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('ObjectClippingComponent', () => {
  let component: ObjectClippingComponent;
  let fixture: ComponentFixture<ObjectClippingComponent>;

  const mockUIManager = jasmine.createSpyObj('UIManager', [
    'rotateStartAngleClipping',
    'rotateOpeningAngleClipping',
    'setClipping',
  ]);

  const mockEventDisplay = {
    getUIManager: jasmine.createSpy().and.returnValue(mockUIManager),
    getStateManager: () => ({
      clippingEnabled: {
        onUpdate: jasmine.createSpy('onUpdate'),
      },
      startClippingAngle: {
        onUpdate: jasmine.createSpy('onUpdate'),
      },
      openingClippingAngle: {
        onUpdate: jasmine.createSpy('onUpdate'),
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
    expect(component.clippingEnabled).toBeFalsy();

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
    const matSliderChange = new MatSliderChange();
    matSliderChange.value = sliderValue;

    component.changeStartClippingAngle(matSliderChange);
    expect(
      mockEventDisplay.getUIManager().rotateStartAngleClipping
    ).toHaveBeenCalledWith(sliderValue);

    component.changeOpeningClippingAngle(matSliderChange);
    expect(
      mockEventDisplay.getUIManager().rotateOpeningAngleClipping
    ).toHaveBeenCalledWith(sliderValue);
  });
});
