import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoenixUIModule } from '../../phoenix-ui.module';

import { MenuToggleComponent } from './menu-toggle.component';

describe('MenuToggleComponent', () => {
  let component: MenuToggleComponent;
  let fixture: ComponentFixture<MenuToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
