import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoenixUIModule } from '../phoenix-ui.module';

import { UiMenuComponent } from './ui-menu.component';

describe('UiMenuComponent', () => {
  let component: UiMenuComponent;
  let fixture: ComponentFixture<UiMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UiMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
