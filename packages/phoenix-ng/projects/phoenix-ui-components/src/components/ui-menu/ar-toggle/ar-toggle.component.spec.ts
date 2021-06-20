import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArToggleComponent } from './ar-toggle.component';

describe('ArToggleComponent', () => {
  let component: ArToggleComponent;
  let fixture: ComponentFixture<ArToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArToggleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
