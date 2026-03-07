import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';
import type { PhoenixMenuNode } from 'phoenix-event-display';

export interface PaletteCommand {
  label: string;
  category: string;
  shortcut?: string;
  execute: () => void;
}

@Component({
  standalone: false,
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  isOpen = false;
  query = '';
  results: PaletteCommand[] = [];
  activeIndex = 0;

  private commands: PaletteCommand[] = [];
  private refreshTimer: any;
  private darkTheme = false;
  private clippingOn = false;
  private rotating = false;

  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.darkTheme = this.eventDisplay.getUIManager().getDarkTheme();
    this.registerBuiltInCommands();
    // Rebuild menu commands periodically until event data is loaded
    this.refreshTimer = setInterval(() => this.rebuildMenuCommands(), 2000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshTimer);
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
      e.preventDefault();
      this.toggle();
    } else if (e.code === 'Slash' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      this.toggle();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.query = '';
      this.activeIndex = 0;
      this.rebuildMenuCommands();
      this.results = this.getDefaultResults();
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
    }
  }

  close() {
    this.isOpen = false;
  }

  onSearch() {
    this.activeIndex = 0;
    if (!this.query.trim()) {
      this.results = this.getDefaultResults();
      return;
    }
    const q = this.query.toLowerCase();
    const scored = this.commands
      .map((cmd) => ({
        cmd,
        score: this.matchScore(cmd, q),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    this.results = scored.map((s) => s.cmd);
  }

  onKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex = Math.min(
          this.activeIndex + 1,
          this.results.length - 1,
        );
        this.scrollActiveIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        this.scrollActiveIntoView();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.results[this.activeIndex]) {
          this.execute(this.results[this.activeIndex]);
        }
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  execute(cmd: PaletteCommand) {
    cmd.execute();
    this.close();
  }

  setActive(index: number) {
    this.activeIndex = index;
  }

  private matchScore(cmd: PaletteCommand, query: string): number {
    const label = cmd.label.toLowerCase();
    const cat = cmd.category.toLowerCase();
    if (label === query) return 100;
    if (label.startsWith(query)) return 80;
    if (label.includes(query)) return 60;
    if (cat.includes(query)) return 30;
    // Fuzzy: check if all query chars appear in order
    let qi = 0;
    for (let i = 0; i < label.length && qi < query.length; i++) {
      if (label[i] === query[qi]) qi++;
    }
    return qi === query.length ? 20 : 0;
  }

  private scrollActiveIntoView() {
    setTimeout(() => {
      const el = document.querySelector('.command-result.active');
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  private getDefaultResults(): PaletteCommand[] {
    return this.commands.slice(0, 20);
  }

  private registerBuiltInCommands() {
    this.commands = [
      {
        label: 'Toggle Dark Theme',
        category: 'Action',
        shortcut: '⇧ T',
        execute: () => {
          this.darkTheme = !this.darkTheme;
          this.eventDisplay.getUIManager().setDarkTheme(this.darkTheme);
        },
      },
      {
        label: 'Toggle Auto Rotate',
        category: 'Action',
        shortcut: '⇧ R',
        execute: () => {
          this.rotating = !this.rotating;
          this.eventDisplay.getThreeManager().autoRotate(this.rotating);
        },
      },
      {
        label: 'Zoom In',
        category: 'Action',
        shortcut: '⇧ +',
        execute: () => this.eventDisplay.getThreeManager().zoomTo(1 / 1.2, 100),
      },
      {
        label: 'Zoom Out',
        category: 'Action',
        shortcut: '⇧ -',
        execute: () => this.eventDisplay.getThreeManager().zoomTo(1.2, 100),
      },
      {
        label: 'Toggle Clipping',
        category: 'Action',
        shortcut: '⇧ C',
        execute: () => {
          this.clippingOn = !this.clippingOn;
          const tm = this.eventDisplay.getThreeManager();
          tm.setClipping(this.clippingOn);
          if (this.clippingOn) tm.setClippingAngle(0, 180);
        },
      },
      {
        label: 'Reset Camera',
        category: 'Action',
        shortcut: '⇧ V',
        execute: () => this.eventDisplay.getThreeManager().revertMainCamera(),
      },
      {
        label: 'Toggle Cartesian Grid',
        category: 'View',
        execute: () => {
          const sm = this.eventDisplay.getThreeManager().getSceneManager();
          const grid = sm.getScene().getObjectByName('CartesianGrid');
          if (grid) sm.objectVisibility(grid, !grid.visible);
        },
      },
      {
        label: 'Toggle Axes',
        category: 'View',
        execute: () => {
          const sm = this.eventDisplay.getThreeManager().getSceneManager();
          const axes = sm.getScene().getObjectByName('Axes');
          if (axes) sm.objectVisibility(axes, !axes.visible);
        },
      },
    ];

    this.addPresetViews();
  }

  private addPresetViews() {
    const ui = this.eventDisplay.getUIManager();
    const views = ui?.getPresetViews?.();
    if (views) {
      views.forEach((view: any, i: number) => {
        this.commands.push({
          label: `View: ${view.label}`,
          category: 'View',
          shortcut: i < 9 ? `⇧ ${i + 1}` : undefined,
          execute: () => this.eventDisplay.getUIManager().displayView(view),
        });
      });
    }
  }

  private rebuildMenuCommands() {
    // Remove old dynamic commands
    this.commands = this.commands.filter(
      (c) => c.category !== 'Collection' && c.category !== 'Geometry',
    );

    const root = this.eventDisplay.getUIManager()?.getPhoenixMenuRoot?.();
    if (root && root.children.length > 0) {
      const prevCount = this.commands.length;
      this.walkTree(root);
      // Stop polling once tree is stable
      if (this.commands.length === prevCount && prevCount > 8) {
        clearInterval(this.refreshTimer);
      }
    }
  }

  private walkTree(node: PhoenixMenuNode, path: string = '') {
    for (const child of node.children) {
      const fullPath = path ? `${path} › ${child.name}` : child.name;
      const isGeometry = fullPath.startsWith('Detector');

      if (child.onToggle) {
        this.commands.push({
          label: fullPath,
          category: isGeometry ? 'Geometry' : 'Collection',
          execute: () => {
            const newState = !child.toggleState;
            child.toggleSelfAndDescendants(newState);
          },
        });
      }

      if (child.children.length > 0) {
        this.walkTree(child, fullPath);
      }
    }
  }
}
