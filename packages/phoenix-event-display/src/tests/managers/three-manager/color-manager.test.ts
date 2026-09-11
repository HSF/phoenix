import {
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
} from 'three';
import {
  ColorManager,
  getObjectColor,
} from '../../../managers/three-manager/color-manager';
import { SceneManager } from '../../../managers/three-manager/scene-manager';

describe('getObjectColor', () => {
  it('should read the color of a mesh', () => {
    const mesh = new Mesh(
      new BufferGeometry(),
      new MeshPhongMaterial({ color: 0xff0000 }),
    );

    expect(getObjectColor(mesh)?.getHexString()).toBe('ff0000');
  });

  it('should read the color of a mesh with several materials', () => {
    const mesh = new Mesh(new BufferGeometry(), [
      new MeshPhongMaterial({ color: 0x00ff00 }),
      new MeshPhongMaterial({ color: 0x0000ff }),
    ]);

    expect(getObjectColor(mesh)?.getHexString()).toBe('00ff00');
  });

  it('should read the color of lines and points', () => {
    const line = new Line(
      new BufferGeometry(),
      new LineBasicMaterial({ color: 0x0000ff }),
    );
    const points = new Points(
      new BufferGeometry(),
      new PointsMaterial({ color: 0xffd166 }),
    );

    expect(getObjectColor(line)?.getHexString()).toBe('0000ff');
    expect(getObjectColor(points)?.getHexString()).toBe('ffd166');
  });

  it('should read the color of an instanced mesh', () => {
    const instancedMesh = new InstancedMesh(
      new BufferGeometry(),
      new MeshBasicMaterial({ color: 0xfff69a }),
      4,
    );

    expect(getObjectColor(instancedMesh)?.getHexString()).toBe('fff69a');
  });

  it('should find the color of a nested object', () => {
    const group = new Group();
    const child = new Group();
    child.add(
      new Mesh(
        new BufferGeometry(),
        new MeshPhongMaterial({ color: 0x2194ce }),
      ),
    );
    group.add(child);

    expect(getObjectColor(group)?.getHexString()).toBe('2194ce');
  });

  it('should return undefined when there is nothing colored', () => {
    expect(getObjectColor(new Group())).toBeUndefined();
  });

  it('should read the color of a shader material held in a uniform', () => {
    // Jets are drawn with a shader material, which has no `color` of its own.
    const mesh = new Mesh(
      new BufferGeometry(),
      new ShaderMaterial({
        uniforms: { jetColor: { value: new Color(0x2194ce) } },
      }),
    );

    expect(getObjectColor(mesh)?.getHexString()).toBe('2194ce');
  });

  it('should not return a reference to the material color', () => {
    const material = new MeshPhongMaterial({ color: 0xff0000 });
    const mesh = new Mesh(new BufferGeometry(), material);

    const color = getObjectColor(mesh);
    color?.set(0x000000);

    expect(material.color.getHexString()).toBe('ff0000');
  });
});

describe('ColorManager', () => {
  it('should read back the color it applied to a collection', () => {
    // The color shown in the menu has to be the color the collection is
    // actually drawn with, which is what these two doing the same thing means.
    const scene = new Scene();
    const eventData = new Group();
    eventData.name = SceneManager.EVENT_DATA_ID;
    const collection = new Group();
    collection.name = 'TestCollection';
    collection.add(
      new Mesh(
        new BufferGeometry(),
        new MeshPhongMaterial({ color: 0xff0000 }),
      ),
    );
    eventData.add(collection);
    scene.add(eventData);

    const colorManager = new ColorManager({
      getScene: () => scene,
    } as unknown as SceneManager);

    colorManager.collectionColor('TestCollection', '#0adb2d');

    expect(getObjectColor(collection)?.getHexString()).toBe('0adb2d');
  });

  it('should color objects drawn with a shader material', () => {
    // Jets used to be left out when a collection was recolored, as their color
    // lives in a uniform rather than on the material.
    const scene = new Scene();
    const eventData = new Group();
    eventData.name = SceneManager.EVENT_DATA_ID;
    const collection = new Group();
    collection.name = 'Jets';
    const jetMaterial = new ShaderMaterial({
      uniforms: { jetColor: { value: new Color(0x2194ce) } },
    });
    collection.add(new Mesh(new BufferGeometry(), jetMaterial));
    eventData.add(collection);
    scene.add(eventData);

    const colorManager = new ColorManager({
      getScene: () => scene,
    } as unknown as SceneManager);

    colorManager.collectionColor('Jets', '#0adb2d');

    expect(jetMaterial.uniforms.jetColor.value.getHexString()).toBe('0adb2d');
  });
});
