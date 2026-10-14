import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { BrowsersComponent } from './browsers.component';

describe('BrowsersComponent', () => {
  let component: BrowsersComponent;
  let fixture: ComponentFixture<BrowsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BrowsersComponent],
      imports: [MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle event browser overlay', () => {
    const mockEventBrowser = {
      toggleOverlay: jest.fn(),
    } as any;
    component.eventBrowser = mockEventBrowser;

    expect(component.showEventBrowser).toBe(false);
    component.toggleEventBrowser();
    expect(component.showEventBrowser).toBe(true);
    expect(mockEventBrowser.toggleOverlay).toHaveBeenCalledTimes(1);

    component.toggleEventBrowser();
    expect(component.showEventBrowser).toBe(false);
    expect(mockEventBrowser.toggleOverlay).toHaveBeenCalledTimes(2);
  });

  it('should toggle collections info overlay', () => {
    const mockCollectionsInfo = {
      toggleOverlay: jest.fn(),
    } as any;
    component.collectionsInfo = mockCollectionsInfo;

    expect(component.showCollectionsInfo).toBe(false);
    component.toggleCollectionsInfo();
    expect(component.showCollectionsInfo).toBe(true);
    expect(mockCollectionsInfo.toggleOverlay).toHaveBeenCalledTimes(1);

    component.toggleCollectionsInfo();
    expect(component.showCollectionsInfo).toBe(false);
    expect(mockCollectionsInfo.toggleOverlay).toHaveBeenCalledTimes(2);
  });

  it('should toggle geometry browser overlay', () => {
    const mockGeometryBrowser = {
      toggleOverlay: jest.fn(),
    } as any;
    component.geometryBrowser = mockGeometryBrowser;

    expect(component.showGeometryBrowser).toBe(false);
    component.toggleGeometryBrowser();
    expect(component.showGeometryBrowser).toBe(true);
    expect(mockGeometryBrowser.toggleOverlay).toHaveBeenCalledTimes(1);

    component.toggleGeometryBrowser();
    expect(component.showGeometryBrowser).toBe(false);
    expect(mockGeometryBrowser.toggleOverlay).toHaveBeenCalledTimes(2);
  });

  it('should not throw if child view reference is undefined on toggle', () => {
    component.eventBrowser = undefined;
    component.collectionsInfo = undefined;
    component.geometryBrowser = undefined;

    expect(() => component.toggleEventBrowser()).not.toThrow();
    expect(() => component.toggleCollectionsInfo()).not.toThrow();
    expect(() => component.toggleGeometryBrowser()).not.toThrow();
  });
});
