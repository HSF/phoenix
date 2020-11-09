import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SSModeComponent } from './ss-mode.component';

describe('SSModeComponent', () => {
  let component: SSModeComponent;
  let fixture: ComponentFixture<SSModeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SSModeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
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

  it('should toggle screenshot mode on click', () => {
    component.toggleSSMode();
    expect(component.ssMode).toBe(true);
    (component as any).onDocumentClick();
    expect(component.ssMode).toBe(false);
  });

  it('should toggle screenshot mode on escape', () => {
    component.toggleSSMode();
    expect(component.ssMode).toBe(true);

    // Faking the event
    const event = document.createEvent('Event');
    (event as any).code = 'Escape';
    (component as any).onEscapePress(event);

    expect(component.ssMode).toBe(false);

    // For branch coverage
    (event as any).code = 'KeyA';
    (component as any).onEscapePress(event);
  });
});
