/**
 * Origin checks for the agent bridge's postMessage transport.
 *
 * Every check parses the origin with `URL` and compares the parsed parts.
 * Raw-string tricks (substring, prefix, regular expressions) are exactly how
 * look-alike hosts such as `http://localhost.evil.com` get through, so none are
 * used here.
 */

/** Decides whether a message origin may drive Phoenix. */
export type OriginMatcher = (origin: string) => boolean;

/**
 * One allowlist entry: an exact origin (`https://notebook.example.org`), the
 * {@link ANY_ORIGIN} wildcard, or a matcher such as {@link isLoopbackOrigin}.
 */
export type OriginRule = string | OriginMatcher;

/**
 * The allowlist entry that admits any concrete origin. Only for an app that
 * deliberately chooses it; never produced by a URL switch.
 */
export const ANY_ORIGIN = '*';

/** Hostnames that name this machine's loopback interface, as `URL` reports them. */
const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];

/**
 * Whether a hostname is the local loopback host.
 * @param hostname A hostname as `URL` or `window.location` reports it.
 * @returns True for exactly `localhost`, `127.0.0.1` and `[::1]`.
 */
export function isLoopbackHostname(hostname: unknown): boolean {
  return typeof hostname === 'string' && LOOPBACK_HOSTNAMES.includes(hostname);
}

/**
 * The canonical serialization of an origin, or null when the value is not a
 * concrete (non-opaque) origin. A value with a path, credentials or other
 * extras is normalized away, so callers that need an exact origin compare the
 * result with the input.
 * @param value A candidate origin string.
 * @returns The `URL` origin, or null for malformed or opaque values.
 */
function canonicalOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || value === '' || value === 'null') {
    return null;
  }
  try {
    const origin = new URL(value).origin;
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}

/**
 * The local development policy used by the `?agent=1` switch: admits a page
 * served over `http:` or `https:` from `localhost`, `127.0.0.1` or `[::1]`, on
 * any port. Rejects the opaque `"null"` origin (which any page can obtain with
 * a sandboxed `srcdoc` iframe), other schemes, look-alike DNS names, and
 * anything that is not exactly a serialized origin. Because the comparison is
 * on the hostname in the origin, a DNS-rebinding page (`http://evil.com:4200`
 * resolving to 127.0.0.1) is rejected too.
 * @param origin A `MessageEvent.origin`.
 * @returns True only for a loopback web origin.
 */
export function isLoopbackOrigin(origin: unknown): boolean {
  const canonical = canonicalOrigin(origin);
  if (canonical === null || canonical !== origin) return false;
  const url = new URL(canonical);
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    isLoopbackHostname(url.hostname)
  );
}

/**
 * Whether a message origin passes an allowlist. Fails closed: a missing,
 * empty or non-array allowlist admits nobody, a malformed entry admits nothing,
 * a matcher that throws denies, and the opaque `"null"` origin is never
 * admitted (a reply to it could only be sent with targetOrigin `'*'`, which
 * would hand it to whatever the window has navigated to).
 * @param origin A `MessageEvent.origin`.
 * @param rules The allowlist.
 * @returns True when some rule admits the origin.
 */
export function isOriginAllowed(
  origin: unknown,
  rules: readonly OriginRule[] | null | undefined,
): boolean {
  if (typeof origin !== 'string' || origin === '' || origin === 'null') {
    return false;
  }
  if (!Array.isArray(rules)) return false;
  for (const rule of rules) {
    if (typeof rule === 'function') {
      try {
        if (rule(origin) === true) return true;
      } catch {
        // A broken rule denies rather than taking the page down.
      }
    } else if (rule === ANY_ORIGIN) {
      return true;
    } else if (canonicalOrigin(rule) === origin) {
      return true;
    }
  }
  return false;
}
