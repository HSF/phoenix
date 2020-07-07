import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentControlsComponent } from './experiment-controls.component';

describe('ExperimentControlsComponent', () => {
  let component: ExperimentControlsComponent;
  let fixture: ComponentFixture<ExperimentControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
