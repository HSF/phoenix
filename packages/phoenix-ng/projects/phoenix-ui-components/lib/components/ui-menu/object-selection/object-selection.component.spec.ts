import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectSelectionComponent } from './object-selection.component';
import { Overlay } from '@angular/cdk/overlay';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('ObjectSelectionComponent', () => {
  let component: ObjectSelectionComponent;
  let fixture: ComponentFixture<ObjectSelectionComponent>;

  const mockEventDisplayService = jasmine.createSpyObj('EventDisplayService', [
    'enableSelecting',
    'allowSelection',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        Overlay,
        {
          provide: EventDisplayService,
          useValue: mockEventDisplayService,
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
    expect(component.hiddenSelectedInfo).toBe(true);
    component.toggleOverlay();
    expect(component.hiddenSelectedInfo).toBe(false);

    // Expect the overlay window to be visible
    expect(component.overlayWindow.instance.hiddenSelectedInfo).toBe(false);
    // Expect enable selection to have been called
    expect(mockEventDisplayService.enableSelecting).toHaveBeenCalled();
  });

  it('should destory object selection overlay', () => {
    spyOn(component.overlayWindow, 'destroy');

    component.ngOnDestroy();
    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });
});
