import { ComponentFixture, TestBed, tick } from '@angular/core/testing';

import { CartesianGridConfigComponent } from './cartesian-grid-config.component';
import { EventDisplayService, PhoenixUIModule } from 'phoenix-ui-components';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Vector3 } from 'three';
import { of } from 'rxjs/internal/observable/of';

describe('CartesianGridConfigComponent', () => {
  let component: CartesianGridConfigComponent;
  let fixture: ComponentFixture<CartesianGridConfigComponent>;

  const mockDialogRef = {
    close: jest.fn().mockReturnThis(),
  };

  const gridOrigin = new Vector3(100, 200, 300);

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    translateCartesianGrid: jest.fn().mockReturnThis(),
    translateCartesianLabels: jest.fn().mockReturnThis(),
    getCartesianGridConfig: jest.fn().mockReturnValue({
      showXY: true,
      showYZ: true,
      showZX: true,
      xDistance: 300,
      yDistance: 300,
      zDistance: 300,
      sparsity: 2,
    }),
    setShowCartesianGrid: jest.fn().mockReturnThis(),
    shiftCartesianGridByPointer: jest.fn().mockReturnThis(),
    getThreeManager: jest.fn().mockReturnThis(),
    originChanged: of(gridOrigin),
    stopShifting: of(true),
    origin: new Vector3(0, 0, 0),
    originChangedEmit: jest.fn().mockReturnThis(),
  };

  const mockData = {
    gridVisible: true,
    scale: 3000,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [CartesianGridConfigComponent],
      providers: [
        {
          provide: MatDialogRef<CartesianGridConfigComponent>,
          useValue: mockDialogRef,
        },
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockData,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartesianGridConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set initial configuration', (done) => {
    const VALUE1 = component.data.gridVisible;
    const VALUE2 = component.data.scale;

    component.ngOnInit();

    expect(component.showCartesianGrid).toBe(VALUE1);
    expect(component.scale).toBe(VALUE2);

    expect(
      mockEventDisplay.getUIManager().getCartesianGridConfig,
    ).toHaveBeenCalled();

    const VALUE3 = component.gridConfig;

    expect(
      mockEventDisplay.getUIManager().getCartesianGridConfig,
    ).toHaveReturnedWith(VALUE3);

    expect(mockEventDisplay.getThreeManager).toHaveBeenCalled();

    const VALUE4 = component.cartesianPos;

    expect(mockEventDisplay.getThreeManager().origin).toBe(VALUE4);
    done();
  });

  it('should close', () => {
    component.onClose();

    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should save the updated grid origin', () => {
    const VALUE1 = 10;
    const VALUE2 = 20;
    const VALUE3 = 30;

    const spy = jest.spyOn(component, 'shiftCartesianGridByValues');

    component.onSave(VALUE1, VALUE2, VALUE3);

    expect(spy).toHaveBeenCalledWith(
      new Vector3(VALUE1 * 10, VALUE2 * 10, VALUE3 * 10),
    );
  });

  it('should shift cartesian grid by a mouse click', () => {
    component.shiftCartesianGridByPointer();

    mockEventDisplay.getUIManager().shiftCartesianGridByPointer(true);

    mockEventDisplay.getThreeManager().originChanged.subscribe((intersect) => {
      expect(component.translateGrid).toHaveBeenCalledWith(intersect);
    });

    const originChangedUnSpy = jest.spyOn(
      component.originChangedSub,
      'unsubscribe',
    );
    const stopShiftingUnSpy = jest.spyOn(
      component.stopShiftingSub,
      'unsubscribe',
    );

    mockEventDisplay.getThreeManager().stopShifting.subscribe((stop) => {
      if (stop) {
        expect(originChangedUnSpy).toHaveBeenCalled();
        expect(stopShiftingUnSpy).toHaveBeenCalled();
      }
    });
  });

  it('should shift cartesian grid by values', () => {
    const VALUE = new Vector3(100, 200, 300);

    const spy = jest.spyOn(component, 'translateGrid');

    component.shiftCartesianGridByValues(VALUE);

    expect(spy).toHaveBeenCalledWith(VALUE);
    expect(
      mockEventDisplay.getThreeManager().originChangedEmit,
    ).toHaveBeenCalledWith(VALUE);
  });

  it('should translate grid', () => {
    const VALUE1 = new Vector3(100, 200, 300);

    const finalPos = VALUE1;
    const initialPos = component.cartesianPos;
    const difference = new Vector3(
      finalPos.x - initialPos.x,
      finalPos.y - initialPos.y,
      finalPos.z - initialPos.z,
    );

    component['translateGrid'](VALUE1);

    expect(
      mockEventDisplay.getUIManager().translateCartesianGrid,
    ).toHaveBeenCalledWith(difference.clone());
    expect(
      mockEventDisplay.getUIManager().translateCartesianLabels,
    ).toHaveBeenCalledWith(difference.clone());
    expect(component.cartesianPos).toBe(finalPos);
  });

  it('should add XY Planes', () => {
    const event = { target: { value: '600' } } as any;
    const VALUE = Number(event.target.value);

    const spy = jest.spyOn(component, 'callSetShowCartesianGrid');

    component.addXYPlanes(event);

    expect(component.gridConfig.zDistance).toBe(VALUE);
    expect(spy).toHaveBeenCalled();
  });

  it('should add YZ Planes', () => {
    const event = { target: { value: '600' } } as any;
    const VALUE = Number(event.target.value);

    const spy = jest.spyOn(component, 'callSetShowCartesianGrid');

    component.addYZPlanes(event);

    expect(component.gridConfig.xDistance).toBe(VALUE);
    expect(spy).toHaveBeenCalled();
  });

  it('should add ZX Planes', () => {
    const event = { target: { value: '600' } } as any;
    const VALUE = Number(event.target.value);

    const spy = jest.spyOn(component, 'callSetShowCartesianGrid');

    component.addZXPlanes(event);

    expect(component.gridConfig.yDistance).toBe(VALUE);
    expect(spy).toHaveBeenCalled();
  });

  it('should change sparsity', () => {
    const event = { target: { value: '2' } } as any;
    const VALUE = Number(event.target.value);

    const spy = jest.spyOn(component, 'callSetShowCartesianGrid');
    component.changeSparsity(event);

    expect(component.gridConfig.sparsity).toBe(VALUE);
    expect(spy).toHaveBeenCalled();
  });

  it('should show XY Planes', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.showXYPlanes(event);
    expect(component.gridConfig.showXY).toBe(VALUE);
  });

  it('should show YZ Planes', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.showYZPlanes(event);
    expect(component.gridConfig.showYZ).toBe(VALUE);
  });

  it('should show ZX Planes', () => {
    const VALUE = false;
    const event = new MatCheckboxChange();
    event.checked = VALUE;

    component.showZXPlanes(event);
    expect(component.gridConfig.showZX).toBe(VALUE);
  });

  it('should call setShowCartesianGrid', () => {
    component.callSetShowCartesianGrid();

    expect(
      mockEventDisplay.getUIManager().setShowCartesianGrid,
    ).toHaveBeenCalledWith(
      component.showCartesianGrid,
      component.scale,
      component.gridConfig,
    );
  });
});
