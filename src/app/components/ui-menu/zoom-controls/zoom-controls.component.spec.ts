import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomControlsComponent } from './zoom-controls.component';
import { AppModule } from 'src/app/app.module';

describe('ZoomControlsComponent', () => {
  let component: ZoomControlsComponent;
  let fixture: ComponentFixture<ZoomControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
