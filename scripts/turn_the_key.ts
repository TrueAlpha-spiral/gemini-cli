/* eslint-disable license-header/header */
/**
 * @license
 * Copyright 2025 Russell Nordland
 * Proprietary and Confidential
 */

import { turnTheKey } from '../packages/core/src/governance/enforcer.js';

// Standalone execution of the enforcement protocol
async function run() {
  const result = await turnTheKey();
  if (result) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
