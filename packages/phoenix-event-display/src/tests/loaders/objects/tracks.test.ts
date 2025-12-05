import { Vector3, Color } from 'three';
import { TracksMesh } from '../../../loaders/objects/tracks';

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
});
