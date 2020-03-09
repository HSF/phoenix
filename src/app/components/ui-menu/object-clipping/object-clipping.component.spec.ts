import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectClippingComponent } from './object-clipping.component';

describe('ObjectClippingComponent', () => {
  let component: ObjectClippingComponent;
  let fixture: ComponentFixture<ObjectClippingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
});
