import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiMenuWrapperComponent } from './ui-menu-wrapper.component';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('UiMenuWrapperComponent', () => {
  let component: UiMenuWrapperComponent;
  let fixture: ComponentFixture<UiMenuWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
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
