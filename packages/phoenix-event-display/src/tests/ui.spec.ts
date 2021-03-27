import { UIManager } from '../ui';
import { ThreeManager } from '../three';
import { Configuration } from '../extras/configuration';
import { PhoenixMenuNode } from '../ui/phoenix-menu/phoenix-menu-node';
import { PresetView } from '../extras/preset-view.model';
import { InfoLogger } from '../info-logger';

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
      document.getElementById('eventDisplay')?.remove();
      uiPrivate.showStats();
      expect(document.querySelector('#statsElement')).toBeDefined();
      uiPrivate.showDatGUIMenu();
      expect(document.querySelector('#gui')).toBeDefined();

      const eventDisplayCanvas = document.createElement('canvas');
      eventDisplayCanvas.id = 'eventDisplay';
      document.body.appendChild(eventDisplayCanvas);
      uiPrivate.showStats();
      expect(document.querySelector('.statsElement')).toBeDefined();
      uiPrivate.showDatGUIMenu();
      expect(document.querySelector('#gui')).toBeDefined();
    });

    it('update stats', () => {
      spyOn(uiPrivate.stats, 'update').and.callThrough();
      ui.updateUI();
      expect(uiPrivate.stats.update).toHaveBeenCalled();
    });

    it('should clear UI', () => {
      document.querySelector('#gui')?.remove();
      ui.clearUI();
      expect(uiPrivate.geomFolder).toBe(null);
      const gui = document.createElement('div');
      gui.id = 'gui';
      document.body.appendChild(gui);
      ui.clearUI();
      expect(uiPrivate.geomFolder).toBe(null);
    });

    it('should remove OBJ', () => {
      uiPrivate.showDatGUIMenu();
      ui.addGeomFolder();
      const GEOM_NAME = 'Test Geometry';
      uiPrivate.geomFolder.addFolder(GEOM_NAME);
      expect(uiPrivate.geomFolder.__folders[GEOM_NAME]).toBeDefined();
      uiPrivate.removeOBJ(GEOM_NAME)();
      expect(uiPrivate.geomFolder.__folders[GEOM_NAME]).toBeUndefined();
      uiPrivate.removeOBJ(GEOM_NAME)();
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
        new PresetView('Test', [10, 10, 10], 'none'),
      ];
      expect(ui.getPresetViews().length).toBeGreaterThan(0);
      uiPrivate.configuration = undefined;
      expect(ui.getPresetViews()).toBeUndefined();
    });

    it('should get event data folder', () => {
      uiPrivate.eventFolder = uiPrivate.gui.addFolder('Event Data');
      ui.addEventDataFolder();
      expect(ui.getEventDataFolder()).toBeDefined();
    });

    it('should call three service functions', () => {
      spyOn(three.getSceneManager(), 'objectVisibility').and.callThrough();
      ui.geometryVisibility('TestGeometry', false);
      expect(three.getSceneManager().objectVisibility).toHaveBeenCalled();

      spyOn(three, 'rotateClipping').and.stub();
      ui.rotateClipping(90);
      expect(three.rotateClipping).toHaveBeenCalled();

      spyOn(three, 'setClipping').and.stub();
      ui.setClipping(true);
      expect(three.setClipping).toHaveBeenCalled();

      spyOn(three, 'autoRotate').and.stub();
      ui.setAutoRotate(true);
      expect(three.autoRotate).toHaveBeenCalled();

      spyOn(three, 'animateCameraTransform').and.stub();
      ui.displayView(new PresetView('Test View', [10, 10, 10], 'no-icon'));
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
