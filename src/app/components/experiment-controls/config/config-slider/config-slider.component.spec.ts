import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigSliderComponent } from './config-slider.component';

describe('ConfigSliderComponent', () => {
  let component: ConfigSliderComponent;
  let fixture: ComponentFixture<ConfigSliderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigSliderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
