import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartesianGridConfigComponent } from './cartesian-grid-config.component';
import { EventDisplayService, PhoenixUIModule } from 'phoenix-ui-components';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ElementRef } from '@angular/core';

describe('CartesianGridConfigComponent', () => {
  let component: CartesianGridConfigComponent;
  let fixture: ComponentFixture<CartesianGridConfigComponent>;

  const mockDialogRef = {
    close: jest.fn().mockReturnThis(),
  };

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
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
  };

  const mockData = {
    gridVisible: true,
    scale: 3000,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
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

  it('should set initial configuration', () => {
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
  });

  it('should close', () => {
    component.onClose();

    expect(mockDialogRef.close).toHaveBeenCalled();
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
