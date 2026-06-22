/**
 * @jest-environment jsdom
 */
import {
  CompressionStream as NodeCompressionStream,
  DecompressionStream as NodeDecompressionStream,
} from 'node:stream/web';
import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from 'node:util';

// jsdom in the project's older test runtime lacks several Web APIs the codec
// uses in production browsers. Patch them from Node.js so the codec is
// exercisable end-to-end. None of these polyfills ship to runtime code.
beforeAll(() => {
  if (typeof globalThis.CompressionStream === 'undefined') {
    (globalThis as any).CompressionStream = NodeCompressionStream;
  }
  if (typeof globalThis.DecompressionStream === 'undefined') {
    (globalThis as any).DecompressionStream = NodeDecompressionStream;
  }
  if (typeof globalThis.TextEncoder === 'undefined') {
    (globalThis as any).TextEncoder = NodeTextEncoder;
  }
  if (typeof globalThis.TextDecoder === 'undefined') {
    (globalThis as any).TextDecoder = NodeTextDecoder;
  }
});

import {
  decodeSessionFromBase64,
  decodeSessionFromJson,
  encodeSessionToBase64,
  encodeSessionToBlob,
} from '../../../managers/session-manager/session-codec';
import {
  SESSION_VERSION,
  SessionV1,
} from '../../../managers/session-manager/session-format';

function makeSession(): SessionV1 {
  return {
    version: SESSION_VERSION,
    createdAt: '2026-06-02T00:00:00.000Z',
    duration: 1234,
    source: { experiment: 'atlas' },
    initialState: { foo: 1 },
    events: [
      { t: 100, name: 'particle-tagged', payload: { uuid: 'u1' } },
      { t: 500, name: 'result-recorded', payload: { mass: 91 } },
    ],
    cameraSamples: [
      { t: 0, pos: [1, 2, 3], target: [0, 0, 0] },
      { t: 1000, pos: [2, 3, 4], target: [0, 0, 0] },
    ],
  };
}

describe('session-codec', () => {
  it('encodes and decodes a session round-trip via base64', async () => {
    const session = makeSession();
    const b64 = await encodeSessionToBase64(session);
    expect(typeof b64).toBe('string');
    expect(b64.length).toBeGreaterThan(0);
    const decoded = await decodeSessionFromBase64(b64);
    expect(decoded).toEqual(session);
  });

  it('produces a smaller payload via base64 than raw JSON', async () => {
    const session = makeSession();
    const b64 = await encodeSessionToBase64(session);
    const raw = JSON.stringify(session);
    expect(b64.length).toBeLessThanOrEqual(raw.length + 32);
  });

  it('rejects invalid base64 input with a clear error', async () => {
    await expect(decodeSessionFromBase64('!!!not-base64!!!')).rejects.toThrow(
      /base64/i,
    );
  });

  it('rejects empty input', async () => {
    await expect(decodeSessionFromBase64('')).rejects.toThrow(/empty/i);
  });

  it('rejects malformed JSON inside valid deflate', async () => {
    const encoded = await encodeArbitraryToBase64('this is not json at all');
    await expect(decodeSessionFromBase64(encoded)).rejects.toThrow(/json/i);
  });

  it('rejects a payload that fails schema validation', async () => {
    const encoded = await encodeArbitraryToBase64(
      JSON.stringify({ version: 99 }),
    );
    await expect(decodeSessionFromBase64(encoded)).rejects.toThrow(/schema/i);
  });

  // Helper that compresses arbitrary text via CompressionStream and returns
  // the base64 of the deflate stream output. Used to fabricate edge-case
  // payloads (malformed JSON, wrong version) for the decoder.
  async function encodeArbitraryToBase64(text: string): Promise<string> {
    const input = new TextEncoder().encode(text);
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    writer.write(input).catch(() => {});
    writer.close().catch(() => {});
    const reader = cs.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let binary = '';
    for (let i = 0; i < merged.length; i++)
      binary += String.fromCharCode(merged[i]);
    return btoa(binary);
  }

  it('encodes a large session without deadlocking, and round-trips it', async () => {
    // A session whose JSON far exceeds the CompressionStream internal buffer.
    // Regression guard: awaiting write/close before reading the output
    // deadlocks here (the real Copy-link bug on big sessions).
    const big = makeSession();
    big.initialState = { menu: 'x'.repeat(300 * 1024) };
    const b64 = await encodeSessionToBase64(big);
    expect(b64.length).toBeGreaterThan(0);
    const decoded = await decodeSessionFromBase64(b64);
    expect(decoded.initialState).toEqual(big.initialState);
    expect(decoded.events.length).toBe(big.events.length);
  });

  it('rejects a compression bomb that exceeds the decompressed size cap', async () => {
    // ~60 MB of highly-compressible zeros deflates to a tiny payload but
    // would blow past MAX_DECOMPRESSED_BYTES (50 MB) when inflated.
    const huge = new Uint8Array(60 * 1024 * 1024);
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    writer.write(huge).catch(() => {});
    writer.close().catch(() => {});
    const reader = cs.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let binary = '';
    for (let i = 0; i < merged.length; i++)
      binary += String.fromCharCode(merged[i]);
    await expect(decodeSessionFromBase64(btoa(binary))).rejects.toThrow(
      /size limit/i,
    );
  });

  it('produces an application/json blob via encodeSessionToBlob', () => {
    const blob = encodeSessionToBlob(makeSession());
    expect(blob.type).toBe('application/json');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('decodes a raw JSON session text correctly', () => {
    const session = makeSession();
    const text = JSON.stringify(session);
    expect(decodeSessionFromJson(text)).toEqual(session);
  });

  it('rejects raw JSON of invalid shape', () => {
    expect(() => decodeSessionFromJson('{"version":99}')).toThrow();
  });
});
