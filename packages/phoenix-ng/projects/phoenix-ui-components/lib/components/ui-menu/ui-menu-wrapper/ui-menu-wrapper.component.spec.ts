import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiMenuWrapperComponent } from './ui-menu-wrapper.component';

describe('UiMenuWrapperComponent', () => {
  let component: UiMenuWrapperComponent;
  let fixture: ComponentFixture<UiMenuWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiMenuWrapperComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UiMenuWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
