/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type SlashCommand } from '../ui/commands/types.js';

export type ParsedSlashCommand = {
  commandToExecute: SlashCommand | undefined;
  args: string;
  canonicalPath: string[];
};

/**
 * Pre-computes a fast lookup map for top-level commands.
 * It indexes both the primary command name and any aliases.
 */
export const buildCommandLookupMap = (
  commands: readonly SlashCommand[],
): Map<string, SlashCommand> => {
  const map = new Map<string, SlashCommand>();

  // First pass: Index primary names
  for (const cmd of commands) {
    if (!map.has(cmd.name)) {
      map.set(cmd.name, cmd);
    }
  }

  // Second pass: Index aliases only if they don't conflict with a primary name
  for (const cmd of commands) {
    if (cmd.altNames) {
      for (const alt of cmd.altNames) {
        if (!map.has(alt)) {
          map.set(alt, cmd);
        }
      }
    }
  }

  return map;
};

/**
 * Parses a raw slash command string into its command, arguments, and canonical path.
 * If no valid command is found, the `commandToExecute` property will be `undefined`.
 *
 * @param query The raw input string, e.g., "/memory add some data" or "/help".
 * @param commandsMap The pre-computed lookup map of available top-level slash commands.
 * @returns An object containing the resolved command, its arguments, and its canonical path.
 */
export const parseSlashCommand = (
  query: string,
  commandsMap: ReadonlyMap<string, SlashCommand>,
): ParsedSlashCommand => {
  const trimmed = query.trim();

  const parts = trimmed.substring(1).trim().split(/\s+/);
  const commandPath = parts.filter((p) => p); // The parts of the command, e.g., ['memory', 'add']

  let commandToExecute: SlashCommand | undefined;
  let pathIndex = 0;
  const canonicalPath: string[] = [];

  if (commandPath.length > 0) {
    const rootPart = commandPath[0];
    const rootCommand = commandsMap.get(rootPart);

    if (rootCommand) {
      commandToExecute = rootCommand;
      canonicalPath.push(rootCommand.name);
      pathIndex++;

      let currentCommands = rootCommand.subCommands;

      while (currentCommands && pathIndex < commandPath.length) {
        const part = commandPath[pathIndex];

        // First pass: check for an exact match on the primary command name.
        let foundCommand = currentCommands.find((cmd) => cmd.name === part);

        // Second pass: if no primary name matches, check for an alias.
        if (!foundCommand) {
          foundCommand = currentCommands.find((cmd) =>
            cmd.altNames?.includes(part),
          );
        }

        if (foundCommand) {
          commandToExecute = foundCommand;
          canonicalPath.push(foundCommand.name);
          pathIndex++;
          currentCommands = foundCommand.subCommands;
        } else {
          break;
        }
      }
    }
  }

  const args = parts.slice(pathIndex).join(' ');

  return { commandToExecute, args, canonicalPath };
};
