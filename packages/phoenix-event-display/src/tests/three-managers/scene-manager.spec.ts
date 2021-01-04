import { AmbientLight, DirectionalLight, AxesHelper, Camera, BoxGeometry, MeshBasicMaterial, Mesh, Color, Group } from "three";
import { SceneManager } from "../../three/scene-manager";

describe('SceneManager', () => {

  let sceneManager: SceneManager;
  const ignoreList = [
    new AmbientLight().type,
    new DirectionalLight().type,
    new AxesHelper().type
  ];

  beforeEach(() => {
    sceneManager = new SceneManager(ignoreList, false);
  });

  it('should update lights', () => {
    sceneManager.updateLights(new Camera());
  });

  it('should not set background if there is no scene', () => {
    sceneManager.darkBackground(true);
    (sceneManager as any).scene = undefined;
    expect((sceneManager as any).scene?.background).toBeUndefined();
  });

  describe('with object in scene', () => {

    const OBJECT_NAME = 'TestCube';

    beforeEach(() => {
      sceneManager = new SceneManager(ignoreList, false);

      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 'white' });
      const cube = new Mesh(geometry, material);
      cube.name = OBJECT_NAME;

      sceneManager.getScene().add(cube);
    });

    it('should set geometry opacity', () => {
      sceneManager.setGeometryOpacity(OBJECT_NAME, 0.5);
      const obj: any = sceneManager.getScene().getObjectByName(OBJECT_NAME);
      expect(obj.material.opacity).toBe(0.5);

      sceneManager.setGeometryOpacity(OBJECT_NAME, undefined);
    });

    it('should change object geometry color', () => {
      const color = new Color(0xffffff);
      sceneManager.OBJGeometryColor(OBJECT_NAME, 0xffffff);
      const obj: any = sceneManager.getScene().getObjectByName(OBJECT_NAME);
      expect(obj.material.color).toEqual(color);

      sceneManager.OBJGeometryColor('NonExistentObject', color);
    });

    it('should change object visibility', () => {
      sceneManager.objectVisibility(OBJECT_NAME, false);
      const obj: any = sceneManager.getScene().getObjectByName(OBJECT_NAME);
      expect(obj.visible).toBe(false);
      sceneManager.objectVisibility(OBJECT_NAME, true);
      expect(obj.visible).toBe(true);
    });

    it('should get object position', () => {
      expect(sceneManager.getObjectPosition(OBJECT_NAME)).toBeTruthy();
    });

    it('should scale object', () => {
      sceneManager.scaleObject(OBJECT_NAME, 0.5);
      const obj: any = sceneManager.getScene().getObjectByName(OBJECT_NAME);
      expect(obj.scale.x).toBe(0.5);
    });

    it('should change group visibility', () => {
      const obj: any = sceneManager.getScene().getObjectByName(OBJECT_NAME);
      const childObj = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
      obj.add(childObj);
      sceneManager.groupVisibility(OBJECT_NAME, false);
      expect(childObj.visible).toBe(false);
    });

    it('should set axis', () => {
      sceneManager.setAxis(true);
      expect((sceneManager as any).axis?.visible).toBeTrue();
      sceneManager.setAxis(false);
      expect((sceneManager as any).axis.visible).toBeFalse();
    });

    it('should wireframe geometries', () => {
      const testObj = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ wireframe: false }));
      const geometryGroup = new Group();
      geometryGroup.name = SceneManager.GEOMETRIES_ID;
      geometryGroup.add(testObj);
      sceneManager.getScene().add(geometryGroup);

      sceneManager.wireframeGeometries(true);
      expect((testObj as any).material.wireframe).toBe(true);
    });

    it('should scale Jets', () => {
      const testJet = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
      testJet.name = 'Jet';
      const jetsGroup = new Group();
      jetsGroup.name = 'Jets';
      jetsGroup.add(testJet);
      sceneManager.getScene().add(jetsGroup);

      sceneManager.scaleJets(10);
      expect(testJet.scale.x).toBe(10 / 100); // In percent
    });
  });
});
