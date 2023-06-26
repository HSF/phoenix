import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartesianGridComponent } from './cartesian-grid.component';

describe('CartesianGridComponent', () => {
  let component: CartesianGridComponent;
  let fixture: ComponentFixture<CartesianGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CartesianGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartesianGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});