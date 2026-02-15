import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { EventDisplayService } from '../../../services/event-display.service';

import { MakePictureComponent } from './make-picture.component';

describe('MakePictureComponent', () => {
  let component: MakePictureComponent;
  let fixture: ComponentFixture<MakePictureComponent>;

  const mockEventDisplay = {
    makeScreenShot: jest.fn(),
    getThreeManager: jest.fn().mockReturnThis(),
    checkScreenShotCanvasSize: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MakePictureComponent],
      imports: [CommonModule], // Explicitly import base module; add others (e.g., FormsModule) if component uses them
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

  afterEach(() => {
    document.body.classList.remove('ss-mode');
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

  it('should toggle screenshot mode', () => {
    component.toggleSSMode();
    expect(component.ssMode).toBe(true);
    expect(document.body.classList.contains('ss-mode')).toBe(true);
    component.toggleSSMode();
    expect(component.ssMode).toBe(false);
  });
});
