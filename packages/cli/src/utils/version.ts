/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPackageJson } from './package.js';

export async function getCliVersion(): Promise<string> {
  if (process.env.CLI_VERSION) {
    return process.env.CLI_VERSION;
  }
  const pkgJson = await getPackageJson();
  return pkgJson.version || 'unknown';
}
