import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigSliderComponent } from './config-slider.component';
import { MatSliderModule } from '@angular/material/slider';

describe('ConfigSliderComponent', () => {
  let component: ConfigSliderComponent;
  let fixture: ComponentFixture<ConfigSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSliderModule],
      declarations: [ConfigSliderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  beforeEach(() => {
    spyOn(component.onChange, 'emit').and.callThrough();
  });

  it('should change value', () => {
    component.onValueChange(100);
    expect(component.onChange.emit).toHaveBeenCalledWith(100);
  });

  it('should not change value if undefined', () => {
    component.onValueChange(undefined);
    expect(component.onChange.emit).toHaveBeenCalledTimes(0);
  });
});
