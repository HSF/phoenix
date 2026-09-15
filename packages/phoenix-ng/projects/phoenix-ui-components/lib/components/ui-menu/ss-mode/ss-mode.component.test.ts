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

/**
 * `toggleSSMode` defers attaching the document listeners by 1ms (a workaround
 * for the activating click firing them immediately). The timer is not tracked,
 * so `ngOnDestroy` cannot cancel it: destroying the component while the timer
 * is pending removes the listeners first and the timer then re-attaches them
 * to a destroyed component. They stay on `document` for the life of the page,
 * and every subsequent click calls `exitFullscreen()`.
 *
 * MakePictureComponent has the same workaround but stores the timer id and
 * clears it in `ngOnDestroy` (ef594ae); this component was never updated.
 */
describe('SSModeComponent teardown during the deferred listener timer', () => {
  let component: SSModeComponent;
  let fixture: ComponentFixture<SSModeComponent>;

  beforeEach(async () => {
    jest.useFakeTimers();

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

    // jsdom implements neither fullscreen API.
    document.documentElement.requestFullscreen = jest.fn(() =>
      Promise.resolve(),
    );
    document.exitFullscreen = jest.fn(() => Promise.resolve());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not attach listeners after the component is destroyed', () => {
    component.toggleSSMode();
    expect(component.ssMode).toBe(true);

    // Destroyed while the 1ms timer is still pending.
    fixture.destroy();

    const handler = (component as any).onDocumentClick;
    const addSpy = jest.spyOn(document, 'addEventListener');

    jest.runAllTimers();

    // Anything attached now is attached to a destroyed component and will
    // never be removed, because ngOnDestroy has already run.
    const attachedAfterDestroy = addSpy.mock.calls.filter(
      (c) => c[1] === handler,
    );
    expect(attachedAfterDestroy).toHaveLength(0);
  });

  it('still attaches listeners on a normal toggle', () => {
    const handler = (component as any).onDocumentClick;
    const addSpy = jest.spyOn(document, 'addEventListener');

    component.toggleSSMode();
    jest.runAllTimers();

    expect(addSpy.mock.calls.filter((c) => c[1] === handler)).toHaveLength(2);
  });
});
