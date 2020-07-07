import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentControlItemComponent } from './experiment-control-item.component';

describe('ExperimentControlItemComponent', () => {
  let component: ExperimentControlItemComponent;
  let fixture: ComponentFixture<ExperimentControlItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentControlItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentControlItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
