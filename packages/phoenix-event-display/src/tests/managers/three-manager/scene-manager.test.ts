/**
 * @jest-environment jsdom
 */
import { SceneManager } from '../../../managers/three-manager/scene-manager';
import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  BufferGeometry,
  Camera,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
} from 'three';

describe('SceneManager', () => {
  let sceneManager: SceneManager;
  const ignoreList = [
    new AmbientLight().type,
    new DirectionalLight().type,
    new AxesHelper().type,
  ];

  beforeEach(() => {
    sceneManager = new SceneManager(ignoreList, false);
  });

  it('should update position of directional light for each frame rendered', () => {
    sceneManager.updateLights(new Camera());
  });

  it('should get a clean copy of the scene', () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
    const cleanScene = sceneManager.getCleanScene();
    expect(cleanScene.children.length).toBe(0);
  });

  it('should remove a label from the scene', () => {
    jest.spyOn(sceneManager, 'removeLabel');
    sceneManager.removeLabel('test');
    expect(sceneManager.removeLabel).toHaveBeenCalledWith('test');
  });

  it('should add a new type of objects (Jets, Tracks...) to the event data group', () => {
    jest.spyOn(sceneManager, 'addEventDataTypeGroup');
    sceneManager.addEventDataTypeGroup('object');
    expect(sceneManager.addEventDataTypeGroup).toHaveBeenCalledWith('object');
  });

  it('should clear event data of the scene', () => {
    jest.spyOn(sceneManager, 'clearEventData');
    sceneManager.clearEventData();
    expect(sceneManager.clearEventData).toHaveBeenCalled();
  });

  it('should toggle depthTest of event data by updating all childrens depthTest and renderOrder', () => {
    jest.spyOn(sceneManager, 'eventDataDepthTest');
    sceneManager.eventDataDepthTest(true);
    expect(sceneManager.eventDataDepthTest).toHaveBeenCalledWith(true);

    sceneManager.eventDataDepthTest(false);
    expect(sceneManager.eventDataDepthTest).toHaveBeenCalledWith(false);
  });

  it('should set the visibility of the scene eta/phi grid ', () => {
    jest.spyOn(sceneManager, 'setEtaPhiGrid');
    sceneManager.setEtaPhiGrid(true);
    expect(sceneManager.setEtaPhiGrid).toHaveBeenCalledWith(true);

    sceneManager.setEtaPhiGrid(false);
    expect(sceneManager.setEtaPhiGrid).toHaveBeenCalledWith(false);
  });

  describe('With object in scene', () => {
    let object: Mesh<BufferGeometry, MeshBasicMaterial>;
    const OBJECT_NAME = 'TestCube';

    beforeEach(() => {
      sceneManager = new SceneManager(ignoreList, false);

      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 'white' });
      object = new Mesh(geometry, material);
      object.name = OBJECT_NAME;

      sceneManager.getScene().add(object);
    });

    afterEach(() => {
      sceneManager.getScene().remove(object);
    });

    it('should wireframe a group of objects', () => {
      jest.spyOn(sceneManager, 'wireframeObjects');
      sceneManager.wireframeObjects(object, true);
      expect(sceneManager.wireframeObjects).toHaveBeenCalledWith(object, true);
    });

    it('should modify opacity of an object', () => {
      sceneManager.setGeometryOpacity(object, 0.5);
      expect(object.material.opacity).toBe(0.5);

      sceneManager.setGeometryOpacity(object, 0.25);
      expect(object.material.opacity).toBe(0.25);

      sceneManager.setGeometryOpacity(object, undefined);
    });

    it('should change color of an OBJ geometry', () => {
      const color = new Color(0xffffff);
      sceneManager.changeObjectColor(object, 0xffffff);
      expect(object.material.color).toEqual(color);

      sceneManager.changeObjectColor(undefined, color);
    });

    it('should change object visibility', () => {
      sceneManager.objectVisibility(object, false);
      expect(object.visible).toBe(false);
      sceneManager.objectVisibility(object, true);
      expect(object.visible).toBe(true);
    });

    it('should get position of an object', () => {
      expect(sceneManager.getObjectPosition(OBJECT_NAME)).toBeTruthy();
    });

    it('should remove a geometry from the scene', () => {
      jest.spyOn(sceneManager, 'removeGeometry');
      sceneManager.removeGeometry(object);
      expect(sceneManager.removeGeometry).toHaveBeenCalledWith(object);
    });

    it('should scale an object', () => {
      sceneManager.scaleObject(object, 0.5);
      expect(object.scale.x).toBe(0.5);
    });

    it('should change group visibility', () => {
      const group = new Group();
      group.name = 'objectsGroup';
      const childObj = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial()
      );
      group.add(childObj);
      sceneManager.getScene().add(group);

      sceneManager.groupVisibility('objectsGroup', false);
      expect(childObj.visible).toBe(false);
    });

    it('should set axis', () => {
      sceneManager.setAxis(true);
      expect((sceneManager as any).axis?.visible).toBeTruthy();
      sceneManager.setAxis(false);
      expect((sceneManager as any).axis.visible).toBeFalsy();
    });

    it('should wireframe geometries', () => {
      const testObj = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ wireframe: false })
      );
      const geometryGroup = new Group();
      geometryGroup.name = SceneManager.GEOMETRIES_ID;
      geometryGroup.add(testObj);
      sceneManager.getScene().add(geometryGroup);

      sceneManager.wireframeGeometries(true);
      expect((testObj as any).material.wireframe).toBe(true);
    });

    it('should scale Jets', () => {
      const testJet = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial()
      );
      testJet.name = 'Jet';
      const jetsGroup = new Group();
      jetsGroup.name = 'Jets';
      jetsGroup.add(testJet);
      sceneManager.getScene().add(jetsGroup);

      sceneManager.scaleJets(10);
      expect(testJet.scale.x).toBe(10);
    });

    it('should get an object by its name', () => {
      expect(sceneManager.getObjectByName(OBJECT_NAME)).toBeTruthy();
    });
  });
});
