import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentLinkComponent } from './experiment-link.component';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('ExperimentLinkComponent', () => {
  let component: ExperimentLinkComponent;
  let fixture: ComponentFixture<ExperimentLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
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
    window.open = jest.fn().mockReturnValue({
      focus: jest.fn(),
    });
    jest.spyOn(window, 'open');
    component.goToExperiment();
    expect(window.open).toHaveBeenCalled();
  });
});
