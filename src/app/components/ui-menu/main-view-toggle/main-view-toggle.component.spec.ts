import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainViewToggleComponent } from './main-view-toggle.component';
import { AppModule } from '../../../app.module';

describe('MainViewToggleComponent', () => {
  let component: MainViewToggleComponent;
  let fixture: ComponentFixture<MainViewToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
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
