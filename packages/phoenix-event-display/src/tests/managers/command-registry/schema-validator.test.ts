import { validateArgs } from '../../../managers/command-registry/schema-validator';
import type { CommandParamSchema } from '../../../managers/command-registry/command.model';

const schema: CommandParamSchema = {
  type: 'object',
  properties: {
    dark: { type: 'boolean' },
    index: { type: 'integer', minimum: 0 },
    dir: { type: 'string', enum: ['in', 'out'] },
  },
  required: ['dark'],
  additionalProperties: false,
};

describe('validateArgs', () => {
  it('accepts valid args', () => {
    expect(validateArgs(schema, { dark: true, index: 2, dir: 'in' })).toEqual({
      valid: true,
    });
  });
  it('rejects a missing required param', () => {
    expect(validateArgs(schema, { index: 1 }).valid).toBe(false);
  });
  it('rejects a wrong type', () => {
    expect(validateArgs(schema, { dark: 'yes' }).valid).toBe(false);
  });
  it('rejects a non-integer for integer', () => {
    expect(validateArgs(schema, { dark: true, index: 1.5 }).valid).toBe(false);
  });
  it('rejects a value outside the enum', () => {
    expect(validateArgs(schema, { dark: true, dir: 'sideways' }).valid).toBe(
      false,
    );
  });
  it('rejects a number below minimum', () => {
    expect(validateArgs(schema, { dark: true, index: -1 }).valid).toBe(false);
  });
  it('rejects unknown params when additionalProperties is false', () => {
    expect(validateArgs(schema, { dark: true, bogus: 1 }).valid).toBe(false);
  });
  it('rejects non-object args', () => {
    expect(validateArgs(schema, 'nope' as unknown).valid).toBe(false);
  });
  it('rejects an inherited-name key (e.g. __proto__) as unknown', () => {
    // JSON.parse yields a real own "__proto__" property, as AI/URL input would.
    const args = JSON.parse('{"dark":true,"__proto__":1}');
    expect(validateArgs(schema, args).valid).toBe(false);
  });
});
