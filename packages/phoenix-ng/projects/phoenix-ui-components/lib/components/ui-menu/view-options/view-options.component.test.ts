import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PresetView } from 'phoenix-event-display';
import { ViewOptionsComponent } from './view-options.component';
import {
  EventDisplayService,
  PhoenixUIModule,
  CartesianGridConfigComponent,
} from 'phoenix-ui-components';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { Vector3 } from 'three';
import { of } from 'rxjs/internal/observable/of';
import { Subscription } from 'rxjs';

describe('ViewOptionsComponent', () => {
  let component: ViewOptionsComponent;
  let fixture: ComponentFixture<ViewOptionsComponent>;

  const origin = new Vector3(100, 200, 300);

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    getThreeManager: jest.fn().mockReturnThis(),
    getPresetViews: jest.fn().mockReturnValue([]),
    displayView: jest.fn().mockReturnThis(),
    setShowAxis: jest.fn().mockReturnThis(),
    setShowEtaPhiGrid: jest.fn().mockReturnThis(),
    setShowCartesianGrid: jest.fn().mockReturnThis(),
    showLabels: jest.fn().mockReturnThis(),
    show3DMousePoints: jest.fn().mockReturnThis(),
    show3DDistance: jest.fn().mockReturnThis(),
    originChanged: of(origin),
  };

  const mockMatDialog = {
    open: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [ViewOptionsComponent, CartesianGridConfigComponent],
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
    }).compileComponents();

    fixture = TestBed.createComponent(ViewOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get preset views and set up the subscription', () => {
    component.ngOnInit();

    expect(mockEventDisplay.getUIManager().getPresetViews).toHaveBeenCalled();

    mockEventDisplay.getThreeManager().originChanged.subscribe((intersect) => {
      expect(component.origin).toBe(intersect);
    });
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
      mockParams,
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
      'left-cube',
    );
    component.displayView(mockEvent, mockPresetView);

    expect(mockEventDisplay.getUIManager().displayView).toHaveBeenCalledWith(
      mockPresetView,
    );
  });

  it('should set axis', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.setAxis(event);

    expect(mockEventDisplay.getUIManager().setShowAxis).toHaveBeenCalledWith(
      VALUE,
    );
  });

  it('should set eta phi grid', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.setEtaPhiGrid(event);

    expect(
      mockEventDisplay.getUIManager().setShowEtaPhiGrid,
    ).toHaveBeenCalledWith(VALUE);
  });

  it('should set cartesian grid', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.setCartesianGrid(event);

    expect(component.showCartesianGrid).toBe(false);
    expect(
      mockEventDisplay.getUIManager().setShowCartesianGrid,
    ).toHaveBeenCalledWith(VALUE, component.scale);
  });

  it('should show labels', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.showLabels(event);

    expect(mockEventDisplay.getUIManager().showLabels).toHaveBeenCalledWith(
      VALUE,
    );
  });

  it('should show 3D mouse points', () => {
    const VALUE = true;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.show3DMousePoints(event);

    expect(component.show3DPoints).toBe(VALUE);
    expect(
      mockEventDisplay.getUIManager().show3DMousePoints,
    ).toHaveBeenCalledWith(component.show3DPoints);
  });

  it('should toggle the show-distance function', () => {
    const VALUE = true;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.toggleShowDistance(event);

    expect(mockEventDisplay.getUIManager().show3DDistance).toHaveBeenCalledWith(
      VALUE,
    );
  });

  it('should unsubscribe the existing subscriptions', () => {
    component.sub = new Subscription();
    const spy = jest.spyOn(component.sub, 'unsubscribe');

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
