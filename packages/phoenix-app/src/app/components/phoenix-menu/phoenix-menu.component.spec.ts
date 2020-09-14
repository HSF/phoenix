import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoenixMenuComponent } from './phoenix-menu.component';
import { AppModule } from '../../app.module';
import { PhoenixMenuNode } from '@phoenix/event-display';

describe('PhoenixMenuComponent', () => {
  let component: PhoenixMenuComponent;
  let fixture: ComponentFixture<PhoenixMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [PhoenixMenuComponent]
    })
    .compileComponents();
  }));

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
