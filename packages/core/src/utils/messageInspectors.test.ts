/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { isFunctionResponse, isFunctionCall } from './messageInspectors.js';
import { Content } from '@google/genai';

describe('messageInspectors', () => {
  describe('isFunctionResponse', () => {
    it('should return true if role is user and all parts are function responses', () => {
      const content: Content = {
        role: 'user',
        parts: [
          { functionResponse: { name: 'test', response: {} } },
          { functionResponse: { name: 'test2', response: {} } },
        ],
      };
      expect(isFunctionResponse(content)).toBe(true);
    });

    it('should return false if role is not user', () => {
      const content: Content = {
        role: 'model',
        parts: [{ functionResponse: { name: 'test', response: {} } }],
      };
      expect(isFunctionResponse(content)).toBe(false);
    });

    it('should return false if parts is missing', () => {
      const content: Content = {
        role: 'user',
      };
      expect(isFunctionResponse(content)).toBe(false);
    });

    it('should return true if parts is empty array (every returns true for empty)', () => {
      const content: Content = {
        role: 'user',
        parts: [],
      };
      expect(isFunctionResponse(content)).toBe(true);
    });

    it('should return false if any part is not a function response', () => {
      const content: Content = {
        role: 'user',
        parts: [
          { functionResponse: { name: 'test', response: {} } },
          { text: 'hello' },
        ],
      };
      expect(isFunctionResponse(content)).toBe(false);
    });
  });

  describe('isFunctionCall', () => {
    it('should return true if role is model and all parts are function calls', () => {
      const content: Content = {
        role: 'model',
        parts: [
          { functionCall: { name: 'test', args: {} } },
          { functionCall: { name: 'test2', args: {} } },
        ],
      };
      expect(isFunctionCall(content)).toBe(true);
    });

    it('should return false if role is not model', () => {
      const content: Content = {
        role: 'user',
        parts: [{ functionCall: { name: 'test', args: {} } }],
      };
      expect(isFunctionCall(content)).toBe(false);
    });

    it('should return false if parts is missing', () => {
      const content: Content = {
        role: 'model',
      };
      expect(isFunctionCall(content)).toBe(false);
    });

    it('should return true if parts is empty array', () => {
      const content: Content = {
        role: 'model',
        parts: [],
      };
      expect(isFunctionCall(content)).toBe(true);
    });

    it('should return false if any part is not a function call', () => {
      const content: Content = {
        role: 'model',
        parts: [
          { functionCall: { name: 'test', args: {} } },
          { text: 'hello' },
        ],
      };
      expect(isFunctionCall(content)).toBe(false);
    });
  });
});
