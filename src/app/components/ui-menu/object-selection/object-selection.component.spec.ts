import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectSelectionComponent } from './object-selection.component';
import { AppModule } from 'src/app/app.module';
import { Overlay } from '@angular/cdk/overlay';
import { EventdisplayService } from '../../../services/eventdisplay.service';

describe('ObjectSelectionComponent', () => {
  let component: ObjectSelectionComponent;
  let fixture: ComponentFixture<ObjectSelectionComponent>;

  const mockEventdisplayService = jasmine.createSpyObj('EventdisplayService',
    ['enableSelecting', 'allowSelection']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [Overlay, {
        provide: EventdisplayService,
        useValue: mockEventdisplayService
      }],
      declarations: [ObjectSelectionComponent]
    })
      .compileComponents();
  }));

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
    expect(mockEventdisplayService.enableSelecting).toHaveBeenCalled();
  });

  it('should destory object selection overlay', () => {
    spyOn(component.overlayWindow, 'destroy');

    component.ngOnDestroy();
    expect(component.overlayWindow.destroy).toHaveBeenCalled();
  });
});
