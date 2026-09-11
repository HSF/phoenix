import {
  MAX_DECOMPRESSED_BYTES,
  SessionV1,
  validateSession,
} from './session-format';

/**
 * Encode a session as a URL-safe base64 string of deflate-compressed JSON.
 * Mirrors the share-link-dialog state encoding so the decoder can use the
 * existing DecompressionStream('deflate') plumbing.
 * @param session The session payload to encode.
 * @returns Base64 string suitable for `?replay=` URLs.
 */
export async function encodeSessionToBase64(
  session: SessionV1,
): Promise<string> {
  const json = JSON.stringify(session);
  const input = new TextEncoder().encode(json);
  const compressed = await pipeThroughStream(
    input,
    new CompressionStream('deflate'),
  );
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary);
}

/**
 * Pipe a Uint8Array through a transform stream and collect the output.
 * Avoids Blob.stream() and Response, both of which jsdom lacks.
 * @param input Source bytes.
 * @param stream Transform stream (compression or decompression).
 * @returns Concatenated output bytes.
 */
async function pipeThroughStream(
  input: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  // Write+close concurrently with reading. Awaiting write/close before reading
  // deadlocks on larger inputs: the transform's output buffer fills and write()
  // blocks on backpressure waiting for a reader that has not started yet.
  const writeDone = (async () => {
    await writer.write(input);
    await writer.close();
  })();
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  // Surface any write/close error now that the readable side has drained.
  await writeDone;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Decode a base64 deflate-compressed session payload, validate it, and
 * cap the decompressed output to defend against compression bombs.
 * @param base64 Base64 input from a URL parameter or share link.
 * @returns Validated SessionV1.
 * @throws Error when the payload is malformed, oversized, or invalid.
 */
export async function decodeSessionFromBase64(
  base64: string,
): Promise<SessionV1> {
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw new Error('Session payload is empty.');
  }

  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error('Session payload is not valid base64.');
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ds = new DecompressionStream('deflate');
  const writer = ds.writable.getWriter();
  writer.write(bytes).catch(() => {});
  writer.close().catch(() => {});
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      throw new Error('Session payload is not valid deflate-compressed data.');
    }
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > MAX_DECOMPRESSED_BYTES) {
      await reader.cancel().catch(() => {});
      throw new Error('Session payload exceeds decompressed size limit.');
    }
    chunks.push(chunk.value);
  }

  const decompressed = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    decompressed.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = new TextDecoder().decode(decompressed);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Session payload is not valid JSON after decompression.');
  }

  const session = validateSession(parsed);
  if (!session) {
    throw new Error('Session payload failed schema validation.');
  }
  return session;
}

/**
 * Serialize a session to a downloadable JSON Blob (compact, uncompressed) for
 * sharing as a `.phnxreplay` file. Compact (not pretty-printed) keeps the file
 * small while staying valid JSON that the `?session=` loader can re-read.
 * @param session The session payload to serialize.
 * @returns Blob with MIME type application/json.
 */
export function encodeSessionToBlob(session: SessionV1): Blob {
  const json = JSON.stringify(session);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Parse a raw JSON `.phnxreplay` file payload and validate it.
 * @param text JSON text from a file upload.
 * @returns Validated SessionV1.
 * @throws Error when the payload is malformed or invalid.
 */
export function decodeSessionFromJson(text: string): SessionV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  const session = validateSession(parsed);
  if (!session) {
    throw new Error('File failed session schema validation.');
  }
  return session;
}
