/* eslint-disable license-header/header */
/**
 * @license
 * Copyright 2025 Russell Nordland
 * Proprietary and Confidential
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// --- Types ---

interface SovereignRequest {
  request_id: string;
  payload: any;
  context: {
    geo_code: string;
    scope: string;
    timestamp: number;
    witness_signatures: string[];
  };
}

interface SovereignReceipt {
  decision: 'ALLOW' | 'DENY';
  reason_codes: string[];
  policy_hash: string;
  timestamp: string;
  request_hash: string;
  details?: any;
}

interface SovereignPolicy {
  geo_check: (geo_code: string) => boolean;
  scope_valid: (scope: string) => boolean;
  witness_diversity: (signatures: string[]) => boolean;
  freshness: (timestamp: number) => boolean;
}

// --- Constants ---

const POLICY_VERSION = 'v1.0.0-alpha';
const ACCEPTED_GEOS = ['US', 'EU', 'JP', 'SG']; // Example safe zones
const ACCEPTED_SCOPES = ['audit.read', 'ledger.write', 'prov.verify'];
const MIN_WITNESSES = 2;
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

// --- Policy Implementation ---

const SovereignPolicyImpl: SovereignPolicy = {
  geo_check: (geo_code: string) => ACCEPTED_GEOS.includes(geo_code),
  scope_valid: (scope: string) => ACCEPTED_SCOPES.includes(scope),
  witness_diversity: (signatures: string[]) => {
    const unique = new Set(signatures);
    return unique.size >= MIN_WITNESSES;
  },
  freshness: (timestamp: number) => {
    const now = Date.now();
    return now - timestamp < MAX_AGE_MS;
  },
};

// --- TAS_DNA Logic ---

function computeHash(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function evaluateConstraints(req: SovereignRequest): string[] {
  const violations: string[] = [];

  if (!SovereignPolicyImpl.geo_check(req.context.geo_code)) {
    violations.push('GEO_CHECK_FAIL');
  }
  if (!SovereignPolicyImpl.scope_valid(req.context.scope)) {
    violations.push('SCOPE_INVALID');
  }
  if (!SovereignPolicyImpl.witness_diversity(req.context.witness_signatures)) {
    violations.push('WITNESS_DIVERSITY_FAIL');
  }
  if (!SovereignPolicyImpl.freshness(req.context.timestamp)) {
    violations.push('TTL_EXPIRED');
  }

  return violations;
}

function processRequest(req: SovereignRequest): SovereignReceipt {
  const violations = evaluateConstraints(req);
  const policyHash = computeHash({ version: POLICY_VERSION, implementation: SovereignPolicyImpl.toString() });
  const requestHash = computeHash(req);

  if (violations.length > 0) {
    // TAS_DNA(C, H_0) -> REFUSAL
    return {
      decision: 'DENY',
      reason_codes: violations,
      policy_hash: policyHash,
      timestamp: new Date().toISOString(),
      request_hash: requestHash,
      details: {
        note: 'Structural refusal anchored to TAS_DNA strand.',
      },
    };
  }

  // TAS_DNA(C, H_0) -> Gene (ALLOW)
  return {
    decision: 'ALLOW',
    reason_codes: [],
    policy_hash: policyHash,
    timestamp: new Date().toISOString(),
    request_hash: requestHash,
    details: {
      note: 'Cryptographic bond invariant satisfied. Execution permitted.',
    },
  };
}

// --- Simulation ---

async function runSimulation() {
  console.log('>>> Initiating Sovereign Policy Enforcement Simulation <<<\n');

  // 1. Valid Request (Control)
  const validRequest: SovereignRequest = {
    request_id: 'req-valid-001',
    payload: { action: 'ledger.commit', data: 'valid_block' },
    context: {
      geo_code: 'US',
      scope: 'ledger.write',
      timestamp: Date.now(),
      witness_signatures: ['sig_alice_123', 'sig_bob_456'],
    },
  };

  console.log(`[INFO] Processing Valid Request: ${validRequest.request_id}`);
  const allowReceipt = processRequest(validRequest);
  console.log(JSON.stringify(allowReceipt, null, 2));
  console.log(`[RESULT] Decision: ${allowReceipt.decision}\n`);


  // 2. Invalid Request (Test Vector: GEO_CHECK violation)
  const invalidRequest: SovereignRequest = {
    request_id: 'req-invalid-geo-001',
    payload: { action: 'ledger.commit', data: 'malicious_block' },
    context: {
      geo_code: 'XX', // Invalid Geo
      scope: 'ledger.write',
      timestamp: Date.now(),
      witness_signatures: ['sig_alice_123', 'sig_bob_456'],
    },
  };

  console.log(`[INFO] Processing Invalid Request (GEO_CHECK Violation): ${invalidRequest.request_id}`);
  const denyReceipt = processRequest(invalidRequest);
  console.log(JSON.stringify(denyReceipt, null, 2));
  console.log(`[RESULT] Decision: ${denyReceipt.decision}\n`);

  // Write receipt to file
  const receiptPath = path.join(process.cwd(), 'docs', 'deny_receipt.json');
  // Ensure docs dir exists
  if (!fs.existsSync(path.dirname(receiptPath))) {
    fs.mkdirSync(path.dirname(receiptPath));
  }

  fs.writeFileSync(receiptPath, JSON.stringify(denyReceipt, null, 2));
  console.log(`[SUCCESS] DENY receipt written to ${receiptPath}`);
}

runSimulation().catch(console.error);
