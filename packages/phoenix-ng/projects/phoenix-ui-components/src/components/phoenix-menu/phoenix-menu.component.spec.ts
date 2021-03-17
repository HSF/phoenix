import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoenixMenuComponent } from './phoenix-menu.component';
import { PhoenixMenuNode } from 'phoenix-event-display';
import { PhoenixUIModule } from '../phoenix-ui.module';

describe('PhoenixMenuComponent', () => {
  let component: PhoenixMenuComponent;
  let fixture: ComponentFixture<PhoenixMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [PhoenixMenuComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoenixMenuComponent);
    component = fixture.componentInstance;
    component.rootNode = new PhoenixMenuNode('Test Node');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
