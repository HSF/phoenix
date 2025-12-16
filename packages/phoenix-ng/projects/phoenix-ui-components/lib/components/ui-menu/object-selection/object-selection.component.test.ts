import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { PhoenixUIModule } from '../../../phoenix-ui.module';
import { ObjectSelectionComponent } from './object-selection.component';
import { EventDisplayService } from '../../../../services/event-display.service';

describe('ObjectSelectionComponent', () => {
  let component: ObjectSelectionComponent;
  let fixture: ComponentFixture<ObjectSelectionComponent>;

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    getSelectedObjectObject: jest.fn().mockReturnThis(),
    allowSelection: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
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
                instance: { hiddenSelectedInfo: false },
                destroy: jest.fn(),
              }),
              dispose: jest.fn(),
            }),
          },
        },
      ],
      declarations: [ObjectSelectionComponent],
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
    expect(component.hiddenSelectedInfo).toBeFalsy();
    component.toggleOverlay();
    expect(component.hiddenSelectedInfo).toBeTruthy();
  });
});
