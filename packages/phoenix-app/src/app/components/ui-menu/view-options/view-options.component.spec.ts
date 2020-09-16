import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOptionsComponent } from './view-options.component';
import { AppModule } from '../../../app.module';
import { PresetView } from '@phoenix/event-display';
import { EventDisplayService } from 'src/app/services/event-display.service';
import { MatCheckboxChange } from '@angular/material/checkbox';

describe('ViewOptionsComponent', () => {
  let component: ViewOptionsComponent;
  let fixture: ComponentFixture<ViewOptionsComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', {
    getUIManager: jasmine.createSpyObj('UIServicie', ['getPresetViews', 'displayView', 'setShowAxis'])
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
      }],
      declarations: [ViewOptionsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get preset views', () => {
    component.ngOnInit();
    expect(mockEventDisplay.getUIManager().getPresetViews).toHaveBeenCalled();
  });

  it('should display the chosen preset view', () => {
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    const mockPresetView = new PresetView('Test View', [0, 0, -12000], 'left-cube');
    component.displayView(mockEvent, mockPresetView);

    expect(mockEventDisplay.getUIManager().displayView).toHaveBeenCalledWith(mockPresetView);
  });

  it('should set axis', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;
    component.setAxis(event);
    expect(mockEventDisplay.getUIManager().setShowAxis).toHaveBeenCalledWith(VALUE);
  });
});
