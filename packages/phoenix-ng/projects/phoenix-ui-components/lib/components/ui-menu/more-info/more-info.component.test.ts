import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MoreInfoComponent } from './more-info.component';

describe('MoreInfoComponent', () => {
  let component: MoreInfoComponent;
  let fixture: ComponentFixture<MoreInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MoreInfoComponent],
      imports: [MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoreInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle info panel overlay', () => {
    const mockInfoPanel = {
      toggleOverlay: jest.fn(),
    } as any;
    component.infoPanel = mockInfoPanel;

    expect(component.showInfoPanel).toBe(false);
    component.toggleInfoPanel();
    expect(component.showInfoPanel).toBe(true);
    expect(mockInfoPanel.toggleOverlay).toHaveBeenCalledTimes(1);

    component.toggleInfoPanel();
    expect(component.showInfoPanel).toBe(false);
    expect(mockInfoPanel.toggleOverlay).toHaveBeenCalledTimes(2);
  });

  it('should toggle eta-phi panel overlay', () => {
    const mockEtaPhiPanel = {
      toggleOverlay: jest.fn(),
    } as any;
    component.etaPhiPanel = mockEtaPhiPanel;

    expect(component.showEtaPhiPanel).toBe(false);
    component.toggleEtaPhiPanel();
    expect(component.showEtaPhiPanel).toBe(true);
    expect(mockEtaPhiPanel.toggleOverlay).toHaveBeenCalledTimes(1);

    component.toggleEtaPhiPanel();
    expect(component.showEtaPhiPanel).toBe(false);
    expect(mockEtaPhiPanel.toggleOverlay).toHaveBeenCalledTimes(2);
  });

  it('should toggle kinematics panel overlay', () => {
    const mockKinematicsPanel = {
      toggleOverlay: jest.fn(),
    } as any;
    component.kinematicsPanel = mockKinematicsPanel;

    expect(component.showKinematicsPanel).toBe(false);
    component.toggleKinematicsPanel();
    expect(component.showKinematicsPanel).toBe(true);
    expect(mockKinematicsPanel.toggleOverlay).toHaveBeenCalledTimes(1);

    component.toggleKinematicsPanel();
    expect(component.showKinematicsPanel).toBe(false);
    expect(mockKinematicsPanel.toggleOverlay).toHaveBeenCalledTimes(2);
  });

  it('should not throw if child view reference is undefined on toggle', () => {
    component.infoPanel = undefined;
    component.etaPhiPanel = undefined;
    component.kinematicsPanel = undefined;

    expect(() => component.toggleInfoPanel()).not.toThrow();
    expect(() => component.toggleEtaPhiPanel()).not.toThrow();
    expect(() => component.toggleKinematicsPanel()).not.toThrow();
  });
});
