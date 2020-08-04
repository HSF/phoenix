import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectClippingComponent } from './object-clipping.component';
import { UIService } from '../../../services/ui.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSliderChange } from '@angular/material/slider';

describe('ObjectClippingComponent', () => {
  let component: ObjectClippingComponent;
  let fixture: ComponentFixture<ObjectClippingComponent>;

  const mockUIService = jasmine.createSpyObj('UIService', ['rotateClipping', 'setClipping']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: UIService,
        useValue: mockUIService
      }],
      declarations: [ ObjectClippingComponent ]
    })
    .compileComponents();
  }));

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

  it('should change clipping', () => {
    const sliderValue = 10;
    const matSliderChange = new MatSliderChange();
    matSliderChange.value = sliderValue;

    component.changeClippingAngle(matSliderChange);
    expect(mockUIService.rotateClipping).toHaveBeenCalledWith(sliderValue);
  });
});
