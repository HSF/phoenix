import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VPToggleComponent } from './vp-toggle.component';

describe('VPToggleComponent', () => {
  let component: VPToggleComponent;
  let fixture: ComponentFixture<VPToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VPToggleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VPToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle VP opening/closing', () => {
    expect(component.open).toBe(false);
    component.toggleVP();
    expect(component.open).toBe(true);
  });
});
