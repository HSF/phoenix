import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOptionsComponent } from './view-options.component';
import { PresetView } from 'phoenix-event-display';
import { EventDisplayService } from '../../../services/event-display.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { MatDialog } from '@angular/material/dialog';
import { CartesianGridConfigComponent } from 'phoenix-ui-components';

describe('ViewOptionsComponent', () => {
  let component: ViewOptionsComponent;
  let fixture: ComponentFixture<ViewOptionsComponent>;

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    getPresetViews: jest.fn().mockReturnValue([]),
    displayView: jest.fn().mockReturnThis(),
    setShowAxis: jest.fn().mockReturnThis(),
    setShowEtaPhiGrid: jest.fn().mockReturnThis(),
    setShowCartesianGrid: jest.fn().mockReturnThis(),
    showLabels: jest.fn().mockReturnThis(),
  };

  const mockMatDialog = {
    open: jest.fn().mockReturnThis(),
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
          provide: MatDialog,
          useValue: mockMatDialog,
        },
      ],
      declarations: [ViewOptionsComponent],
    }).compileComponents();
  });

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

  it('should open cartesian grid config dialog box', () => {
    const mockParams = {
      data: {
        gridVisible: component.showCartesianGrid,
        scale: component.scale,
      },
      position: {
        bottom: '5rem',
        left: '3rem',
      },
    };

    component.openCartesianGridConfigDialog();

    expect(mockMatDialog.open).toHaveBeenCalledWith(
      CartesianGridConfigComponent,
      mockParams
    );
  });

  it('should display the chosen preset view', () => {
    const mockEvent = {
      stopPropagation: jest.fn(),
    };
    const mockPresetView = new PresetView(
      'Test View',
      [0, 0, -12000],
      [0, 0, 0],
      'left-cube'
    );
    component.displayView(mockEvent, mockPresetView);

    expect(mockEventDisplay.getUIManager().displayView).toHaveBeenCalledWith(
      mockPresetView
    );
  });

  it('should set axis', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.setAxis(event);

    expect(mockEventDisplay.getUIManager().setShowAxis).toHaveBeenCalledWith(
      VALUE
    );
  });

  it('should set eta phi grid', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.setEtaPhiGrid(event);

    expect(
      mockEventDisplay.getUIManager().setShowEtaPhiGrid
    ).toHaveBeenCalledWith(VALUE);
  });

  it('should set cartesian grid', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.setEtaPhiGrid(event);

    expect(component.showCartesianGrid).toBe(false);
    expect(
      mockEventDisplay.getUIManager().setShowCartesianGrid
    ).toHaveBeenCalledWith(VALUE, component.scale);
  });

  it('should show labels', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.showLabels(event);

    expect(mockEventDisplay.getUIManager().showLabels).toHaveBeenCalledWith(
      VALUE
    );
  });
});
