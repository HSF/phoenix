import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartesianGridConfigComponent } from './cartesian-grid-config.component';
import { EventDisplayService, PhoenixUIModule } from 'phoenix-ui-components';
import { MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';

describe('CartesianGridConfigComponent', () => {
  let component: CartesianGridConfigComponent;
  let fixture: ComponentFixture<CartesianGridConfigComponent>;

  const mockDialogRef = {
    close: jest.fn().mockReturnThis(),
  };

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: MatDialogRef<CartesianGridConfigComponent>,
          useValue: mockDialogRef,
        },
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [CartesianGridConfigComponent],
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
    const VALUE3 = mockEventDisplay.getUIManager().getCartesianGridConfig();
    component.ngOnInit();

    expect(component.showCartesianGrid).toBe(VALUE1);
    expect(component.scale).toBe(VALUE2);
    expect(component.gridConfig).toBe(VALUE3);
  });

  it('should close', () => {
    component.onClose();

    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should add XY Planes', () => {
    const event = new Event('number');
    (event.target as HTMLInputElement).value = '600';
    const VALUE = Number((event.target as HTMLInputElement).value);

    component.addXYPlanes(event);

    expect(component.gridConfig.zDistance).toBe(VALUE);
    expect(component.callSetShowCartesianGrid).toHaveBeenCalled();
  });

  it('should add YZ Planes', () => {
    const event = new Event('number');
    (event.target as HTMLInputElement).value = '600';
    const VALUE = Number((event.target as HTMLInputElement).value);

    component.addYZPlanes(event);

    expect(component.gridConfig.xDistance).toBe(VALUE);
    expect(component.callSetShowCartesianGrid).toHaveBeenCalled();
  });

  it('should add ZX Planes', () => {
    const event = new Event('number');
    (event.target as HTMLInputElement).value = '600';
    const VALUE = Number((event.target as HTMLInputElement).value);

    component.addZXPlanes(event);

    expect(component.gridConfig.yDistance).toBe(VALUE);
    expect(component.callSetShowCartesianGrid).toHaveBeenCalled();
  });

  it('should change sparsity', () => {
    const event = new Event('number');
    (event.target as HTMLInputElement).value = '2';
    const VALUE = Number((event.target as HTMLInputElement).value);

    component.changeSparsity(event);

    expect(component.gridConfig.sparsity).toBe(VALUE);
    expect(component.callSetShowCartesianGrid).toHaveBeenCalled();
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
