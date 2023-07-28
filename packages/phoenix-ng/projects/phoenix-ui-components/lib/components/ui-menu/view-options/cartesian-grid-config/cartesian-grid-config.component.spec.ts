import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartesianGridConfigComponent } from './cartesian-grid-config.component';

describe('CartesianGridConfigComponent', () => {
  let component: CartesianGridConfigComponent;
  let fixture: ComponentFixture<CartesianGridConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CartesianGridConfigComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartesianGridConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
