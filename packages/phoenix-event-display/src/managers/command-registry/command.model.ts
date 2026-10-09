import type { CommandHost } from './command-host';

/** JSON-Schema (2020-12 subset) description of one command parameter. */
export interface CommandProperty {
  /** JSON type of the parameter. */
  type: 'string' | 'number' | 'integer' | 'boolean';
  /** Human-readable description shown in the palette and NL prompt. */
  description?: string;
  /** Allowed static values. */
  enum?: (string | number)[];
  /** Name of a live source that fills `enum` at runtime, resolved by later phases. */
  enumSource?: 'collections' | 'geometryParts' | 'presetViews' | 'eventKeys';
  /** Inclusive lower bound for numeric parameters. */
  minimum?: number;
  /** Inclusive upper bound for numeric parameters. */
  maximum?: number;
}

/** JSON-Schema (2020-12 subset) for a command's arguments object. */
export interface CommandParamSchema {
  /** Always 'object' for command arguments. */
  type: 'object';
  /** Parameter definitions keyed by parameter name. */
  properties: Record<string, CommandProperty>;
  /** Names of required parameters. */
  required?: string[];
  /** When false, unknown parameters are rejected. */
  additionalProperties?: false;
}

/** Result of executing a command. */
export type CommandResult =
  | { ok: true; result?: any }
  | { ok: false; error: string };

/** A named, self-describing action over the Phoenix API. */
export interface Command<A = any> {
  /** Unique id, MCP charset [A-Za-z0-9_.-], e.g. 'next-event'. */
  name: string;
  /** Optional human-readable label for the palette. */
  title?: string;
  /** What the command does (palette + NL prompt). */
  description: string;
  /** Grouping category, e.g. 'Navigation'. */
  category: string;
  /** JSON-Schema for the arguments. */
  inputSchema: CommandParamSchema;
  /** True if the command changes the view (needs confirmation); false for read-only queries. */
  mutates: boolean;
  /** Perform the command against the live host. */
  run: (args: A, host: CommandHost) => any;
}

/** MCP-style tool description derived from a Command. */
export interface McpToolShape {
  /** Tool name (the command name). */
  name: string;
  /** Human-readable description. */
  description: string;
  /** JSON-Schema for the parameters. */
  inputSchema: CommandParamSchema;
}
