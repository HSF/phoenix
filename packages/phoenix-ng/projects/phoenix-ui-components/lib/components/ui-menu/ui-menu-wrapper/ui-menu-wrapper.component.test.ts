import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UiMenuWrapperComponent } from './ui-menu-wrapper.component';

describe('UiMenuWrapperComponent', () => {
  let component: UiMenuWrapperComponent;
  let fixture: ComponentFixture<UiMenuWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiMenuWrapperComponent],
      imports: [
        CommonModule,
        NoopAnimationsModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
      ],
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
