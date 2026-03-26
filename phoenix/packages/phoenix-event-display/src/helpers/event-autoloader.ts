/**
 * Strategies for auto-loading events.
 *
 * - `apache-listing`: Polls an Apache/nginx directory index page, parses the
 *   file listing (compatible with https://root.cern.ch/js/files/ style), and
 *   loads the newest file it hasn't seen yet.
 * - `rest-endpoint`: Polls a REST endpoint that returns
 *   `{ url: string }` or `{ data: object }` pointing to the next event.
 * - `sse`: Connects to a Server-Sent Events endpoint. The server pushes
 *   `data: <json-string>` messages whenever a new event is available.
 */
export type AutoloadSource =
  | { type: 'apache-listing'; url: string; intervalMs?: number }
  | { type: 'rest-endpoint'; url: string; intervalMs?: number }
  | { type: 'sse'; url: string };

export interface AutoloadOptions {
  source: AutoloadSource;
  /** Called with the raw event data object when a new event arrives. */
  onEvent: (eventData: any) => void;
  /** Called when an error occurs. Does not stop the autoloader. */
  onError?: (err: Error) => void;
}

/**
 * Experiment-agnostic event autoloader.
 *
 * Watches a directory or endpoint for new event files and calls `onEvent`
 * whenever a new one arrives, leaving all rendering decisions to the caller.
 *
 * @example
 * ```ts
 * const autoloader = new EventAutoloader({
 *   source: { type: 'apache-listing', url: 'https://my-server/events/', intervalMs: 5000 },
 *   onEvent: (data) => eventDisplay.buildEventDataFromJSON(data),
 * });
 * autoloader.start();
 * // later:
 * autoloader.stop();
 * ```
 */
export class EventAutoloader {
  private options: AutoloadOptions;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private eventSource: EventSource | null = null;
  private seenFiles = new Set<string>();
  private running = false;

  constructor(options: AutoloadOptions) {
    this.options = options;
  }

  /** Start watching for new events. Safe to call multiple times. */
  start() {
    if (this.running) return;
    this.running = true;

    const { source } = this.options;

    if (source.type === 'sse') {
      this.startSSE(source.url);
    } else {
      const intervalMs =
        (source as { intervalMs?: number }).intervalMs ?? 5000;
      // Run once immediately, then on interval
      this.poll();
      this.intervalId = setInterval(() => this.poll(), intervalMs);
    }
  }

  /** Stop watching. */
  stop() {
    this.running = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /** Whether the autoloader is currently active. */
  get isRunning() {
    return this.running;
  }

  private async poll() {
    const { source } = this.options;
    try {
      if (source.type === 'apache-listing') {
        await this.pollApacheListing(source.url);
      } else if (source.type === 'rest-endpoint') {
        await this.pollRestEndpoint(source.url);
      }
    } catch (err: any) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Fetches an Apache/nginx directory listing page, extracts all linked
   * .json and .xml files, and loads any that haven't been seen yet.
   * Compatible with the JSROOT file listing format at root.cern.ch/js/files/.
   */
  private async pollApacheListing(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Directory listing fetch failed: ${res.status}`);
    const html = await res.text();

    const newFiles = this.parseApacheListing(html, url);

    for (const fileUrl of newFiles) {
      if (this.seenFiles.has(fileUrl)) continue;
      this.seenFiles.add(fileUrl);
      await this.fetchAndEmit(fileUrl);
    }
  }

  /**
   * Parses an Apache/nginx autoindex HTML page and returns absolute URLs
   * for all .json and .xml files listed.
   */
  private parseApacheListing(html: string, baseUrl: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

    return anchors
      .map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? '')
      .filter((href) => /\.(json|xml)(\.zip)?$/.test(href))
      .map((href) => (href.startsWith('http') ? href : base + href));
  }

  /**
   * Polls a REST endpoint. Expects a response of:
   * - `{ url: string }` — fetches and emits the file at that URL
   * - `{ data: object }` — emits the data directly
   * - `{ events: object }` — emits the events object directly (Phoenix format)
   */
  private async pollRestEndpoint(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`REST endpoint fetch failed: ${res.status}`);
    const json = await res.json();

    if (json?.url) {
      const fileUrl: string = json.url;
      if (this.seenFiles.has(fileUrl)) return;
      this.seenFiles.add(fileUrl);
      await this.fetchAndEmit(fileUrl);
    } else if (json?.data) {
      this.options.onEvent(json.data);
    } else if (json?.events) {
      this.options.onEvent(json.events);
    } else {
      // Treat the whole response as event data
      this.options.onEvent(json);
    }
  }

  /** Fetches a .json or .xml(.zip) file and emits its parsed content. */
  private async fetchAndEmit(fileUrl: string) {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Event file fetch failed (${fileUrl}): ${res.status}`);

    const isZip = fileUrl.endsWith('.zip');
    const rawExt = fileUrl.replace(/\.zip$/, '').split('.').pop();

    let text: string;
    if (isZip) {
      const buf = await res.arrayBuffer();
      text = await this.unzip(buf);
    } else {
      text = await res.text();
    }

    if (rawExt === 'json') {
      this.options.onEvent(JSON.parse(text));
    } else if (rawExt === 'xml') {
      // Emit raw XML string — caller's JiveXMLLoader handles parsing
      this.options.onEvent({ __jivexml__: text });
    }
  }

  /** Connects to an SSE endpoint and emits events as they arrive. */
  private startSSE(url: string) {
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.options.onEvent(data);
      } catch (err: any) {
        this.options.onError?.(new Error(`SSE parse error: ${err?.message}`));
      }
    };

    this.eventSource.onerror = () => {
      this.options.onError?.(new Error('SSE connection error'));
    };
  }

  /** Minimal zip extraction using the browser's DecompressionStream (Chrome 80+/FF 113+). */
  private async unzip(buffer: ArrayBuffer): Promise<string> {
    // Try native DecompressionStream first (no extra dependency)
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(buffer);
        writer.close();
        const out = await new Response(ds.readable).arrayBuffer();
        return new TextDecoder().decode(out);
      } catch {
        // fall through to JSZip path
      }
    }
    // Fallback: dynamic import of JSZip (already a project dependency)
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);
    const firstFile = Object.values(zip.files)[0];
    return firstFile.async('string');
  }
}
