/**
 * @jest-environment jsdom
 */
import { TrackmlLoader } from '../../loaders/trackml-loader';

describe('TrackmlLoader', () => {
  let trackmlLoader: TrackmlLoader;

  beforeEach(() => {
    trackmlLoader = new TrackmlLoader();
  });

  afterEach(() => {
    trackmlLoader = undefined;
  });

  it('should create an instance', () => {
    expect(trackmlLoader).toBeDefined();
  });

  it('should process hits to format and store them', () => {
    const hits = `1,0,0,0,0,0,0
    2,0,0,0,0,0,0`;
    jest.spyOn(console, 'log');
    trackmlLoader.processHits(hits);
    expect(console.log).toHaveBeenCalledWith('Event has this many hits:', 2);
  });

  it('should process particles to format and store them', () => {
    const particles = `1,0,0,0,0,0,0,0,0
    2,0,0,0,0,0,0,0,0`;
    jest.spyOn(console, 'log');
    trackmlLoader.processParticles(particles);
    expect(console.log).toHaveBeenCalledWith(
      'Event has this many particles:',
      2
    );
  });

  it('should process truth data to format and store it', () => {
    const truth = `1,0,0,0,0,0,0,0,0
    2,0,0,0,0,0,0,0,0`;
    jest.spyOn(console, 'log');
    trackmlLoader.processTruth(truth);
    expect(console.log).toHaveBeenCalledWith('Event has this many truth: ', 2);
  });

  it('should get structured event data from the processed Hits, Truth data and Particles', () => {
    const eventData = trackmlLoader.getEventData('eventNum');
    expect(eventData).toEqual({
      eventNumber: 'eventNum',
      runNumber: 0,
      Hits: { Reconstructed: [] },
      Tracks: { Particles: [] },
    });
  });
});
