/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { SlashCommand } from '../ui/commands/types.js';
import { ICommandLoader } from './types.js';

/**
 * Orchestrates the discovery and loading of all slash commands for the CLI.
 *
 * This service operates on a provider-based loader pattern. It is initialized
 * with an array of `ICommandLoader` instances, each responsible for fetching
 * commands from a specific source (e.g., built-in code, local files).
 *
 * The CommandService is responsible for invoking these loaders, aggregating their
 * results, and resolving any name conflicts. This architecture allows the command
 * system to be extended with new sources without modifying the service itself.
 */
export class CommandService {
  /**
   * Private constructor to enforce the use of the async factory.
   * @param commands A readonly array of the fully loaded and de-duplicated commands.
   * @param commandMap A map of command names and aliases to their corresponding
   *   SlashCommand objects for O(1) lookup.
   */
  private constructor(
    private readonly commands: readonly SlashCommand[],
    private readonly commandMap: Map<string, SlashCommand>,
  ) {}

  /**
   * Asynchronously creates and initializes a new CommandService instance.
   *
   * This factory method orchestrates the entire command loading process. It
   * runs all provided loaders in parallel, aggregates their results, handles
   * name conflicts for extension commands by renaming them, pre-computes
   * lookup maps for all commands and subcommands, and then returns a
   * fully constructed `CommandService` instance.
   *
   * Conflict resolution:
   * - Extension commands that conflict with existing commands are renamed to
   *   `extensionName.commandName`
   * - Non-extension commands (built-in, user, project) override earlier commands
   *   with the same name based on loader order
   *
   * @param loaders An array of objects that conform to the `ICommandLoader`
   *   interface. Built-in commands should come first, followed by FileCommandLoader.
   * @param signal An AbortSignal to cancel the loading process.
   * @returns A promise that resolves to a new, fully initialized `CommandService` instance.
   */
  static async create(
    loaders: ICommandLoader[],
    signal: AbortSignal,
  ): Promise<CommandService> {
    const results = await Promise.allSettled(
      loaders.map((loader) => loader.loadCommands(signal)),
    );

    const allCommands: SlashCommand[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allCommands.push(...result.value);
      } else {
        console.debug('A command loader failed:', result.reason);
      }
    }

    const resolvedCommandMap = new Map<string, SlashCommand>();
    for (const cmd of allCommands) {
      let finalName = cmd.name;

      // Extension commands get renamed if they conflict with existing commands
      if (cmd.extensionName && resolvedCommandMap.has(cmd.name)) {
        let renamedName = `${cmd.extensionName}.${cmd.name}`;
        let suffix = 1;

        // Keep trying until we find a name that doesn't conflict
        while (resolvedCommandMap.has(renamedName)) {
          renamedName = `${cmd.extensionName}.${cmd.name}${suffix}`;
          suffix++;
        }

        finalName = renamedName;
      }

      resolvedCommandMap.set(finalName, {
        ...cmd,
        name: finalName,
      });
    }

    const commandMap = this.buildHierarchicalMaps(
      Array.from(resolvedCommandMap.values()),
    );
    const finalCommands = Array.from(new Set(commandMap.values()));

    return new CommandService(Object.freeze(finalCommands), commandMap);
  }

  /**
   * Recursively clones commands and builds lookup maps for them and their subcommands.
   * These maps include both primary names and aliases.
   *
   * @param commands The array of commands to process.
   * @returns A map of command names/aliases to cloned SlashCommand objects.
   */
  private static buildHierarchicalMaps(
    commands: SlashCommand[],
  ): Map<string, SlashCommand> {
    const map = new Map<string, SlashCommand>();
    const clonedCommands: SlashCommand[] = [];

    // First pass: Clone commands and add all primary names.
    for (const cmd of commands) {
      const cloned = { ...cmd };
      clonedCommands.push(cloned);
      map.set(cloned.name, cloned);
    }

    // Second pass: Add all aliases, but only if they don't conflict with a name.
    for (const cloned of clonedCommands) {
      if (cloned.altNames) {
        for (const alt of cloned.altNames) {
          if (!map.has(alt)) {
            map.set(alt, cloned);
          }
        }
      }
    }

    // Recursively process subcommands.
    for (const cloned of clonedCommands) {
      if (cloned.subCommands && cloned.subCommands.length > 0) {
        // Build subCommandMap using cloned subcommands.
        cloned.subCommandMap = this.buildHierarchicalMaps(cloned.subCommands);
        // Update subCommands array to point to the clones.
        cloned.subCommands = Array.from(new Set(cloned.subCommandMap.values()));
      }
    }

    return map;
  }

  /**
   * Retrieves the currently loaded and de-duplicated list of slash commands.
   *
   * This method is a safe accessor for the service's state. It returns a
   * readonly array, preventing consumers from modifying the service's internal state.
   *
   * @returns A readonly, unified array of available `SlashCommand` objects.
   */
  getCommands(): readonly SlashCommand[] {
    return this.commands;
  }

  /**
   * Retrieves the pre-computed lookup map for all top-level slash commands.
   *
   * @returns A map of names and aliases to their corresponding SlashCommand objects.
   */
  getCommandMap(): Map<string, SlashCommand> {
    return this.commandMap;
  }
}
