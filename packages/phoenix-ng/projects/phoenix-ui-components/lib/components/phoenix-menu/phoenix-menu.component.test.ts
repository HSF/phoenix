import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestModule } from '../testing/test.module';

import { PhoenixMenuComponent } from './phoenix-menu.component';
import { PhoenixMenuNode } from 'phoenix-event-display';

describe('PhoenixMenuComponent', () => {
  let component: PhoenixMenuComponent;
  let fixture: ComponentFixture<PhoenixMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhoenixMenuComponent],
      imports: [TestModule],
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
