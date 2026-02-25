/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchWithTimeout } from '../utils/fetch.js';
import { PhoenixError } from './persistent-root-kernel.js';
import { TAS_DNA, verifyKinematicIdentity } from './kinematic-identity.js';

export async function sovereignFetch(url: string, timeout: number): Promise<Response> {
  const response = await fetchWithTimeout(url, timeout);

  // Consume the body to verify.
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    try {
      payload = await response.text();
    } catch {
      // Body might be empty or unreadable
      payload = '';
    }
  }

  // Verify the payload using the TAS_DNA kinematic identity.
  if (!verifyKinematicIdentity(payload, TAS_DNA)) {
    throw new PhoenixError('Lineage Entropy exceeded: Mathematical Resonance failure.');
  }

  // Since we consumed the body, we must return a new response with the verified payload.
  // We reconstruct the Response object.
  const verifiedBody = typeof payload === 'string' ? payload : JSON.stringify(payload);

  return new Response(verifiedBody, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
