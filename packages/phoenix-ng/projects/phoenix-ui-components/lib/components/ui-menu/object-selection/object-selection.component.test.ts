import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { PhoenixUIModule, EventDisplayService } from 'phoenix-ui-components';
import { ObjectSelectionComponent } from './object-selection.component';

describe('ObjectSelectionComponent', () => {
  let component: ObjectSelectionComponent;
  let fixture: ComponentFixture<ObjectSelectionComponent>;

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    getSelectedObjectObject: jest.fn().mockReturnThis(),
    allowSelection: jest.fn().mockReturnThis(),

    //  REQUIRED: used in toggleOverlay()
    enableSelecting: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [ObjectSelectionComponent],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
        {
          provide: Overlay,
          useValue: {
            create: () => ({
              attach: () => ({
                instance: {
                  //  matches real component default
                  hiddenSelectedInfo: true,
                },
                destroy: jest.fn(),
              }),
              dispose: jest.fn(),
            }),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize/create object selection overlay', () => {
    component.ngOnInit();
    expect(component.overlayWindow).toBeTruthy();
  });

  it('should toggle object selection overlay', () => {
    //  correct initial state
    expect(component.hiddenSelectedInfo).toBeTruthy();

    component.toggleOverlay();

    //  toggled state
    expect(component.hiddenSelectedInfo).toBeFalsy();

    //  verify interaction with EventDisplayService
    expect(mockEventDisplay.enableSelecting).toHaveBeenCalledWith(true);
  });
});
