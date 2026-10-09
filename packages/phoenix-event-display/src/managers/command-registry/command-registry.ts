import type { Command, CommandResult, McpToolShape } from './command.model';
import type { CommandHost } from './command-host';
import { validateArgs } from './schema-validator';

/** Event name emitted on the Phoenix bus after a command runs. */
export const COMMAND_EXECUTED_EVENT = 'command-executed';

/**
 * Registry of named, self-describing commands over the Phoenix API.
 * Framework-agnostic and dependency-free. Arguments are validated against
 * each command's input schema before running; 'command-executed' is emitted
 * on the host bus after a successful run.
 */
export class CommandRegistry {
  /** Registered commands keyed by name. */
  private commands = new Map<string, Command>();

  /** Adapter bridging commands to the live Phoenix instance. */
  private readonly host: CommandHost;

  /**
   * Create a registry bound to a live-Phoenix host.
   * @param host Adapter bridging commands to the live Phoenix instance.
   */
  constructor(host: CommandHost) {
    this.host = host;
  }

  /**
   * Register a command. A later registration with the same name replaces it.
   * @param command The command to register.
   */
  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  /**
   * Get a command by name.
   * @param name The command name.
   * @returns The command, or undefined if not registered.
   */
  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * List all registered commands in name order (deterministic).
   * @returns The registered commands sorted by name.
   */
  list(): Command[] {
    return [...this.commands.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  /**
   * Describe the registered commands as MCP-style tool shapes.
   * @returns One tool shape per command, in name order.
   */
  toToolSchemas(): McpToolShape[] {
    return this.list().map((c) => ({
      name: c.name,
      description: c.description,
      inputSchema: c.inputSchema,
    }));
  }

  /**
   * Validate and run a command, emitting 'command-executed' on success.
   * @param name The command name.
   * @param args The command arguments (defaults to an empty object).
   * @returns Ok with an optional result, or an error message.
   */
  async execute(name: string, args: unknown = {}): Promise<CommandResult> {
    const command = this.commands.get(name);
    if (!command) {
      return { ok: false, error: `unknown command '${name}'` };
    }
    const validation = validateArgs(command.inputSchema, args);
    if (!validation.valid) {
      return { ok: false, error: validation.error ?? 'invalid arguments' };
    }
    try {
      const result = await command.run(args, this.host);
      this.host.emit(COMMAND_EXECUTED_EVENT, { name, args, result });
      return { ok: true, result };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
