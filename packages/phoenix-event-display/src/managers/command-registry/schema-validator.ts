import type { CommandParamSchema } from './command.model';

/** Result of validating command arguments against a schema. */
export interface ValidationResult {
  /** True when the arguments satisfy the schema. */
  valid: boolean;
  /** Human-readable reason when invalid. */
  error?: string;
}

/**
 * Validate an arguments object against a command's JSON-Schema subset.
 * Supports type (string/number/integer/boolean), required, enum, minimum,
 * maximum, and additionalProperties:false. Zero dependencies.
 * @param schema The command's input schema.
 * @param args The arguments to validate.
 * @returns Whether the arguments are valid, with an error message if not.
 */
export function validateArgs(
  schema: CommandParamSchema,
  args: unknown,
): ValidationResult {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) {
    return { valid: false, error: 'arguments must be an object' };
  }
  const obj = args as Record<string, unknown>;
  const props = schema.properties ?? {};

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(obj)) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        return { valid: false, error: `unknown parameter '${key}'` };
      }
    }
  }

  for (const name of schema.required ?? []) {
    if (obj[name] === undefined) {
      return { valid: false, error: `missing required parameter '${name}'` };
    }
  }

  for (const [name, prop] of Object.entries(props)) {
    const value = obj[name];
    if (value === undefined) continue;

    const typeOk =
      prop.type === 'integer'
        ? typeof value === 'number' && Number.isInteger(value)
        : prop.type === 'number'
          ? typeof value === 'number'
          : typeof value === prop.type;
    if (!typeOk) {
      return {
        valid: false,
        error: `parameter '${name}' must be ${prop.type}`,
      };
    }

    if (prop.enum && !prop.enum.includes(value as string | number)) {
      return {
        valid: false,
        error: `parameter '${name}' must be one of: ${prop.enum.join(', ')}`,
      };
    }

    if (typeof value === 'number') {
      if (prop.minimum !== undefined && value < prop.minimum) {
        return {
          valid: false,
          error: `parameter '${name}' must be >= ${prop.minimum}`,
        };
      }
      if (prop.maximum !== undefined && value > prop.maximum) {
        return {
          valid: false,
          error: `parameter '${name}' must be <= ${prop.maximum}`,
        };
      }
    }
  }

  return { valid: true };
}
