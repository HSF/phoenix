import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CMSComponent } from './cms.component';

describe('CMSComponent', () => {
  let component: CMSComponent;
  let fixture: ComponentFixture<CMSComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CMSComponent ]
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
