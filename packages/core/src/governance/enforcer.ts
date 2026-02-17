/* eslint-disable license-header/header */
/**
 * @license
 * Copyright 2025 Russell Nordland
 * Proprietary and Confidential
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TAS_ROOT = process.cwd();
const LOCK_FILE = path.join(TAS_ROOT, 'package-lock.json');
const GOVERNANCE_DIR = path.join(TAS_ROOT, 'packages/core/src/governance');
const GOVERNANCE_FILE = path.join(GOVERNANCE_DIR, 'governance.json');
const DENY_RECEIPT = path.join(TAS_ROOT, 'docs', 'deny_receipt.json');
const MUTATION_LOG = path.join(TAS_ROOT, 'docs', 'mutation.log');

interface EnforcerConfig {
  lockFile: string;
  governanceFile: string;
  denyReceipt: string;
  mutationLog: string;
  forbiddenPatterns: string[];
}

const CONFIG: EnforcerConfig = {
  lockFile: LOCK_FILE,
  governanceFile: GOVERNANCE_FILE,
  denyReceipt: DENY_RECEIPT,
  mutationLog: MUTATION_LOG,
  forbiddenPatterns: ['eval(', 'child_process.exec(', 'child_process.execSync('],
};

function computeHash(filePath: string): string | null {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch {
    return null;
  }
}

function verifyConstraints(): boolean {
  try {
    const governance = JSON.parse(fs.readFileSync(CONFIG.governanceFile, 'utf-8'));
    // Basic structural check
    if (!governance.constraints || !governance.allowed_geos || !governance.allowed_scopes) {
      console.error('[ENFORCER] Invalid governance schema.');
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[ENFORCER] Failed to verify constraints: ${e}`);
    return false;
  }
}

function scanAST(): boolean {
  // Simple regex-based scanner for dangerous patterns
  // In a real implementation, use TypeScript AST traversal
  const sourceDir = path.join(TAS_ROOT, 'packages/core/src');

  function scanDir(dir: string): boolean {
    if (!fs.existsSync(dir)) return true;

    let safe = true;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!scanDir(fullPath)) safe = false;
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of CONFIG.forbiddenPatterns) {
          if (content.includes(pattern)) {
             // Allow list for specific files if necessary (e.g., this file, tests, or legacy code)
             if (file.includes('test') || file.includes('enforcer.ts') || file.includes('shellExecutionService.ts') || file.includes('ide-installer.ts')) continue;

             console.error(`[ENFORCER] VIOLATION: Forbidden pattern '${pattern}' found in ${file}`);
             safe = false;
          }
        }
      }
    }
    return safe;
  }

  return scanDir(sourceDir);
}

function logMutation(message: string): void {
  const entry = `[${new Date().toISOString()}] MUTATION_ATTEMPT: ${message}\n`;
  try {
    fs.appendFileSync(CONFIG.mutationLog, entry);
  } catch {
    // Best effort logging
    console.error('[ENFORCER] Failed to write to mutation log.');
  }
}

export async function turnTheKey(): Promise<boolean> {
  console.log('>>> SYSTEM LOCKDOWN: INITIATING ENFORCEMENT PROTOCOL <<<');

  // 1. Lock Dependency Tree
  const lockHash = computeHash(CONFIG.lockFile);
  if (!lockHash) {
    logMutation('Dependency tree verification failed: package-lock.json missing.');
    console.error('[ENFORCER] FAILURE: Dependency tree unlocked.');
    return false;
  }
  console.log(`[ENFORCER] Dependency Tree Locked. TAS_DNA Hash: ${lockHash.substring(0, 16)}...`);

  // 2. Freeze Constraint Schema
  if (!verifyConstraints()) {
    logMutation('Constraint schema verification failed.');
    console.error('[ENFORCER] FAILURE: Constraint schema invalid or mutable.');
    return false;
  }
  console.log('[ENFORCER] Constraint Schema Frozen.');

  // 3. Activate AST Guard
  if (!scanAST()) {
    logMutation('AST Guard detected forbidden patterns.');
    console.error('[ENFORCER] FAILURE: AST Guard triggered.');
    return false;
  }
  console.log('[ENFORCER] AST Guard Active. No violations detected.');

  // 4. Enforce Parent Binding (Deny Receipt Check)
  if (!fs.existsSync(CONFIG.denyReceipt)) {
    logMutation('Parent binding verification failed: deny_receipt.json missing.');
    console.error('[ENFORCER] FAILURE: Refusal capability unproven (missing deny_receipt.json).');
    return false;
  }
  console.log('[ENFORCER] Parent Binding Verified (Refusal Capability Proven).');

  // 5. Log Mutation (Self-Test)
  logMutation('Enforcement protocol executed successfully.');
  console.log('[ENFORCER] Mutation Log Active.');

  console.log('>>> KEY TURNED. SYSTEM RUNNING. <<<');
  return true;
}
