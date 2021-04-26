import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentLinkComponent } from './experiment-link.component';

describe('ExperimentLinkComponent', () => {
  let component: ExperimentLinkComponent;
  let fixture: ComponentFixture<ExperimentLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExperimentLinkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
