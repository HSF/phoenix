import {
  AmbientLight,
  DirectionalLight,
  AxesHelper,
  Camera,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  Color,
  Group,
  BufferGeometry,
} from 'three';
import { SceneManager } from '../../../managers/three-manager/scene-manager';

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

  it('should update lights', () => {
    sceneManager.updateLights(new Camera());
  });

  describe('with object in scene', () => {
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

    it('should set geometry opacity', () => {
      sceneManager.setGeometryOpacity(object, 0.5);
      expect(object.material.opacity).toBe(0.5);

      sceneManager.setGeometryOpacity(object, undefined);
    });

    it('should change object geometry color', () => {
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

    it('should get object position', () => {
      expect(sceneManager.getObjectPosition(OBJECT_NAME)).toBeTruthy();
    });

    it('should scale object', () => {
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
      expect((sceneManager as any).axis?.visible).toBeTrue();
      sceneManager.setAxis(false);
      expect((sceneManager as any).axis.visible).toBeFalse();
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
  });
});
