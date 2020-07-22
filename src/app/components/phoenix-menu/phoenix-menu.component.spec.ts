import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoenixMenuComponent } from './phoenix-menu.component';

describe('PhoenixMenuComponent', () => {
  let component: PhoenixMenuComponent;
  let fixture: ComponentFixture<PhoenixMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhoenixMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoenixMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
