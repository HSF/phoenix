import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistogramPanelOverlayComponent } from './histogram-panel-overlay.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';
import type { HistogramConfig } from 'phoenix-event-display';

describe('HistogramPanelOverlayComponent', () => {
  let component: HistogramPanelOverlayComponent;
  let fixture: ComponentFixture<HistogramPanelOverlayComponent>;

  const mockEventDisplay = {
    on: jest.fn().mockReturnValue(jest.fn()),
  };

  const config: HistogramConfig = {
    title: 'Invariant Mass',
    xlabel: 'Mass (GeV)',
    ylabel: 'Entries',
    nbins: 10,
    xmin: 0,
    xmax: 100,
    lineColor: 857,
    fillColor: 857,
    fillStyle: 1001,
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockEventDisplay.on.mockReturnValue(jest.fn());

    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [HistogramPanelOverlayComponent],
      providers: [{ provide: EventDisplayService, useValue: mockEventDisplay }],
    }).compileComponents();

    fixture = TestBed.createComponent(HistogramPanelOverlayComponent);
    component = fixture.componentInstance;
    component.config = config;
  });

  it('excludes out-of-range values from entries and mean', () => {
    component.ngOnInit();

    component.addValue(50); // in range
    component.addValue(500); // overflow, outside [0, 100]
    component.addValue(-20); // underflow, outside [0, 100]

    expect(component.entries).toBe(1);
    expect(component.mean).toBeCloseTo(50);
  });

  it('revokes the export object URL only after the download starts', () => {
    // jsdom does not implement the object URL API, so install stubs.
    const createSpy = jest.fn().mockReturnValue('blob:mock');
    const revokeSpy = jest.fn();
    const originalCreate = (URL as any).createObjectURL;
    const originalRevoke = (URL as any).revokeObjectURL;
    (URL as any).createObjectURL = createSpy;
    (URL as any).revokeObjectURL = revokeSpy;
    jest.useFakeTimers();

    try {
      component.ngOnInit();
      component.addValue(50);
      component.exportCSV();

      expect(createSpy).toHaveBeenCalled();
      // Revoking synchronously can cancel the in-flight download.
      expect(revokeSpy).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(revokeSpy).toHaveBeenCalledWith('blob:mock');
    } finally {
      jest.useRealTimers();
      (URL as any).createObjectURL = originalCreate;
      (URL as any).revokeObjectURL = originalRevoke;
    }
  });

  it('keeps localStorage bounded when many values arrive', () => {
    component.ngOnInit();

    for (let i = 0; i < 6000; i++) {
      component.addValue(50);
    }

    const saved = JSON.parse(
      localStorage.getItem((component as any).storageKey) as string,
    );
    expect(saved.length).toBeLessThanOrEqual(5000);
  });

  it('ignores persisted values that are out of range or not finite', () => {
    const key = 'phoenix-histogram-invariant-mass';
    localStorage.setItem(key, JSON.stringify([50, 500, -20, null, 'abc']));

    component.ngOnInit();

    expect(component.entries).toBe(1);
    expect(component.mean).toBeCloseTo(50);
  });

  it('cancels a queued redraw when the panel is hidden', () => {
    jest.useFakeTimers();
    component.ngOnInit();

    // Pretend the panel is drawn so addValue schedules a redraw.
    (component as any).drawn = true;
    (component as any).histogramDiv = {
      nativeElement: document.createElement('div'),
    };

    component.addValue(50);
    expect((component as any).redrawTimer).not.toBeNull();

    component.showHistogram = false;
    expect((component as any).redrawTimer).toBeNull();

    jest.useRealTimers();
  });

  it('unsubscribes from the event bus on destroy', () => {
    const unsubscribe = jest.fn();
    mockEventDisplay.on.mockReturnValueOnce(unsubscribe);

    component.ngOnInit();
    component.ngOnDestroy();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
