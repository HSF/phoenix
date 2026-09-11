import { Color } from 'three';

/**
 * Hexadecimal colours as they appear in event data, with an optional `#` or
 * `0x` prefix and either three or six digits.
 */
const HEX_COLOR = /^(?:0x|#)?((?:[0-9a-f]{3}){1,2})$/i;

/**
 * Parse a colour as it may appear in event data.
 *
 * Event data is written by many different producers, so the same colour turns
 * up as `ff0000`, `#ff0000` or `0xff0000`. All three are accepted here, along
 * with a number, an existing `Color`, and any style `Color.set` understands
 * (`rgb(...)`, `hsl(...)`, or a named colour).
 *
 * Anything unrecognised gives `undefined` rather than a silently wrong colour,
 * so callers can fall back to a sensible default of their own - see
 * `EVENT_DATA_TYPE_COLORS`.
 * @param value Colour to parse.
 * @returns The parsed colour, or `undefined` if it could not be parsed.
 */
export function parseColor(value: any): Color | undefined {
  if (value instanceof Color) {
    return value.clone();
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Color(value) : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  const hexColor = HEX_COLOR.exec(trimmedValue);
  if (hexColor) {
    return new Color(`#${hexColor[1]}`);
  }

  // `Color.set` warns on the console and silently returns white for anything it
  // does not recognise, so only hand it styles which are known to be valid.
  if (
    /^(?:rgb|hsl)a?\(/i.test(trimmedValue) ||
    trimmedValue.toLowerCase() in Color.NAMES
  ) {
    return new Color(trimmedValue);
  }

  return undefined;
}
