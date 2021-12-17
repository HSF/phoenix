import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentLinkComponent } from './experiment-link.component';

describe('ExperimentLinkComponent', () => {
  let component: ExperimentLinkComponent;
  let fixture: ComponentFixture<ExperimentLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExperimentLinkComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize experiment link', () => {
    expect(component).toBeTruthy();
    expect((component as any).experimentLink).toBeTruthy();
  });

  it('should go to experiment link', () => {
    spyOn(window, 'open').and.stub();
    component.goToExperiment();
    expect(window.open).toHaveBeenCalled();
  });
});
