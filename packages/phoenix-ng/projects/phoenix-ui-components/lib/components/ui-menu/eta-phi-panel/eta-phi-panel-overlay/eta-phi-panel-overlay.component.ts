import {
  Component,
  Input,
  ViewChild,
  type ElementRef,
  type OnInit,
  type OnDestroy,
  type AfterViewInit,
} from '@angular/core';
import {
  DEFAULT_ETA_PHI_CONFIG,
  type EtaPhiConfig,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

/** Binned grid cell for internal use. */
interface GridCell {
  energy: number;
  etaCenter: number;
  phiCenter: number;
}

/** Lightweight overlay marker. */
interface OverlayMarker {
  eta: number;
  phi: number;
  label: string;
  color: string;
  radius?: number;
  uuid?: string;
  type: 'jet' | 'track' | 'muon' | 'electron' | 'photon' | 'met';
}

@Component({
  standalone: false,
  selector: 'app-eta-phi-panel-overlay',
  templateUrl: './eta-phi-panel-overlay.component.html',
  styleUrls: ['./eta-phi-panel-overlay.component.scss'],
})
export class EtaPhiPanelOverlayComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() showPanel = false;
  @ViewChild('etaPhiCanvas') canvasRef: ElementRef<HTMLCanvasElement>;
  @ViewChild('colorBarCanvas') colorBarRef: ElementRef<HTMLCanvasElement>;

  logScale = true;
  showOverlays = true;
  colorBarMin = '0';
  colorBarMax = '0';

  private config: Required<EtaPhiConfig> = { ...DEFAULT_ETA_PHI_CONFIG };
  private grid: GridCell[][] = [];
  private markers: OverlayMarker[] = [];
  private maxEnergy = 0;
  private unsubscribes: (() => void)[] = [];
  private viewReady = false;
  private currentTooltip: string | null = null;
  private tooltipPx = 0;
  private tooltipPy = 0;

  // Canvas layout constants (pixels)
  private readonly MARGIN = { top: 10, right: 10, bottom: 30, left: 45 };

  // Bound event handlers for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseLeave: () => void;
  private boundClick: (e: MouseEvent) => void;

  constructor(private eventDisplay: EventDisplayService) {
    this.boundMouseMove = (e) => this.onMouseMove(e);
    this.boundMouseLeave = () => this.onMouseLeave();
    this.boundClick = (e) => this.onCanvasClick(e);
  }

  ngOnInit() {
    this.unsubscribes.push(
      this.eventDisplay.listenToDisplayedEventChange(() => {
        this.rebuildData();
      }),
    );
  }

  ngAfterViewInit() {
    this.viewReady = true;
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.addEventListener('mousemove', this.boundMouseMove);
      canvas.addEventListener('mouseleave', this.boundMouseLeave);
      canvas.addEventListener('click', this.boundClick);
    }
    // Initial draw if data is already loaded
    setTimeout(() => this.rebuildData(), 100);
  }

  ngOnDestroy() {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.boundMouseMove);
      canvas.removeEventListener('mouseleave', this.boundMouseLeave);
      canvas.removeEventListener('click', this.boundClick);
    }
    this.unsubscribes.forEach((fn) => fn?.());
  }

  toggleLogScale() {
    this.logScale = !this.logScale;
    this.config.logScale = this.logScale;
    this.draw();
  }

  toggleOverlays() {
    this.showOverlays = !this.showOverlays;
    this.draw();
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;

    const hit = this.pixelToEtaPhi(px, py);
    if (!hit) {
      if (this.currentTooltip) {
        this.currentTooltip = null;
        this.draw();
      }
      return;
    }

    // Check overlay markers first
    const marker = this.findMarkerAt(hit.eta, hit.phi);
    if (marker) {
      this.currentTooltip = marker.label;
      this.tooltipPx = px;
      this.tooltipPy = py;
      this.draw();
      return;
    }

    // Check grid bin
    const bin = this.getBin(hit.eta, hit.phi);
    if (bin && bin.energy > 0) {
      const eGeV = (bin.energy / 1000).toFixed(1);
      this.currentTooltip = `E: ${eGeV} GeV  \u03B7: ${bin.etaCenter.toFixed(2)}  \u03C6: ${bin.phiCenter.toFixed(2)}`;
      this.tooltipPx = px;
      this.tooltipPy = py;
    } else {
      this.currentTooltip = null;
    }
    this.draw();
  }

  private onMouseLeave() {
    if (this.currentTooltip) {
      this.currentTooltip = null;
      this.draw();
    }
  }

  private onCanvasClick(event: MouseEvent) {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;

    const hit = this.pixelToEtaPhi(px, py);
    if (!hit) return;

    const marker = this.findMarkerAt(hit.eta, hit.phi);
    if (marker?.uuid) {
      this.eventDisplay.highlightObject(marker.uuid);
      this.eventDisplay.lookAtObject(marker.uuid);
    }
  }

  // --- Data extraction ---

  private rebuildData() {
    this.buildGrid();
    this.buildMarkers();
    this.draw();
  }

  private buildGrid() {
    const { etaRange, phiRange, etaBins, phiBins, energyThreshold } =
      this.config;
    const etaStep = (etaRange[1] - etaRange[0]) / etaBins;
    const phiStep = (phiRange[1] - phiRange[0]) / phiBins;

    // Initialize grid
    this.grid = [];
    for (let ei = 0; ei < etaBins; ei++) {
      this.grid[ei] = [];
      for (let pi = 0; pi < phiBins; pi++) {
        this.grid[ei][pi] = {
          energy: 0,
          etaCenter: etaRange[0] + (ei + 0.5) * etaStep,
          phiCenter: phiRange[0] + (pi + 0.5) * phiStep,
        };
      }
    }

    // Fill from CaloCells and CaloClusters
    const collections = this.eventDisplay.getCollections();
    const caloTypes = ['CaloCells', 'CaloClusters'];

    for (const caloType of caloTypes) {
      if (!collections[caloType]) continue;
      for (const collName of collections[caloType]) {
        const items = this.eventDisplay.getCollection(collName);
        if (!items) continue;
        for (const cell of items) {
          if (cell.eta == null || cell.phi == null || cell.energy == null) {
            continue;
          }
          if (cell.energy <= energyThreshold) continue;

          const ei = Math.floor(
            ((cell.eta - etaRange[0]) / (etaRange[1] - etaRange[0])) * etaBins,
          );
          const pi = Math.floor(
            ((cell.phi - phiRange[0]) / (phiRange[1] - phiRange[0])) * phiBins,
          );

          if (ei >= 0 && ei < etaBins && pi >= 0 && pi < phiBins) {
            this.grid[ei][pi].energy += cell.energy;
          }
        }
      }
    }

    // Find max energy for color scaling
    this.maxEnergy = 0;
    for (let ei = 0; ei < etaBins; ei++) {
      for (let pi = 0; pi < phiBins; pi++) {
        if (this.grid[ei][pi].energy > this.maxEnergy) {
          this.maxEnergy = this.grid[ei][pi].energy;
        }
      }
    }
  }

  private buildMarkers() {
    this.markers = [];
    const collections = this.eventDisplay.getCollections();

    // Jets
    if (collections['Jets']) {
      for (const collName of collections['Jets']) {
        const jets = this.eventDisplay.getCollection(collName);
        if (!jets) continue;
        jets.forEach((jet: any, i: number) => {
          if (jet.eta == null || jet.phi == null) return;
          this.markers.push({
            eta: jet.eta,
            phi: jet.phi,
            label: `Jet ${i + 1}: E=${((jet.energy ?? jet.et ?? 0) / 1000).toFixed(0)} GeV`,
            color: '#f5c542',
            radius: jet.coneR ?? 0.4,
            uuid: jet.uuid,
            type: 'jet',
          });
        });
      }
    }

    // Muons
    if (collections['Muons']) {
      for (const collName of collections['Muons']) {
        const muons = this.eventDisplay.getCollection(collName);
        if (!muons) continue;
        muons.forEach((mu: any, i: number) => {
          if (mu.eta == null || mu.phi == null) return;
          this.markers.push({
            eta: mu.eta,
            phi: mu.phi,
            label: `Muon ${i + 1}: pT=${((mu.pT ?? 0) / 1000).toFixed(0)} GeV`,
            color: '#ff4444',
            uuid: mu.uuid,
            type: 'muon',
          });
        });
      }
    }

    // Electrons
    if (collections['Electrons']) {
      for (const collName of collections['Electrons']) {
        const electrons = this.eventDisplay.getCollection(collName);
        if (!electrons) continue;
        electrons.forEach((el: any, i: number) => {
          if (el.eta == null || el.phi == null) return;
          this.markers.push({
            eta: el.eta,
            phi: el.phi,
            label: `Electron ${i + 1}: pT=${((el.pT ?? 0) / 1000).toFixed(0)} GeV`,
            color: '#44ff44',
            uuid: el.uuid,
            type: 'electron',
          });
        });
      }
    }

    // Photons
    if (collections['Photons']) {
      for (const collName of collections['Photons']) {
        const photons = this.eventDisplay.getCollection(collName);
        if (!photons) continue;
        photons.forEach((ph: any, i: number) => {
          if (ph.eta == null || ph.phi == null) return;
          this.markers.push({
            eta: ph.eta,
            phi: ph.phi,
            label: `Photon ${i + 1}: E=${((ph.energy ?? 0) / 1000).toFixed(0)} GeV`,
            color: '#ffff44',
            uuid: ph.uuid,
            type: 'photon',
          });
        });
      }
    }

    // Tracks (derive eta/phi from dparams if needed)
    if (collections['Tracks']) {
      for (const collName of collections['Tracks']) {
        const tracks = this.eventDisplay.getCollection(collName);
        if (!tracks) continue;
        tracks.forEach((trk: any, i: number) => {
          let eta = trk.eta;
          let phi = trk.phi;
          if (eta == null && trk.dparams) {
            const theta = trk.dparams[3];
            eta = -Math.log(Math.tan(theta / 2));
            phi = trk.dparams[2];
          }
          if (eta == null || phi == null) return;
          this.markers.push({
            eta,
            phi,
            label: `Track ${i + 1}: pT=${((trk.pT ?? (trk.dparams ? Math.abs(1 / trk.dparams[4]) * Math.sin(trk.dparams[3]) : 0)) / 1000).toFixed(1)} GeV`,
            color: '#ff8800',
            uuid: trk.uuid,
            type: 'track',
          });
        });
      }
    }

    // MET
    if (collections['MissingEnergy']) {
      for (const collName of collections['MissingEnergy']) {
        const metItems = this.eventDisplay.getCollection(collName);
        if (!metItems) continue;
        for (const met of metItems) {
          if (met.etx == null || met.ety == null) continue;
          const metPhi = Math.atan2(met.ety, met.etx);
          const metMag = Math.sqrt(met.etx * met.etx + met.ety * met.ety);
          this.markers.push({
            eta: 0,
            phi: metPhi,
            label: `MET: ${(metMag / 1000).toFixed(0)} GeV`,
            color: '#ff0066',
            uuid: met.uuid,
            type: 'met',
          });
        }
      }
    }
  }

  // --- Drawing ---

  private draw() {
    if (!this.viewReady || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const m = this.MARGIN;
    const plotW = w - m.left - m.right;
    const plotH = h - m.top - m.bottom;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw heatmap
    const { etaBins, phiBins } = this.config;
    const cellW = plotW / etaBins;
    const cellH = plotH / phiBins;

    for (let ei = 0; ei < etaBins; ei++) {
      for (let pi = 0; pi < phiBins; pi++) {
        const energy = this.grid[ei]?.[pi]?.energy ?? 0;
        if (energy <= 0) continue;
        ctx.fillStyle = this.energyToColor(energy);
        ctx.fillRect(
          m.left + ei * cellW,
          m.top + (phiBins - 1 - pi) * cellH,
          Math.ceil(cellW),
          Math.ceil(cellH),
        );
      }
    }

    // Overlays
    if (this.showOverlays) {
      this.drawMarkers(ctx, plotW, plotH);
    }

    // Axes
    this.drawAxes(ctx, h, plotW, plotH);

    // Tooltip (drawn last so it's on top)
    if (this.currentTooltip) {
      this.drawTooltip(
        ctx,
        this.tooltipPx,
        this.tooltipPy,
        this.currentTooltip,
      );
    }

    // Color bar
    this.drawColorBar();
  }

  private drawTooltip(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    text: string,
  ) {
    ctx.font = '11px monospace';
    const metrics = ctx.measureText(text);
    const padX = 6;
    const padY = 4;
    const boxW = metrics.width + padX * 2;
    const boxH = 16 + padY * 2;

    // Position: offset right and up from cursor, clamp to canvas
    let x = px + 14;
    let y = py - boxH / 2;
    const canvas = this.canvasRef.nativeElement;
    if (x + boxW > canvas.width) x = px - boxW - 6;
    if (y < 0) y = 2;
    if (y + boxH > canvas.height) y = canvas.height - boxH - 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 3);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(text, x + padX, y + padY + 12);
  }

  private drawMarkers(
    ctx: CanvasRenderingContext2D,
    plotW: number,
    plotH: number,
  ) {
    const m = this.MARGIN;
    const { etaRange, phiRange } = this.config;

    for (const mk of this.markers) {
      const px =
        m.left + ((mk.eta - etaRange[0]) / (etaRange[1] - etaRange[0])) * plotW;
      const py =
        m.top +
        (1 - (mk.phi - phiRange[0]) / (phiRange[1] - phiRange[0])) * plotH;

      if (mk.type === 'jet' && mk.radius) {
        // Draw jet cone as circle in eta-phi space
        const rEta = (mk.radius / (etaRange[1] - etaRange[0])) * plotW;
        const rPhi = (mk.radius / (phiRange[1] - phiRange[0])) * plotH;
        ctx.beginPath();
        ctx.ellipse(px, py, rEta, rPhi, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = mk.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Label
        ctx.fillStyle = mk.color;
        ctx.font = '10px monospace';
        ctx.fillText(
          `J${this.markers.filter((m) => m.type === 'jet').indexOf(mk) + 1}`,
          px + rEta + 2,
          py + 3,
        );
      } else if (mk.type === 'met') {
        // Draw MET as arrow at eta=0
        ctx.beginPath();
        ctx.strokeStyle = mk.color;
        ctx.lineWidth = 2;
        const arrowLen = 20;
        ctx.moveTo(px, py);
        ctx.lineTo(px, py - arrowLen);
        // Arrowhead
        ctx.moveTo(px - 4, py - arrowLen + 6);
        ctx.lineTo(px, py - arrowLen);
        ctx.lineTo(px + 4, py - arrowLen + 6);
        ctx.stroke();
        ctx.fillStyle = mk.color;
        ctx.font = '9px monospace';
        ctx.fillText('MET', px + 5, py);
      } else {
        // Point marker for tracks, muons, electrons, photons
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fillStyle = mk.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  private drawAxes(
    ctx: CanvasRenderingContext2D,
    h: number,
    plotW: number,
    plotH: number,
  ) {
    const m = this.MARGIN;
    const { etaRange, phiRange } = this.config;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;

    // Plot border
    ctx.strokeRect(m.left, m.top, plotW, plotH);

    // Axis labels
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';

    // Eta labels (bottom)
    const etaTicks = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    for (const eta of etaTicks) {
      if (eta < etaRange[0] || eta > etaRange[1]) continue;
      const x =
        m.left + ((eta - etaRange[0]) / (etaRange[1] - etaRange[0])) * plotW;
      ctx.fillText(eta.toString(), x, h - m.bottom + 16);
      // Tick mark
      ctx.beginPath();
      ctx.moveTo(x, m.top + plotH);
      ctx.lineTo(x, m.top + plotH + 4);
      ctx.stroke();
    }
    ctx.fillText('\u03B7', m.left + plotW / 2, h - 2);

    // Phi labels (left)
    ctx.textAlign = 'right';
    const phiTicks = [
      { val: -Math.PI, label: '-\u03C0' },
      { val: -Math.PI / 2, label: '-\u03C0/2' },
      { val: 0, label: '0' },
      { val: Math.PI / 2, label: '\u03C0/2' },
      { val: Math.PI, label: '\u03C0' },
    ];
    for (const tick of phiTicks) {
      if (tick.val < phiRange[0] || tick.val > phiRange[1]) continue;
      const y =
        m.top +
        (1 - (tick.val - phiRange[0]) / (phiRange[1] - phiRange[0])) * plotH;
      ctx.fillText(tick.label, m.left - 4, y + 4);
      // Tick mark
      ctx.beginPath();
      ctx.moveTo(m.left - 4, y);
      ctx.lineTo(m.left, y);
      ctx.stroke();
    }
    // Phi axis label (rotated)
    ctx.save();
    ctx.translate(10, m.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('\u03C6', 0, 0);
    ctx.restore();
  }

  private drawColorBar() {
    if (!this.colorBarRef) return;
    const canvas = this.colorBarRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    for (let x = 0; x < w; x++) {
      const t = x / w;
      const energy = this.logScale
        ? Math.pow(this.maxEnergy, t)
        : t * this.maxEnergy;
      ctx.fillStyle = this.energyToColor(energy);
      ctx.fillRect(x, 0, 1, h);
    }

    this.colorBarMin = '0 GeV';
    this.colorBarMax = `${(this.maxEnergy / 1000).toFixed(0)} GeV`;
  }

  // --- Color mapping ---

  private energyToColor(energy: number): string {
    if (energy <= 0 || this.maxEnergy <= 0) return 'transparent';

    let t: number;
    if (this.logScale) {
      t = Math.log10(1 + energy) / Math.log10(1 + this.maxEnergy);
    } else {
      t = energy / this.maxEnergy;
    }
    t = Math.max(0, Math.min(1, t));

    // Sequential warm: dark blue -> blue -> cyan -> yellow -> red -> white
    // Physically meaningful: higher energy = hotter
    if (t < 0.2) {
      const s = t / 0.2;
      return `rgb(${Math.round(s * 30)}, ${Math.round(s * 20)}, ${Math.round(80 + s * 80)})`;
    } else if (t < 0.4) {
      const s = (t - 0.2) / 0.2;
      return `rgb(${Math.round(30 + s * 20)}, ${Math.round(20 + s * 140)}, ${Math.round(160 - s * 20)})`;
    } else if (t < 0.6) {
      const s = (t - 0.4) / 0.2;
      return `rgb(${Math.round(50 + s * 200)}, ${Math.round(160 + s * 90)}, ${Math.round(140 - s * 100)})`;
    } else if (t < 0.8) {
      const s = (t - 0.6) / 0.2;
      return `rgb(${Math.round(250)}, ${Math.round(250 - s * 150)}, ${Math.round(40 - s * 40)})`;
    } else {
      const s = (t - 0.8) / 0.2;
      return `rgb(255, ${Math.round(100 + s * 155)}, ${Math.round(s * 255)})`;
    }
  }

  // --- Hit testing ---

  private pixelToEtaPhi(
    px: number,
    py: number,
  ): { eta: number; phi: number } | null {
    const m = this.MARGIN;
    const canvas = this.canvasRef.nativeElement;
    const plotW = canvas.width - m.left - m.right;
    const plotH = canvas.height - m.top - m.bottom;

    const x = px - m.left;
    const y = py - m.top;
    if (x < 0 || x > plotW || y < 0 || y > plotH) return null;

    const { etaRange, phiRange } = this.config;
    const eta = etaRange[0] + (x / plotW) * (etaRange[1] - etaRange[0]);
    const phi = phiRange[1] - (y / plotH) * (phiRange[1] - phiRange[0]);
    return { eta, phi };
  }

  private getBin(eta: number, phi: number): GridCell | null {
    const { etaRange, phiRange, etaBins, phiBins } = this.config;
    const ei = Math.floor(
      ((eta - etaRange[0]) / (etaRange[1] - etaRange[0])) * etaBins,
    );
    const pi = Math.floor(
      ((phi - phiRange[0]) / (phiRange[1] - phiRange[0])) * phiBins,
    );
    if (ei < 0 || ei >= etaBins || pi < 0 || pi >= phiBins) return null;
    return this.grid[ei]?.[pi] ?? null;
  }

  private findMarkerAt(eta: number, phi: number): OverlayMarker | null {
    // Hit radius in eta-phi space
    const hitR = 0.15;
    for (const mk of this.markers) {
      const de = mk.eta - eta;
      const dp = mk.phi - phi;
      if (Math.sqrt(de * de + dp * dp) < (mk.radius ?? hitR)) {
        return mk;
      }
    }
    return null;
  }
}
