import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {CMSComponent} from './cms.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('LHCbComponent', () => {
  let component: CMSComponent;
  let fixture: ComponentFixture<CMSComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CMSComponent],
      imports: [HttpClientTestingModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CMSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
