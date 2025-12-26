import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { SSModeComponent } from './ss-mode.component';

describe('SSModeComponent', () => {
  let component: SSModeComponent;
  let fixture: ComponentFixture<SSModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SSModeComponent],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SSModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
