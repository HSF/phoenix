import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';

import { ExperimentLinkComponent } from './experiment-link.component';

describe('ExperimentLinkComponent', () => {
  let component: ExperimentLinkComponent;
  let fixture: ComponentFixture<ExperimentLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExperimentLinkComponent],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        RouterTestingModule,
      ],
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
    window.open = jest.fn().mockReturnValue({ focus: jest.fn() } as any);
    jest.spyOn(window, 'open');
    component.goToExperiment();
    expect(window.open).toHaveBeenCalled();
  });
});
