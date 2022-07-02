/**
 * @jest-environment jsdom
 */
import { TrackmlLoader } from '../../loaders/trackml-loader';

describe('TrackmlLoader', () => {
  let trackmlLoader: TrackmlLoader;

  beforeEach(() => {
    trackmlLoader = new TrackmlLoader();
  });

  it('should create an instance', () => {
    expect(trackmlLoader).toBeTruthy();
  });

  it('should process hits', () => {
    const hits = `1,0,0,0,0,0,0
    2,0,0,0,0,0,0`;
    jest.spyOn(trackmlLoader, 'processHits');
    trackmlLoader.processHits(hits);
    expect(trackmlLoader.processHits).toHaveBeenCalledWith(hits);
  });

  it('should process particles to format and store them', () => {
    const particles = `1,0,0,0,0,0,0,0,0
    2,0,0,0,0,0,0,0,0`;
    jest.spyOn(trackmlLoader, 'processParticles');
    trackmlLoader.processParticles(particles);
    expect(trackmlLoader.processParticles).toHaveBeenCalledWith(particles);
  });

  it('should process truth data to format and store it', () => {
    const truth = `1,0,0,0,0,0,0,0,0
    2,0,0,0,0,0,0,0,0`;
    jest.spyOn(trackmlLoader, 'processTruth');
    trackmlLoader.processTruth(truth);
    expect(trackmlLoader.processTruth).toHaveBeenCalledWith(truth);
  });

  it('should get structured event data from the processed Hits, Truth data and Particles', () => {
    const eventData = trackmlLoader.getEventData('eventNum');
    expect(eventData).toBeTruthy();
  });
});
