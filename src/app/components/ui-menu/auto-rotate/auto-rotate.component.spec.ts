import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoRotateComponent } from './auto-rotate.component';
import { AppModule } from '../../../app.module';
import { UIService } from '../../../services/ui.service';

describe('AutoRotateComponent', () => {
  let component: AutoRotateComponent;
  let fixture: ComponentFixture<AutoRotateComponent>;

  let mockUIService = jasmine.createSpyObj('UIServicie', ['setAutoRotate']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: UIService,
        useValue: mockUIService
      }],
      declarations: [AutoRotateComponent]
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

  it('should toggle auto rotate', () => {
    expect(component.autoRotate).toBe(false);
    component.toggleAutoRotate();
    expect(component.autoRotate).toBe(true);
    expect(mockUIService.setAutoRotate).toHaveBeenCalled();
  });
});
