import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LHCbComponent} from './lhcb.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('LHCbComponent', () => {
  let component: LHCbComponent;
  let fixture: ComponentFixture<LHCbComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LHCbComponent],
      imports: [HttpClientTestingModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LHCbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
