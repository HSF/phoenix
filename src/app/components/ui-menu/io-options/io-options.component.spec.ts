import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IoOptionsComponent } from './io-options.component';

describe('IoOptionsComponent', () => {
  let component: IoOptionsComponent;
  let fixture: ComponentFixture<IoOptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IoOptionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IoOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
