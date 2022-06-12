import { EventDisplay } from '../event-display';
import { ThreeManager } from '../managers/three-manager';
import { UIManager } from '../managers/ui-manager';
import { XRSessionType } from '../managers/three-manager/xr/xr-manager';
import { ScriptLoader } from '../loaders/script-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';
import { Object3D } from 'three';

describe('EventDisplay', () => {
  let eventDisplay: EventDisplay;
  let eventDisplayPrivate: any;
  let three: ThreeManager;
  let ui: UIManager;

  const MOCK_OBJECT = new Object3D();
  const EVENT_KEY = 'Event Key';
  const MOCK_EVENT_DATA = {
    'Event Key': {
      eventNumber: 111,
      runNumber: 111,
      Tracks: {
        TracksCollection: [
          {
            chi2: 34.0819,
            dof: 60,
            dparams: [0.455548, -5.65437, -2.52317, 0.280894, -2.3769e-5],
            color: '0x0000ff',
            pos: [[-21.8387, -16.2481, 68.9534]],
          },
        ],
      },
    },
  };

  beforeEach(() => {
    eventDisplay = new EventDisplay();
    eventDisplayPrivate = eventDisplay as any;
    three = eventDisplay.getThreeManager();
    ui = eventDisplay.getUIManager();
  });

  it('should be created', () => {
    expect(eventDisplay).toBeTruthy();
  });

  it('should initialize event display', () => {
    spyOn(three, 'init').and.callThrough();
    spyOn(ui, 'init').and.callThrough();

    eventDisplay.init({
      eventDataLoader: new PhoenixLoader(),
    });

    expect(three.init).toHaveBeenCalled();
    expect(ui.init).toHaveBeenCalled();
  });

  describe('after init', () => {
    beforeEach(() => {
      eventDisplay.init({
        eventDataLoader: new PhoenixLoader(),
      });
    });

    it('should parse event data in phoenix format and call on event change functions', () => {
      const mockCallbackOnEventsChange = jasmine.createSpy('callback');
      eventDisplay.listenToLoadedEventsChange(mockCallbackOnEventsChange);

      expect(eventDisplay.parsePhoenixEvents(MOCK_EVENT_DATA)[0]).toBe(
        EVENT_KEY
      );

      expect(mockCallbackOnEventsChange).toHaveBeenCalled();
    });

    it('should build event data from JSON through event data loader and call on event change functions', () => {
      const mockCallbackOnEventsChange = jasmine.createSpy('callback');
      eventDisplay.listenToDisplayedEventChange(mockCallbackOnEventsChange);

      spyOn(
        eventDisplayPrivate.configuration.eventDataLoader,
        'buildEventData'
      ).and.callThrough();

      eventDisplay.buildEventDataFromJSON(MOCK_EVENT_DATA[EVENT_KEY]);

      expect(
        eventDisplayPrivate.configuration.eventDataLoader.buildEventData
      ).toHaveBeenCalled();
      expect(mockCallbackOnEventsChange).toHaveBeenCalled();
    });

    it('should load event data', () => {
      const spy = spyOn(eventDisplay, 'buildEventDataFromJSON').and.stub();

      eventDisplayPrivate.eventsData = MOCK_EVENT_DATA;
      eventDisplay.loadEvent(EVENT_KEY);

      expect(eventDisplay.buildEventDataFromJSON).toHaveBeenCalled();

      spy.calls.reset();

      eventDisplay.loadEvent(undefined);

      expect(eventDisplay.buildEventDataFromJSON).toHaveBeenCalledTimes(0);
    });

    it('should load OBJ geometry through three and ui service', async () => {
      spyOn(three, 'loadOBJGeometry').and.resolveTo({ object: MOCK_OBJECT });
      spyOn(ui, 'addGeometry').and.stub();

      await eventDisplay.loadOBJGeometry(
        'test/file/path.obj',
        'Test OBJ',
        0xffffff
      );

      expect(three.loadOBJGeometry).toHaveBeenCalled();
      expect(ui.addGeometry).toHaveBeenCalled();
    });

    it('should parse OBJ geometry through three and ui service', () => {
      spyOn(three, 'parseOBJGeometry').and.returnValue({ object: MOCK_OBJECT });
      spyOn(ui, 'addGeometry').and.stub();

      eventDisplay.parseOBJGeometry('TestContentOfOBJFile', 'Test OBJ');

      expect(three.parseOBJGeometry).toHaveBeenCalled();
      expect(ui.addGeometry).toHaveBeenCalled();
    });

    it('should parse phoenix format for detector geometry and event data', () => {
      const phnxScene = {
        sceneConfiguration: {
          eventData: {
            Tracks: ['TestCollection'],
          },
          geometries: ['TestGeom'],
        },
        scene: {
          TestData: 'TestValue',
        },
      };
      const TEST_PHNX_INPUT = JSON.stringify(phnxScene);

      spyOn(three, 'clearEventData').and.stub();
      spyOn(eventDisplayPrivate, 'loadSceneConfiguration').and.callThrough();
      const parsePhnxSceneSpy = spyOn(three, 'parsePhnxScene').and.stub();

      eventDisplay.parsePhoenixDisplay(TEST_PHNX_INPUT);

      expect(three.clearEventData).toHaveBeenCalled();
      expect(eventDisplayPrivate.loadSceneConfiguration).toHaveBeenCalled();
      expect(three.parsePhnxScene).toHaveBeenCalled();

      parsePhnxSceneSpy.calls.reset();

      eventDisplay.parsePhoenixDisplay(
        JSON.stringify({
          sceneConfiguration: undefined,
        })
      );

      expect(three.parsePhnxScene).toHaveBeenCalledTimes(0);
    });

    it('should load glTF geometry through three manager', () => {
      spyOn(three, 'loadGLTFGeometry').and.stub();

      eventDisplay.loadGLTFGeometry('test/file/path.gltf', 'Test glTF');

      expect(three.loadGLTFGeometry).toHaveBeenCalled();
    });

    it('should load JSON geometry through three and ui manager', async () => {
      spyOn(three, 'loadJSONGeometry').and.resolveTo({ object: MOCK_OBJECT });
      spyOn(ui, 'addGeometry').and.stub();

      await eventDisplay.loadJSONGeometry('test/file/path.json', 'Test JSON');

      expect(three.loadJSONGeometry).toHaveBeenCalled();
      expect(ui.addGeometry).toHaveBeenCalled();
    });

    it('should load ROOT geometries', async () => {
      const mockJSROOT = jasmine.createSpyObj('JSROOT', [
        'openFile',
        'NewHttpRequest',
      ]);
      mockJSROOT.openFile.and.callFake(() =>
        jasmine.createSpyObj('returnValue', ['then'])
      );
      mockJSROOT.NewHttpRequest.and.callFake(() =>
        jasmine.createSpyObj('returnValue', ['send'])
      );

      spyOn(ScriptLoader, 'loadJSRootScripts').and.resolveTo(mockJSROOT);

      const JSROOT = await ScriptLoader.loadJSRootScripts();

      // Calling JSROOT functions through does not cover their code for some reason so not using a spy
      eventDisplay.loadRootJSONGeometry(
        JSROOT,
        'https://root.cern/js/files/geom/cms.json.gz',
        'Test JSON'
      );
      eventDisplay.loadRootGeometry(
        JSROOT,
        'https://root.cern/js/files/geom/rootgeom.root',
        'simple1;1',
        'Test ROOT'
      );

      expect(mockJSROOT.openFile).toHaveBeenCalled();
      expect(mockJSROOT.NewHttpRequest).toHaveBeenCalled();

      spyOn(eventDisplay, 'loadJSONGeometry').and.stub();
      eventDisplay.loadRootGeometry(
        JSROOT,
        'not/a/root.file',
        'object',
        'Test ROOT'
      );
      expect(eventDisplay.loadJSONGeometry).toHaveBeenCalledTimes(0);
    }, 40000);

    it('should get collection through collection name', () => {
      spyOn(
        eventDisplayPrivate.configuration.eventDataLoader,
        'getCollection'
      ).and.stub();
      eventDisplay.getCollection('TestCollection');
      expect(
        eventDisplayPrivate.configuration.eventDataLoader.getCollection
      ).toHaveBeenCalled();
    });

    it('should get collections', () => {
      spyOn(
        eventDisplayPrivate.configuration.eventDataLoader,
        'getCollections'
      ).and.stub();
      eventDisplay.getCollections();
      expect(
        eventDisplayPrivate.configuration.eventDataLoader.getCollections
      ).toHaveBeenCalled();
    });

    it('should listen to function when displayed event changes', () => {
      const prevEventsChangeLength = eventDisplayPrivate.onEventsChange.length;
      eventDisplay.listenToLoadedEventsChange((events) => {});

      expect(eventDisplayPrivate.onEventsChange.length).toBe(
        prevEventsChangeLength + 1
      );
    });

    it('should get event metadata from event loader', () => {
      spyOn(
        eventDisplayPrivate.configuration.eventDataLoader,
        'getEventMetadata'
      ).and.stub();

      eventDisplay.getEventMetadata();

      expect(
        eventDisplayPrivate.configuration.eventDataLoader.getEventMetadata
      ).toHaveBeenCalled();
    });

    it('should enable and run event display functions through console', () => {
      eventDisplayPrivate.enableEventDisplayConsole();
      expect(window.EventDisplay).toBeTruthy();

      // Try running window EventDisplay functions

      spyOn(eventDisplay, 'loadGLTFGeometry').and.stub();
      window.EventDisplay.loadGLTFGeometry('test/path.gltf', 'Test');
      expect(eventDisplay.loadGLTFGeometry).toHaveBeenCalled();

      spyOn(eventDisplay, 'loadOBJGeometry').and.stub();
      window.EventDisplay.loadOBJGeometry('test/path.obj', 'Test', 0xffffff);
      expect(eventDisplay.loadOBJGeometry).toHaveBeenCalled();

      spyOn(eventDisplay, 'loadJSONGeometry').and.stub();
      window.EventDisplay.loadJSONGeometry('test/path.json', 'Test');
      expect(eventDisplay.loadOBJGeometry).toHaveBeenCalled();

      spyOn(eventDisplay, 'buildGeometryFromParameters').and.stub();
      window.EventDisplay.buildGeometryFromParameters({});
      expect(eventDisplay.buildGeometryFromParameters).toHaveBeenCalled();
    });

    it('should initialize XR', () => {
      spyOn(three, 'initXRSession').and.stub();
      eventDisplay.initXR(XRSessionType.VR);
      eventDisplay.initXR(XRSessionType.AR);
      expect(three.initXRSession).toHaveBeenCalledTimes(2);
    });

    it('should end VR', () => {
      spyOn(three, 'initXRSession').and.stub();
      eventDisplay.initXR(XRSessionType.VR);

      spyOn(three, 'endXRSession').and.stub();
      eventDisplay.endXR(XRSessionType.VR);
      expect(three.endXRSession).toHaveBeenCalled();
    });

    it('should call three service functions', () => {
      spyOn(three, 'exportSceneToOBJ').and.stub();
      eventDisplay.exportToOBJ();
      expect(three.exportSceneToOBJ).toHaveBeenCalled();

      spyOn(three, 'exportPhoenixScene').and.stub();
      eventDisplay.exportPhoenixDisplay();
      expect(three.exportPhoenixScene).toHaveBeenCalled();

      spyOn(three, 'parseGLTFGeometry').and.stub();
      eventDisplay.parseGLTFGeometry(
        '{ "TestInput": "TestValue" }',
        'GLTF_Geometry'
      );
      expect(three.parseGLTFGeometry).toHaveBeenCalled();

      spyOn(three, 'zoomTo').and.callThrough();
      eventDisplay.zoomTo(1, 200);
      expect(three.zoomTo).toHaveBeenCalled();

      spyOn(three, 'setOverlayRenderer').and.stub();
      eventDisplay.setOverlayRenderer(document.createElement('canvas'));
      expect(three.setOverlayRenderer).toHaveBeenCalled();

      spyOn(three, 'setSelectedObjectDisplay').and.stub();
      eventDisplay.allowSelection({ name: 'SelectedObject', attributes: [] });
      expect(three.setSelectedObjectDisplay).toHaveBeenCalled();

      spyOn(three, 'enableSelecting').and.stub();
      eventDisplay.enableSelecting(false);
      expect(three.enableSelecting).toHaveBeenCalled();

      spyOn(three, 'fixOverlayView').and.stub();
      eventDisplay.fixOverlayView(true);
      expect(three.fixOverlayView).toHaveBeenCalled();

      spyOn(three, 'getActiveObjectId').and.stub();
      eventDisplay.getActiveObjectId();
      expect(three.getActiveObjectId).toHaveBeenCalled();

      spyOn(three, 'lookAtObject').and.stub();
      eventDisplay.lookAtObject('test_uuid');
      expect(three.lookAtObject).toHaveBeenCalled();

      spyOn(three, 'highlightObject').and.stub();
      eventDisplay.highlightObject('test_uuid');
      expect(three.highlightObject).toHaveBeenCalled();
    });

    it('should animate through the event', () => {
      spyOn(
        eventDisplay.getThreeManager(),
        'animateThroughEvent'
      ).and.callThrough();

      eventDisplay.animateThroughEvent([0, 0, 0], 100, () => {});
      eventDisplay.animateThroughEvent([0, 0, 0], 100);
      expect(
        eventDisplay.getThreeManager().animateThroughEvent
      ).toHaveBeenCalledTimes(2);
    });

    it('should animate event with collision', () => {
      spyOn(
        eventDisplay.getThreeManager(),
        'animateEventWithCollision'
      ).and.stub();

      eventDisplay.animateEventWithCollision(100, () => {});
      eventDisplay.animateEventWithCollision(100);
      expect(
        eventDisplay.getThreeManager().animateEventWithCollision
      ).toHaveBeenCalledTimes(2);
    });
  });
});
