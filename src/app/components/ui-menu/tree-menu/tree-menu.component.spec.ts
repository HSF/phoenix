import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeMenuComponent } from './tree-menu.component';
import { AppModule } from '../../../app.module';

describe('TreeMenuComponent', () => {
  let component: TreeMenuComponent;
  let fixture: ComponentFixture<TreeMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [ TreeMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
