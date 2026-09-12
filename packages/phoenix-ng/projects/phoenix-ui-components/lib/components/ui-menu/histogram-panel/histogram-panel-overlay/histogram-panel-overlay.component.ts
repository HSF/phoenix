import {
  Component,
  type OnInit,
  type OnDestroy,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  type HistogramConfig,
  ATLAS_MASS_HISTOGRAM,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';
import { createHistogram, gStyle } from 'jsroot';
import { draw, redraw } from 'jsroot/draw';

/** localStorage key prefix for histogram persistence. */
const STORAGE_PREFIX = 'phoenix-histogram-';

@Component({
  standalone: false,
  selector: 'app-histogram-panel-overlay',
  templateUrl: './histogram-panel-overlay.component.html',
  styleUrls: ['./histogram-panel-overlay.component.scss'],
})
export class HistogramPanelOverlayComponent implements OnInit, OnDestroy {
  /** Whether the histogram panel is visible. Uses setter to trigger draw on show. */
  private _showHistogram = false;
  @Input() set showHistogram(val: boolean) {
    const wasHidden = !this._showHistogram;
    this._showHistogram = val;
    if (val && wasHidden) {
      setTimeout(() => this.drawHistogram(), 0);
    } else if (!val) {
      this.drawn = false;
    }
  }
  get showHistogram(): boolean {
    return this._showHistogram;
  }

  @Input() config: HistogramConfig = ATLAS_MASS_HISTOGRAM;

  @ViewChild('histogramDiv') histogramDiv: ElementRef<HTMLDivElement>;

  entries = 0;
  mean = 0;
  private sumValues = 0;
  private rawValues: number[] = [];
  private histogram: any;
  private drawn = false;
  private unsubscribe: () => void;
  private redrawTimer: any = null;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    const c = this.config;
    this.histogram = createHistogram('TH1F', c.nbins);
    this.histogram.fName = 'hmass';
    this.histogram.fTitle = '';
    this.histogram.fXaxis.fXmin = c.xmin;
    this.histogram.fXaxis.fXmax = c.xmax;
    this.histogram.fXaxis.fTitle = c.xlabel;
    this.histogram.fYaxis.fTitle = c.ylabel;
    this.histogram.fLineColor = c.lineColor;
    this.histogram.fLineWidth = 0;
    this.histogram.fFillColor = c.fillColor;
    this.histogram.fFillStyle = c.fillStyle;

    // Disable stat box — BIT(9) = 512
    this.histogram.fBits = this.histogram.fBits | 512;

    // Restore any saved state from a previous session
    this.restoreFromStorage();

    const eventName = c.eventName ?? 'result-recorded';
    this.unsubscribe = this.eventDisplay.on(eventName, (data: any) => {
      if (data?.mass != null) {
        this.addValue(data.mass);
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
    if (this.redrawTimer) {
      clearTimeout(this.redrawTimer);
    }
  }

  /** Save gStyle, apply dark theme values, await callback, then restore gStyle. */
  private async withDarkGStyle(fn: () => Promise<any>): Promise<any> {
    const saved = {
      fCanvasColor: gStyle.fCanvasColor,
      fPadColor: gStyle.fPadColor,
      fFrameFillColor: gStyle.fFrameFillColor,
      fFrameLineColor: gStyle.fFrameLineColor,
    };

    // Dark theme: 1=black bg, 0=white text/lines
    gStyle.fCanvasColor = 1;
    gStyle.fPadColor = 1;
    gStyle.fFrameFillColor = 1;
    gStyle.fFrameLineColor = 0;

    try {
      return await fn();
    } finally {
      gStyle.fCanvasColor = saved.fCanvasColor;
      gStyle.fPadColor = saved.fPadColor;
      gStyle.fFrameFillColor = saved.fFrameFillColor;
      gStyle.fFrameLineColor = saved.fFrameLineColor;
    }
  }

  private async drawHistogram() {
    if (this.histogramDiv?.nativeElement && this.histogram) {
      // Set axis colors for dark theme directly on histogram object (not gStyle)
      this.histogram.fXaxis.fAxisColor = 0;
      this.histogram.fXaxis.fLabelColor = 0;
      this.histogram.fXaxis.fTitleColor = 0;
      this.histogram.fYaxis.fAxisColor = 0;
      this.histogram.fYaxis.fLabelColor = 0;
      this.histogram.fYaxis.fTitleColor = 0;

      await this.withDarkGStyle(() =>
        draw(this.histogramDiv.nativeElement, this.histogram, 'hist,no_stat'),
      );
      this.applyDarkTheme();
      this.drawn = true;
    }
  }

  /** Apply dark theme to jsroot SVG via direct DOM manipulation. */
  private applyDarkTheme() {
    const el = this.histogramDiv?.nativeElement;
    if (!el) return;

    const svg = el.querySelector('svg');
    if (svg) {
      svg.style.background = '#1a1a2e';
    }

    el.querySelectorAll('rect').forEach((rect: SVGRectElement) => {
      const fill = rect.getAttribute('fill');
      if (
        fill === 'white' ||
        fill === 'rgb(255, 255, 255)' ||
        fill === '#ffffff' ||
        fill === 'rgb(255,255,255)'
      ) {
        rect.setAttribute('fill', '#1a1a2e');
        rect.setAttribute('stroke', 'rgba(255,255,255,0.15)');
      }
    });

    el.querySelectorAll('line').forEach((line: SVGLineElement) => {
      const stroke = line.getAttribute('stroke');
      if (
        stroke === 'black' ||
        stroke === 'rgb(0, 0, 0)' ||
        stroke === '#000000' ||
        stroke === 'rgb(0,0,0)'
      ) {
        line.setAttribute('stroke', '#aaaaaa');
      }
    });

    el.querySelectorAll('path').forEach((path: SVGPathElement) => {
      const stroke = path.getAttribute('stroke');
      if (
        stroke === 'black' ||
        stroke === 'rgb(0, 0, 0)' ||
        stroke === '#000000' ||
        stroke === 'rgb(0,0,0)'
      ) {
        path.setAttribute('stroke', '#aaaaaa');
      }
    });

    el.querySelectorAll('text').forEach((text: SVGTextElement) => {
      const fill = text.getAttribute('fill');
      if (
        fill === 'black' ||
        fill === 'rgb(0, 0, 0)' ||
        fill === '#000000' ||
        fill === 'rgb(0,0,0)' ||
        !fill
      ) {
        text.setAttribute('fill', '#cccccc');
      }
    });
  }

  /** Add a value and schedule a debounced redraw. */
  addValue(value: number) {
    if (!this.histogram) return;
    this.histogram.Fill(value);
    this.rawValues.push(value);
    this.entries++;
    this.sumValues += value;
    this.mean = this.sumValues / this.entries;

    this.saveToStorage();

    if (this.drawn && this.histogramDiv?.nativeElement) {
      this.scheduleRedraw();
    }
  }

  /** Debounced redraw — coalesces rapid events (e.g. bulk load) into one repaint. */
  private scheduleRedraw() {
    if (this.redrawTimer) return;
    this.redrawTimer = setTimeout(async () => {
      this.redrawTimer = null;
      if (this.drawn && this.histogramDiv?.nativeElement) {
        await this.withDarkGStyle(() =>
          redraw(
            this.histogramDiv.nativeElement,
            this.histogram,
            'hist,no_stat',
          ),
        );
        this.applyDarkTheme();
      }
    }, 50);
  }

  /** Reset histogram after user confirmation. */
  resetHistogram() {
    if (this.entries === 0) return;
    if (!confirm(`Clear all ${this.entries} entries? This cannot be undone.`)) {
      return;
    }
    this.clearHistogram();
  }

  /** Clear all histogram data and redraw. */
  private async clearHistogram() {
    if (!this.histogram) return;
    for (let i = 0; i < this.histogram.fArray.length; i++) {
      this.histogram.fArray[i] = 0;
    }
    this.histogram.fEntries = 0;
    this.entries = 0;
    this.mean = 0;
    this.sumValues = 0;
    this.rawValues = [];

    this.clearStorage();

    if (this.drawn && this.histogramDiv?.nativeElement) {
      await this.withDarkGStyle(() =>
        redraw(this.histogramDiv.nativeElement, this.histogram, 'hist,no_stat'),
      );
      this.applyDarkTheme();
    }
  }

  /** Get hint line position as percentage of the wrapper, accounting for jsroot pad margins. */
  getHintPosition(mass: number): number {
    const c = this.config;
    const padLeft = 0.1; // jsroot default pad left margin
    const padRight = 0.1; // jsroot default pad right margin
    const fraction = (mass - c.xmin) / (c.xmax - c.xmin);
    return (padLeft + fraction * (1 - padLeft - padRight)) * 100;
  }

  /** Format hint label with mass value and unit for readability. */
  getHintLabel(hint: { mass: number; label: string }): string {
    const massStr =
      hint.mass >= 10
        ? hint.mass.toFixed(1)
        : hint.mass.toFixed(hint.mass < 1 ? 2 : 1);
    return `${hint.label} (${massStr} GeV)`;
  }

  /** Export histogram data as TSV. */
  exportCSV() {
    if (!this.histogram) return;
    const c = this.config;
    const binWidth = (c.xmax - c.xmin) / c.nbins;
    let tsv = 'bin_low\tbin_high\tentries\n';
    for (let i = 1; i <= c.nbins; i++) {
      const low = c.xmin + (i - 1) * binWidth;
      const high = low + binWidth;
      const content = this.histogram.fArray[i] || 0;
      tsv += `${low.toFixed(2)}\t${high.toFixed(2)}\t${content}\n`;
    }

    const filename = c.title.toLowerCase().replace(/\s+/g, '_') + '_data.tsv';
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- localStorage persistence ---

  /** Storage key derived from config title to avoid collisions between configs. */
  private get storageKey(): string {
    return (
      STORAGE_PREFIX + this.config.title.toLowerCase().replace(/\s+/g, '-')
    );
  }

  /** Save raw values to localStorage for crash recovery. */
  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.rawValues));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }

  /** Restore histogram state from localStorage. */
  private restoreFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return;

      const values: number[] = JSON.parse(saved);
      if (!Array.isArray(values) || values.length === 0) return;

      for (const v of values) {
        this.histogram.Fill(v);
        this.rawValues.push(v);
        this.entries++;
        this.sumValues += v;
      }
      this.mean = this.sumValues / this.entries;
    } catch {
      // Corrupted data — start fresh
    }
  }

  /** Clear saved state from localStorage. */
  private clearStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore
    }
  }
}
