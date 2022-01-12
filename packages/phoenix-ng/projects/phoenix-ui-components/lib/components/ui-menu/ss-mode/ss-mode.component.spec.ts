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

    spyOn(document.documentElement, 'requestFullscreen').and.stub();
    spyOn(document, 'exitFullscreen').and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle screenshot mode', () => {
    expect(component.ssMode).toBe(false);
    component.toggleSSMode();
    expect(component.ssMode).toBe(true);
    component.toggleSSMode();
    expect(component.ssMode).toBe(false);
  });
});
