import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoRotateComponent } from './auto-rotate.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('AutoRotateComponent', () => {
  let component: AutoRotateComponent;
  let fixture: ComponentFixture<AutoRotateComponent>;

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    setAutoRotate: jest.fn().mockReturnThis(),
  };

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
    expect(component.autoRotate).toBeFalsy();

    const params = component['autoRotate'];
    const toggledParams = !params;

    component.toggleAutoRotate();

    expect(component.autoRotate).toBeTruthy();
    expect(mockEventDisplay.getUIManager().setAutoRotate).toHaveBeenCalledWith(
      toggledParams
    );
  });
});
