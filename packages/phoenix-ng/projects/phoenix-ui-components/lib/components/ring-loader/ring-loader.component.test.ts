import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RingLoaderComponent } from './ring-loader.component';

describe('RingLoaderComponent', () => {
  let component: RingLoaderComponent;
  let fixture: ComponentFixture<RingLoaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RingLoaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RingLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
