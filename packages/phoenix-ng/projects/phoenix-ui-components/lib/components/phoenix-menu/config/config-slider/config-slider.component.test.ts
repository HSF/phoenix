import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';

import { ConfigSliderComponent } from './config-slider.component';

describe('ConfigSliderComponent', () => {
  let component: ConfigSliderComponent;
  let fixture: ComponentFixture<ConfigSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigSliderComponent],
      imports: [CommonModule, NoopAnimationsModule, MatSliderModule],
      providers: [
        {
          provide: '_CdkPrivateStyleLoader',
          useValue: { inject: () => Promise.resolve({}) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change value', () => {
    jest.spyOn(component.onChange, 'emit');
    component.onValueChange(100);
    expect(component.onChange.emit).toHaveBeenCalledWith(100);
  });

  it('should not change value if undefined', () => {
    jest.spyOn(component.onChange, 'emit');
    component.onValueChange(undefined);
    expect(component.onChange.emit).toHaveBeenCalledTimes(0);
  });
});
