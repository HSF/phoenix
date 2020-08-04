import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoRotateComponent } from './auto-rotate.component';
import { AppModule } from '../../../app.module';

describe('AutoRotateComponent', () => {
  let component: AutoRotateComponent;
  let fixture: ComponentFixture<AutoRotateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [ AutoRotateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoRotateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
