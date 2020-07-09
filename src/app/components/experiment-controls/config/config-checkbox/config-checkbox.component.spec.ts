import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigCheckboxComponent } from './config-checkbox.component';

describe('ConfigCheckboxComponent', () => {
  let component: ConfigCheckboxComponent;
  let fixture: ComponentFixture<ConfigCheckboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigCheckboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
