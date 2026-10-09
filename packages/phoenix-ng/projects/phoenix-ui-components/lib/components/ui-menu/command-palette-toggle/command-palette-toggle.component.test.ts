import { CommandPaletteToggleComponent } from './command-palette-toggle.component';
import { CommandPaletteService } from '../../../services/command-palette.service';

describe('CommandPaletteToggleComponent', () => {
  it('requests the palette open through the service on click', () => {
    const service = new CommandPaletteService();
    const open = jest.fn();
    service.openRequested.subscribe(open);
    const toggle = new CommandPaletteToggleComponent(service);

    toggle.openPalette();

    expect(open).toHaveBeenCalledTimes(1);
  });
});
