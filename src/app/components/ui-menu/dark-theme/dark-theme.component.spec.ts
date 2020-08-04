import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DarkThemeComponent } from './dark-theme.component';
import { AppModule } from '../../../app.module';

describe('DarkThemeComponent', () => {
  let component: DarkThemeComponent;
  let fixture: ComponentFixture<DarkThemeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [ DarkThemeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DarkThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
