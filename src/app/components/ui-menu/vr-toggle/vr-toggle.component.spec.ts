import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VrToggleComponent } from './vr-toggle.component';

describe('VrToggleComponent', () => {
  let component: VrToggleComponent;
  let fixture: ComponentFixture<VrToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VrToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VrToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
