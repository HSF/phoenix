import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainViewToggleComponent } from './main-view-toggle.component';

describe('MainViewToggleComponent', () => {
  let component: MainViewToggleComponent;
  let fixture: ComponentFixture<MainViewToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainViewToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainViewToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
