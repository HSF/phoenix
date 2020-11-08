import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SsModeComponent } from './ss-mode.component';

describe('SsModeComponent', () => {
  let component: SsModeComponent;
  let fixture: ComponentFixture<SsModeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SsModeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SsModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
