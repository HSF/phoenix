import { UIManager } from '../../../managers/ui-manager';
import { ThreeManager } from '../../../managers/three-manager';
import { Configuration } from '../../../lib/types/configuration';
import { PhoenixMenuNode } from '../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { PresetView } from '../../../lib/models/preset-view.model';
import { InfoLogger } from '../../../helpers/info-logger';

describe('UIManager', () => {
  let ui: UIManager;
  let uiPrivate: any;
  let three: ThreeManager;

  beforeEach(() => {
    three = new ThreeManager(new InfoLogger());
    ui = new UIManager(three);
    uiPrivate = ui as any;
  });

  it('should be created', () => {
    expect(ui).toBeTruthy();
  });

  describe('after being shown', () => {
    beforeEach(() => {
      const configuration: Configuration = {
        enableDatGUIMenu: true,
        phoenixMenuRoot: new PhoenixMenuNode('Root Phoenix Menu'),
      };
      ui.init(configuration);
    });

    it('should cover if no menu given', () => {
      ui.init({});
    });

    it('should show stats and dat.GUI menu', () => {
      ui.init({ enableDatGUIMenu: true });

      document.getElementById('eventDisplay')?.remove();
      uiPrivate.showStats();
      expect(document.querySelector('#statsElement')).toBeTruthy();
      expect(document.querySelector('#gui')).toBeTruthy();

      const eventDisplayCanvas = document.createElement('canvas');
      eventDisplayCanvas.id = 'eventDisplay';
      document.body.appendChild(eventDisplayCanvas);
      uiPrivate.showStats();
      expect(document.querySelector('#statsElement')).toBeTruthy();
    });

    it('update stats', () => {
      spyOn(uiPrivate.stats, 'update').and.callThrough();
      ui.updateUI();
      expect(uiPrivate.stats.update).toHaveBeenCalled();
    });

    it('should clear UI', () => {
      spyOn(uiPrivate.uiMenus[0], 'clear').and.stub();
      spyOn(uiPrivate.uiMenus[1], 'clear').and.stub();
      ui.clearUI();
      expect(uiPrivate.uiMenus[0].clear).toHaveBeenCalled();
      expect(uiPrivate.uiMenus[1].clear).toHaveBeenCalled();
    });

    it('should detect color scheme and theme and set theme', () => {
      localStorage.removeItem('theme');
      ui.detectColorScheme();
      if (matchMedia('(prefers-color-scheme: dark)')?.matches) {
        expect(ui.getDarkTheme()).toBeTrue();
      } else {
        expect(ui.getDarkTheme()).toBeFalse();
      }

      localStorage.setItem('theme', 'light');
      ui.detectColorScheme();
      expect(ui.getDarkTheme()).toBeFalse();

      localStorage.setItem('theme', 'dark');
      ui.detectColorScheme();
      expect(ui.getDarkTheme()).toBeTrue();

      ui.setDarkTheme(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should get preset views', () => {
      uiPrivate.configuration.presetViews = [
        new PresetView('Test', [10, 10, 10], [0, 0, 0], 'none'),
      ];
      expect(ui.getPresetViews().length).toBeGreaterThan(0);
      uiPrivate.configuration = undefined;
      expect(ui.getPresetViews()).toBeUndefined();
    });

    it('should call three service functions', () => {
      spyOn(three.getSceneManager(), 'objectVisibility').and.callThrough();
      ui.geometryVisibility('TestGeometry', false);
      expect(three.getSceneManager().objectVisibility).toHaveBeenCalled();

      spyOn(three, 'setClippingAngle').and.stub();
      ui.rotateOpeningAngleClipping(90);
      expect(three.setClippingAngle).toHaveBeenCalled();

      spyOn(three, 'setClipping').and.stub();
      ui.setClipping(true);
      expect(three.setClipping).toHaveBeenCalled();

      spyOn(three, 'autoRotate').and.stub();
      ui.setAutoRotate(true);
      expect(three.autoRotate).toHaveBeenCalled();

      spyOn(three, 'animateCameraTransform').and.stub();
      ui.displayView(
        new PresetView('Test View', [10, 10, 10], [0, 0, 0], 'no-icon')
      );
      expect(three.animateCameraTransform).toHaveBeenCalled();

      spyOn(three, 'swapCameras').and.stub();
      ui.toggleOrthographicView(true);
      expect(three.swapCameras).toHaveBeenCalled();

      spyOn(three, 'setOverlayRenderer').and.stub();
      ui.setOverlayRenderer(document.createElement('canvas'));
      expect(three.setOverlayRenderer).toHaveBeenCalled();
    });
  });
});
