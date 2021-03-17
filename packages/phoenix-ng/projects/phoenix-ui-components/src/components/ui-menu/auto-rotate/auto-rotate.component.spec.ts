import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoRotateComponent } from './auto-rotate.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('AutoRotateComponent', () => {
  let component: AutoRotateComponent;
  let fixture: ComponentFixture<AutoRotateComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getUIManager: jasmine.createSpyObj('UIManager', ['setAutoRotate']),
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [AutoRotateComponent],
    }).compileComponents();
  });

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
