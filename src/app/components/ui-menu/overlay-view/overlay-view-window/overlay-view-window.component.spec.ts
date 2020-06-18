import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayViewWindowComponent } from './overlay-view-window.component';
import { AppModule } from 'src/app/app.module';

describe('OverlayViewWindowComponent', () => {
  let component: OverlayViewWindowComponent;
  let fixture: ComponentFixture<OverlayViewWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayViewWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
