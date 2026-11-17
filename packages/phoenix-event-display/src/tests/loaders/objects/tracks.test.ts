import { Vector2, Vector3, Color } from 'three';
import { TracksMesh, TracksMaterial } from '../../../loaders/objects/tracks';

describe('TracksMesh', () => {
  let tracksMesh: TracksMesh;

  beforeEach(() => {
    tracksMesh = new TracksMesh();
  });

  it('should create an instance', () => {
    expect(tracksMesh).toBeTruthy();
  });

  it('should add a track with default linewidth', () => {
    const points = [new Vector3(0, 0, 0), new Vector3(1, 0, 0)];
    const color = new Color(0xff0000);
    tracksMesh.addTrack(points, color);
    tracksMesh.process();

    const linewidthAttribute = tracksMesh.getAttribute('linewidth');
    expect(linewidthAttribute).toBeTruthy();
    // 2 points * 2 vertices per point = 4 vertices
    expect(linewidthAttribute.count).toBe(4);
    for (let i = 0; i < linewidthAttribute.count; i++) {
      expect(linewidthAttribute.getX(i)).toBe(1.0);
    }
  });

  it('should add a track with custom linewidth', () => {
    const points = [new Vector3(0, 0, 0), new Vector3(1, 0, 0)];
    const color = new Color(0xff0000);
    const linewidth = 5.0;
    tracksMesh.addTrack(points, color, linewidth);
    tracksMesh.process();

    const linewidthAttribute = tracksMesh.getAttribute('linewidth');
    expect(linewidthAttribute).toBeTruthy();
    expect(linewidthAttribute.count).toBe(4);
    for (let i = 0; i < linewidthAttribute.count; i++) {
      expect(linewidthAttribute.getX(i)).toBe(linewidth);
    }
  });

  it('should align color buffer count with position buffer count without drifting', () => {
    const points = [
      new Vector3(0, 0, 0),
      new Vector3(1, 0, 0),
      new Vector3(2, 1, 0),
    ];
    const color = new Color(0x00ff00);
    tracksMesh.addTrack(points, color);
    tracksMesh.process();

    const positionAttribute = tracksMesh.getAttribute('position');
    const colorAttribute = tracksMesh.getAttribute('color');

    expect(positionAttribute).toBeTruthy();
    expect(colorAttribute).toBeTruthy();
    // 3 points * 2 vertices per point = 6 vertices
    expect(positionAttribute.count).toBe(6);
    expect(colorAttribute.count).toBe(positionAttribute.count);

    for (let i = 0; i < colorAttribute.count; i++) {
      expect(colorAttribute.getX(i)).toBe(0); // R
      expect(colorAttribute.getY(i)).toBe(1); // G
      expect(colorAttribute.getZ(i)).toBe(0); // B
    }
  });

  it('should preserve vertex colors across multiple tracks with different colors', () => {
    const track1Points = [new Vector3(0, 0, 0), new Vector3(1, 0, 0)];
    const track2Points = [new Vector3(2, 0, 0), new Vector3(3, 0, 0)];
    const color1 = new Color(0xff0000); // Red
    const color2 = new Color(0x0000ff); // Blue

    tracksMesh.addTrack(track1Points, color1);
    tracksMesh.addTrack(track2Points, color2);
    tracksMesh.process();

    const colorAttribute = tracksMesh.getAttribute('color');
    expect(colorAttribute.count).toBe(8); // 4 vertices track 1 + 4 vertices track 2

    // Track 1 vertices (0..3) must all be Red
    for (let i = 0; i < 4; i++) {
      expect(colorAttribute.getX(i)).toBe(1);
      expect(colorAttribute.getY(i)).toBe(0);
      expect(colorAttribute.getZ(i)).toBe(0);
    }

    // Track 2 vertices (4..7) must all be Blue
    for (let i = 4; i < 8; i++) {
      expect(colorAttribute.getX(i)).toBe(0);
      expect(colorAttribute.getY(i)).toBe(0);
      expect(colorAttribute.getZ(i)).toBe(1);
    }
  });

  it('should reuse existing buffers in process() when vertex count is unchanged', () => {
    const points = [new Vector3(0, 0, 0), new Vector3(1, 0, 0)];
    tracksMesh.addTrack(points, new Color(0xff0000));
    tracksMesh.process();

    const initialPosAttr = tracksMesh.getAttribute('position');
    const initialColorAttr = tracksMesh.getAttribute('color');

    // Modify internal positions without changing total count
    tracksMesh.positions[0] = 10;
    tracksMesh.process();

    const secondPosAttr = tracksMesh.getAttribute('position');
    const secondColorAttr = tracksMesh.getAttribute('color');

    // The BufferAttribute references should be reused and updated in-place
    expect(secondPosAttr).toBe(initialPosAttr);
    expect(secondColorAttr).toBe(initialColorAttr);
    expect((secondPosAttr as any).version).toBeGreaterThan(0);
    expect(secondPosAttr.getX(0)).toBe(10);
  });

  it('should handle degenerate point inputs gracefully', () => {
    expect(tracksMesh.addTrack([], new Color(0xff0000))).toBe(-1);
    expect(tracksMesh.addTrack(null as any, new Color(0xff0000))).toBe(-1);
  });
});

describe('TracksMaterial', () => {
  it('should use tracks_frag for fragmentShader and set proper uniform properties', () => {
    const material = new TracksMaterial({});

    expect(material.isTracksMaterial).toBe(true);
    expect(TracksMaterial.type).toBe('TracksMaterial');
    expect(material.fragmentShader).toContain('gl_FragColor');
    expect(material.fragmentShader).toContain('progress');

    // Test resolution getter/setter
    material.resolution = new Vector2(800, 600);
    expect(material.resolution.x).toBe(800);
    expect(material.resolution.y).toBe(600);
    expect(material.uniforms.resolution.value.x).toBe(800);

    // Test progress getter/setter
    material.progress = 0.75;
    expect(material.progress).toBe(0.75);
    expect(material.uniforms.progress.value).toBe(0.75);
  });
});
