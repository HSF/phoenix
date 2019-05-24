import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Task1Component } from './task1.component';

describe('Task1Component', () => {
  let component: Task1Component;
  let fixture: ComponentFixture<Task1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Task1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Task1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
