/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import {
  validateNonInteractiveAuth,
} from './validateNonInterActiveAuth.js';
import { AuthType, Config } from '@google/gemini-cli-core';
import * as auth from './config/auth.js';

describe('validateNonInteractiveAuth', () => {
  let originalEnvGeminiApiKey: string | undefined;
  let originalEnvVertexAi: string | undefined;
  let originalEnvGcp: string | undefined;
  let consoleErrorSpy: MockInstance;
  let processExitSpy: MockInstance;
  let mockConfig: Config;

  beforeEach(() => {
    originalEnvGeminiApiKey = process.env.GEMINI_API_KEY;
    originalEnvVertexAi = process.env.GOOGLE_GENAI_USE_VERTEXAI;
    originalEnvGcp = process.env.GOOGLE_GENAI_USE_GCA;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
    delete process.env.GOOGLE_GENAI_USE_GCA;

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code}) called`);
    });

    mockConfig = {
      refreshAuth: vi.fn().mockResolvedValue(undefined),
    } as unknown as Config;
  });

  afterEach(() => {
    if (originalEnvGeminiApiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalEnvGeminiApiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    if (originalEnvVertexAi !== undefined) {
      process.env.GOOGLE_GENAI_USE_VERTEXAI = originalEnvVertexAi;
    } else {
      delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
    }
    if (originalEnvGcp !== undefined) {
      process.env.GOOGLE_GENAI_USE_GCA = originalEnvGcp;
    } else {
      delete process.env.GOOGLE_GENAI_USE_GCA;
    }
    vi.restoreAllMocks();
  });

  it('exits if no auth type is configured or env vars set', async () => {
    try {
      await validateNonInteractiveAuth(
        undefined,
        false,
        mockConfig,
      );
      // expect.fail('Should have exited'); // expect.fail not available in all vitest versions
      throw new Error('Should have exited');
    } catch (e) {
      expect((e as Error).message).toContain('process.exit(1) called');
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Please set an Auth method'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('uses LOGIN_WITH_GOOGLE if GOOGLE_GENAI_USE_GCA is set', async () => {
    process.env.GOOGLE_GENAI_USE_GCA = 'true';
    await validateNonInteractiveAuth(
      undefined,
      false,
      mockConfig,
    );
    expect(mockConfig.refreshAuth).toHaveBeenCalledWith(AuthType.LOGIN_WITH_GOOGLE);
  });

  it('uses USE_GEMINI if GEMINI_API_KEY is set', async () => {
    process.env.GEMINI_API_KEY = 'fake-key';
    await validateNonInteractiveAuth(
      undefined,
      false,
      mockConfig,
    );
    expect(mockConfig.refreshAuth).toHaveBeenCalledWith(AuthType.USE_GEMINI);
  });
});
