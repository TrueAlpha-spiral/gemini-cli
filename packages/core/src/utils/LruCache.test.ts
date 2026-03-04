/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LruCache } from './LruCache.js';

describe('LruCache', () => {
  let cache: LruCache<string, number>;

  beforeEach(() => {
    cache = new LruCache<string, number>(3);
  });

  describe('basic functionality', () => {
    it('should store and retrieve values', () => {
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('b')).toBeUndefined();
    });

    it('should update existing keys', () => {
      cache.set('a', 1);
      cache.set('a', 2);
      expect(cache.get('a')).toBe(2);
    });
  });

  describe('eviction policy', () => {
    it('should evict the oldest item when capacity is exceeded', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // This should evict 'a'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move accessed items to the end of the eviction queue', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a', making 'b' the oldest
      cache.get('a');

      cache.set('d', 4); // This should evict 'b' instead of 'a'

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move updated items to the end of the eviction queue', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Update 'a', making 'b' the oldest
      cache.set('a', 10);

      cache.set('d', 4); // This should evict 'b' instead of 'a'

      expect(cache.get('a')).toBe(10);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });
  });

  describe('clear functionality', () => {
    it('should remove all items from the cache', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();

      // Should be able to add up to maxSize items again
      cache.set('c', 3);
      cache.set('d', 4);
      cache.set('e', 5);

      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
      expect(cache.get('e')).toBe(5);
    });
  });
});
