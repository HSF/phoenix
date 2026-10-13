/**
 * @jest-environment jsdom
 */
import JSZip from 'jszip';
import { EventDisplay } from '../event-display';

describe('EventDisplay', () => {
  describe('cleanup', () => {
    let eventDisplay: any;

    beforeEach(() => {
      // `cleanup` is exercised on a bare instance so the test does not need a
      // WebGL context, a DOM host element or a loaded configuration.
      eventDisplay = Object.create(EventDisplay.prototype);
      eventDisplay.onEventsChange = [];
      eventDisplay.onDisplayedEventChange = [];
      eventDisplay.onStateChange = [];
      eventDisplay.eventBus = new Map();
      eventDisplay.eventBusWildcard = new Set();
      eventDisplay.stateChangeTimeout = null;
    });

    it('should not run pending state change callbacks after cleanup', () => {
      jest.useFakeTimers();

      const callback = jest.fn();
      eventDisplay.onStateChange.push(callback);

      // A state change is queued, then the display is torn down before the
      // debounced callbacks get a chance to run.
      eventDisplay.triggerStateChange();
      eventDisplay.cleanup();

      jest.runAllTimers();

      expect(callback).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should clear the state change callbacks', () => {
      eventDisplay.onStateChange.push(jest.fn());

      eventDisplay.cleanup();

      expect(eventDisplay.onStateChange).toEqual([]);
    });
  });

  describe('parseZipEventData', () => {
    let eventDisplay: any;
    let mockInfoLogger: any;

    beforeEach(() => {
      eventDisplay = Object.create(EventDisplay.prototype);
      eventDisplay.configuration = {};
      mockInfoLogger = {
        add: jest.fn(),
      };
      eventDisplay.getInfoLogger = () => mockInfoLogger;
      eventDisplay.parsePhoenixEvents = jest.fn();
    });

    it('should parse zip event data and fall back to JiveXMLLoader for XML events', async () => {
      const zip = new JSZip();
      zip.file('test.json', '{"Event1": {"Tracks": {}}}');
      zip.file('test.xml', '<Event eventNumber="123" runNumber="456"/>');
      const blob = await zip.generateAsync({ type: 'arraybuffer' });

      await eventDisplay.parseZipEventData(blob);

      expect(eventDisplay.parsePhoenixEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          Event1: expect.anything(),
          'test.xml': expect.objectContaining({
            eventNumber: '123',
            runNumber: '456',
          }),
        }),
      );
    });

    it('should rethrow error and log when reading zip fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const invalidData = new ArrayBuffer(8);
      await expect(
        eventDisplay.parseZipEventData(invalidData),
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockInfoLogger.add).toHaveBeenCalledWith(
        'Could not read zip event file.',
        'Error',
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
