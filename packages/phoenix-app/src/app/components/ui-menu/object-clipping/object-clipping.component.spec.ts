import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectClippingComponent } from './object-clipping.component';
import { AppModule } from '../../../app.module';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSliderChange } from '@angular/material/slider';
import { EventDisplayService } from 'src/app/services/event-display.service';

describe('ObjectClippingComponent', () => {
  let component: ObjectClippingComponent;
  let fixture: ComponentFixture<ObjectClippingComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getUIManager: jasmine.createSpyObj('UIService', ['rotateClipping', 'setClipping'])
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
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

  it('should change clipping angle', () => {
    const sliderValue = 10;
    const matSliderChange = new MatSliderChange();
    matSliderChange.value = sliderValue;

    component.changeClippingAngle(matSliderChange);
    expect(mockEventDisplay.getUIManager().rotateClipping).toHaveBeenCalledWith(sliderValue);
  });
});
