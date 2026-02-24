/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Creates a logger instance for a specific context.
 *
 * @param context The context string to include in log messages (e.g., 'BfsFileSearch').
 * @returns An AppLogger instance.
 */
export function getLogger(context: string): AppLogger {
  return {
    debug: (message: string, ...args: unknown[]) => {
      console.debug(`[DEBUG] [${context}]`, message, ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      console.info(`[INFO] [${context}]`, message, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[WARN] [${context}]`, message, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[ERROR] [${context}]`, message, ...args);
    },
  };
}
