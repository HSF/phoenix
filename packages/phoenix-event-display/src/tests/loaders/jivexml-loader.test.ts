/**
 * @jest-environment jsdom
 */
import { JiveXMLLoader } from '../../loaders/jivexml-loader';

describe('JiveXMLLoader', () => {
  describe('getTracks', () => {
    const getTracks = () => {
      const xml = `<Event eventNumber="1" runNumber="1" lumiBlock="1" dateTime="2026-01-01">
        <Track count="2" storeGateKey="SomeTracks">
          <chi2>1.0 1.0</chi2>
          <numDoF>3 3</numDoF>
          <pt>10.0 10.0</pt>
          <d0>0.1 0.1</d0>
          <z0>1.0 1.0</z0>
          <phi0>0.5 0.5</phi0>
          <cotTheta>1.0 -1.0</cotTheta>
        </Track>
      </Event>`;

      const loader = new JiveXMLLoader();
      loader.process(xml);
      return loader.getEventData().Tracks.SomeTracks;
    };

    it('should give forward and backward tracks a theta in (0, PI)', () => {
      const [forward, backward] = getTracks();

      expect(forward.dparams[3]).toBeCloseTo(Math.PI / 4);
      expect(backward.dparams[3]).toBeCloseTo((3 * Math.PI) / 4);
    });

    it('should keep the charge of backward tracks', () => {
      const [forward, backward] = getTracks();
      const momentum = 10000 / Math.sin(Math.PI / 4);

      expect(forward.dparams[4]).toBeCloseTo(1 / momentum, 10);
      expect(backward.dparams[4]).toBeCloseTo(1 / momentum, 10);
    });

    it('should give backward tracks a negative eta', () => {
      const [forward, backward] = getTracks();

      expect(forward.eta).toBeCloseTo(0.8814, 4);
      expect(backward.eta).toBeCloseTo(-0.8814, 4);
    });
  });
});
