import { Component } from '@angular/core';
import { CommandPaletteService } from '../../../services/command-palette.service';

/**
 * Toolbar button that opens the command palette (#942). Gives the palette a
 * visible, discoverable entry point next to the other toolbar actions, so
 * students who would never guess the Ctrl/Cmd+K shortcut can still find it.
 * Delegates to {@link CommandPaletteService} so it needs no direct reference to
 * the palette component.
 */
@Component({
  standalone: false,
  selector: 'app-command-palette-toggle',
  templateUrl: './command-palette-toggle.component.html',
})
export class CommandPaletteToggleComponent {
  /**
   * @param commandPalette Bridge used to request the palette open.
   */
  constructor(private commandPalette: CommandPaletteService) {}

  /** Open the command palette. */
  openPalette(): void {
    this.commandPalette.open();
  }
}
