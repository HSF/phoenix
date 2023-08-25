import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

import { MakePictureComponent } from './make-picture.component';

describe('MakePictureComponent', () => {
  let component: MakePictureComponent;
  let fixture: ComponentFixture<MakePictureComponent>;

  const mockEventDisplay = {
    makeScreenShot: jest.fn(),
    getThreeManager: jest.fn().mockReturnThis(),
    checkScreenShotCanvasSize: jest.fn().mockResolvedValue(true),
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
    }).compileComponents();

    fixture = TestBed.createComponent(MakePictureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set Width', () => {
    component.setWidth(20);
    expect(component.width).toBe(20);
  });

  it('should set Height', () => {
    component.setHeight(25);
    expect(component.height).toBe(25);
  });

  it('should call makeScreenShot on eventDisplay', () => {
    component.makePicture();
    expect(mockEventDisplay.makeScreenShot).toHaveBeenCalled();
  });
});
