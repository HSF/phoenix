import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOptionsComponent } from './view-options.component';
import { AppModule } from '../../../app.module';

describe('ViewOptionsComponent', () => {
  let component: ViewOptionsComponent;
  let fixture: ComponentFixture<ViewOptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [ ViewOptionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
