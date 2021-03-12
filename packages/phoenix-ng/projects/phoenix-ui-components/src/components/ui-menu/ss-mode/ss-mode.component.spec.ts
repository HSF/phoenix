import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SSModeComponent } from './ss-mode.component';

describe('SSModeComponent', () => {
  let component: SSModeComponent;
  let fixture: ComponentFixture<SSModeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SSModeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SSModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
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
    (component as any).onDocumentClick();
  });
});
