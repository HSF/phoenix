import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoRotateComponent } from './auto-rotate.component';
import { AppModule } from '../../../app.module';
import { EventDisplayService } from '../../../services/eventdisplay.service';

describe('AutoRotateComponent', () => {
  let component: AutoRotateComponent;
  let fixture: ComponentFixture<AutoRotateComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getUIManager: jasmine.createSpyObj('UIManager', ['setAutoRotate'])
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
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
    expect(mockEventDisplay.getUIManager().setAutoRotate).toHaveBeenCalled();
  });
});
