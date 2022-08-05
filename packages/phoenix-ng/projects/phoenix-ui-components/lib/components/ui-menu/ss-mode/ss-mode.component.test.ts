import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoenixUIModule } from '../../phoenix-ui.module';

import { SSModeComponent } from './ss-mode.component';

describe('SSModeComponent', () => {
  let component: SSModeComponent;
  let fixture: ComponentFixture<SSModeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SSModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle screenshot mode', () => {
    expect(component.ssMode).toBeFalsy();
    component.toggleSSMode();
    expect(component.ssMode).toBeTruthy();
    component.toggleSSMode();
    expect(component.ssMode).toBeFalsy();
  });
});
