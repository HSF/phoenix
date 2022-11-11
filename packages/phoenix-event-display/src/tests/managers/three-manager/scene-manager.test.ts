/**
 * @jest-environment jsdom
 */
import { SceneManager } from '../../../managers/three-manager/scene-manager';
import {
  Object3D,
  Scene,
  Vector3,
  PerspectiveCamera,
  LineSegments,
} from 'three';
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

describe('SceneManager', () => {
  let sceneManager: SceneManager;
  const ignoreList = [
    new AmbientLight().type,
    new DirectionalLight().type,
    new AxesHelper().type,
  ];

  beforeEach(() => {
    sceneManager = new SceneManager(ignoreList, true);
  });

  afterEach(() => {
    sceneManager = undefined;
  });

  it('should update position of directional light for each frame rendered', () => {
    const camera = new Camera();
    camera.position.set(7, 7, 7);
    sceneManager.cameraLight = new DirectionalLight();

    sceneManager.updateLights(camera);

    expect(sceneManager.cameraLight.position.x).toBe(7);
    expect(sceneManager.cameraLight.position.y).toBe(7);
    expect(sceneManager.cameraLight.position.z).toBe(7);
  });

  it('should get a clean copy of the scene', () => {
    const cleanScene = sceneManager.getCleanScene();

    expect(cleanScene).toBeInstanceOf(Scene);
    expect(cleanScene.children.length).toBe(0);
  });

  it('should remove a label from the scene', () => {
    const labelObject = new Object3D();
    labelObject.name = 'label';
    sceneManager.getObjectsGroup(SceneManager.LABELS_ID).add(labelObject);

    sceneManager.removeLabel('label');

    const labelFromScene = sceneManager
      .getObjectsGroup(SceneManager.LABELS_ID)
      .getObjectByName('label');

    expect(labelFromScene).toBeFalsy();
  });

  it('should add new types of objects (Jets, Tracks...) to the event data group', () => {
    const eventGroup = sceneManager.addEventDataTypeGroup('object');

    expect(eventGroup).toBeInstanceOf(Group);
    expect(eventGroup.parent.name).toBe('EventData');
  });

  it('should toggle depthTest of event data by updating all childrens depthTest and renderOrder', () => {
    const eventGroup = sceneManager.addEventDataTypeGroup('object');
    const childObj = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial()
    );
    eventGroup.add(childObj);

    sceneManager.eventDataDepthTest(true);

    expect(childObj.renderOrder).toBe(0);
    expect(childObj.material.depthTest).toBe(true);

    sceneManager.eventDataDepthTest(false);

    expect(childObj.renderOrder).toBe(999);
    expect(childObj.material.depthTest).toBe(false);
  });

  it('should set the visibility of the scene eta/phi grid ', () => {
    sceneManager.setEtaPhiGrid(true);
    expect(sceneManager['grid'].visible).toBe(true);

    sceneManager.setEtaPhiGrid(false);
    expect(sceneManager['grid'].visible).toBe(false);
  });

  describe('With object in scene', () => {
    let object: Mesh<BufferGeometry, MeshBasicMaterial>;
    const OBJECT_NAME = 'TestCube';

    beforeEach(() => {
      sceneManager = new SceneManager(ignoreList, true);

      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 'white' });
      object = new Mesh(geometry, material);
      object.name = OBJECT_NAME;
      object.uuid = 'uuid';

      sceneManager.getScene().add(object);
    });

    afterEach(() => {
      sceneManager.getScene().remove(object);
    });

    it('should clear event data of the scene', () => {
      sceneManager.addEventDataTypeGroup('eventData');

      expect(sceneManager.getEventData().children.length).toBe(1);

      sceneManager.clearEventData();

      expect(sceneManager.getEventData().children.length).toBe(0);
    });

    it('should wireframe a group of objects', () => {
      sceneManager.wireframeObjects(object, true);
      expect(object.material.wireframe).toBe(true);

      sceneManager.wireframeObjects(object, false);
      expect(object.material.wireframe).toBe(false);
    });

    it('should modify opacity of an object', () => {
      sceneManager.setGeometryOpacity(object, 0.5);
      expect(object.material.opacity).toBe(0.5);

      sceneManager.setGeometryOpacity(object, 0.25);
      expect(object.material.opacity).toBe(0.25);

      sceneManager.setGeometryOpacity(object, undefined);
    });

    it('should change color of an OBJ geometry', () => {
      const newColor = new Color('red');
      sceneManager.changeObjectColor(object, newColor);

      expect(object.material.color).toEqual(newColor);

      const childObj = new LineSegments(new BufferGeometry());
      object.add(childObj);
      const color2 = new Color('blue');
      sceneManager.changeObjectColor(childObj, color2);
    });

    it('should change object visibility', () => {
      sceneManager.objectVisibility(object, false);
      expect(object.visible).toBe(false);

      sceneManager.objectVisibility(object, true);
      expect(object.visible).toBe(true);
    });

    it('should get position of an object', () => {
      const objPosition = sceneManager.getObjectPosition(OBJECT_NAME);

      expect(objPosition).toBeInstanceOf(Vector3);
      expect(objPosition.x).toBe(0);
      expect(objPosition.y).toBe(0);
      expect(objPosition.z).toBe(0);
    });

    it('should not get position of an object that does not exist', () => {
      const objPosition = sceneManager.getObjectPosition('nonExistingObject');

      expect(objPosition).toBeUndefined();
    });

    it('should remove a geometry from the scene', () => {
      jest.spyOn(sceneManager.getGeometries(), 'remove');

      sceneManager.removeGeometry(object);

      expect(sceneManager.getGeometries().remove).toHaveBeenCalled();
    });

    it('should scale an object', () => {
      sceneManager.scaleObject(object, 0.5);
      expect(object.scale.x).toBe(0.5);
    });

    it('should scale lowest level objects in a group', () => {
      sceneManager.addEventDataTypeGroup('object');
      const object = sceneManager.getObjectByName('object');
      const objectChild = new Mesh(new BoxGeometry(1, 1, 1));
      object.add(objectChild);

      sceneManager.scaleChildObjects('object', 1.5);
      expect(objectChild.scale.x).toBe(1.5);

      sceneManager.scaleChildObjects('object', 0.5, 'axis');
      expect(objectChild.scale['axis']).toBe(0.5);
    });

    it('should add label to the three.js object', () => {
      const camera = new PerspectiveCamera();
      const htmlElement = document.createElement('div');
      sceneManager.addLabelToObject(
        'label',
        'uuid',
        'labelId',
        new Vector3(0, 0, 0),
        new OrbitControls(camera, htmlElement)
      );

      expect(object.userData.label).toBe('label');
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

      sceneManager.groupVisibility('objectsGroup', false, 'objectsGroup');
      expect(childObj.visible).toBe(false);

      sceneManager.groupVisibility('objectsGroup', true, 'objectsGroup');
      expect(childObj.visible).toBe(true);

      // it should not change visibility of objects that are not in the group
      sceneManager.groupVisibility('objectsGroup', false);
      expect(object.visible).toBe(true);
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
      expect(testObj.material.wireframe).toBe(true);
      expect(testObj.material.transparent).toBe(true);
      expect(testObj.material.opacity).toBe(0.1);

      sceneManager.wireframeGeometries(false);

      expect(testObj.material.transparent).toBe(false);
      expect(testObj.material.opacity).toBe(1);
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

    it('should not scale Jets', () => {
      const testJet = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial()
      );
      testJet.name = 'Jet2';
      const jetsGroup = new Group();
      jetsGroup.name = 'Jets2';
      jetsGroup.add(testJet);
      sceneManager.getScene().add(jetsGroup);

      sceneManager.scaleJets(0);
      expect(testJet.scale.x).toBe(1);
    });

    it('should get an object by its name', () => {
      const objName = sceneManager.getObjectByName(OBJECT_NAME) as Mesh;

      expect(objName).toBeInstanceOf(Object3D);
      expect(objName.name).toBe('TestCube');
      expect(objName.parent.type).toBe('Scene');
    });
  });
});
