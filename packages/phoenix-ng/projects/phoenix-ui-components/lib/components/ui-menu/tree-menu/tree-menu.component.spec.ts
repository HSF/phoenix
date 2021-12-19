import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeMenuComponent } from './tree-menu.component';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('TreeMenuComponent', () => {
  let component: TreeMenuComponent;
  let fixture: ComponentFixture<TreeMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [TreeMenuComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
