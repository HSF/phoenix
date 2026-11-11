/**
 * @jest-environment jsdom
 */
import { EventAutoloader } from '../../helpers/event-autoloader';

describe('EventAutoloader', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should start and stop polling for rest-endpoint with direct data', async () => {
    const onEvent = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { Tracks: { t1: [] } } }),
    } as any);

    const autoloader = new EventAutoloader({
      source: {
        type: 'rest-endpoint',
        url: 'https://example.com/api/latest',
        intervalMs: 1000,
      },
      onEvent,
    });

    expect(autoloader.isRunning).toBe(false);
    autoloader.start();
    expect(autoloader.isRunning).toBe(true);

    // Wait for initial immediate poll
    await Promise.resolve();
    await Promise.resolve();

    expect(onEvent).toHaveBeenCalledWith({ Tracks: { t1: [] } });

    autoloader.stop();
    expect(autoloader.isRunning).toBe(false);
  });

  it('should parse apache-listing HTML and fetch unseen .json and .xml files', async () => {
    const onEvent = jest.fn();
    const listingHtml = `
      <html><body>
        <a href="event1.json">event1.json</a>
        <a href="event2.xml">event2.xml</a>
        <a href="readme.txt">readme.txt</a>
      </body></html>
    `;

    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (url === 'https://example.com/events/') {
        return { ok: true, text: async () => listingHtml };
      }
      if (url === 'https://example.com/events/event1.json') {
        return {
          ok: true,
          text: async () => JSON.stringify({ event: 1 }),
        };
      }
      if (url === 'https://example.com/events/event2.xml') {
        return {
          ok: true,
          text: async () => '<Event>2</Event>',
        };
      }
      return { ok: false, status: 404 };
    });

    const autoloader = new EventAutoloader({
      source: {
        type: 'apache-listing',
        url: 'https://example.com/events/',
        intervalMs: 5000,
      },
      onEvent,
    });

    await (autoloader as any).poll();

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenNthCalledWith(1, { event: 1 });
    expect(onEvent).toHaveBeenNthCalledWith(2, {
      __jivexml__: '<Event>2</Event>',
    });

    // Polling again with the same listing should not re-emit already seen files
    onEvent.mockClear();
    await (autoloader as any).poll();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('should invoke onError without stopping when a fetch fails', async () => {
    const onEvent = jest.fn();
    const onError = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as any);

    const autoloader = new EventAutoloader({
      source: {
        type: 'rest-endpoint',
        url: 'https://example.com/api/latest',
      },
      onEvent,
      onError,
    });

    await (autoloader as any).poll();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toContain('503');
  });
});
