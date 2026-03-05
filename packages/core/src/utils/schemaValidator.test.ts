import { describe, it, expect } from 'vitest';
import { SchemaValidator } from './schemaValidator.js';
import { Schema } from '@google/genai';

describe('SchemaValidator', () => {
  describe('validate', () => {
    it('returns null if schema is undefined', () => {
      expect(SchemaValidator.validate(undefined, {})).toBeNull();
    });

    it('returns error if data is not an object', () => {
      const errorMsg = 'Value of params must be an object';
      expect(SchemaValidator.validate({ type: 'OBJECT' } as Schema, 'string')).toBe(errorMsg);
      expect(SchemaValidator.validate({ type: 'OBJECT' } as Schema, 123)).toBe(errorMsg);
      expect(SchemaValidator.validate({ type: 'OBJECT' } as Schema, null)).toBe(errorMsg);
      expect(SchemaValidator.validate({ type: 'OBJECT' } as Schema, undefined)).toBe(errorMsg);
      expect(SchemaValidator.validate({ type: 'OBJECT' } as Schema, true)).toBe(errorMsg);
    });

    it('returns null for valid data matching a simple schema', () => {
      const schema: Schema = {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          age: { type: 'INTEGER' },
        },
      } as Schema;

      const data = { name: 'Alice', age: 30 };
      expect(SchemaValidator.validate(schema, data)).toBeNull();
    });

    it('returns error string for invalid data against a simple schema', () => {
      const schema: Schema = {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
        },
      } as Schema;

      const data = { name: 123 }; // Invalid type
      const result = SchemaValidator.validate(schema, data);
      expect(result).toContain('params/name');
      expect(result).toContain('must be string');
    });

    it('handles toObjectSchema conversion for STRING type correctly', () => {
      const schema: Schema = {
        type: 'OBJECT',
        properties: {
          value: { type: 'STRING' },
        },
      } as Schema;

      expect(SchemaValidator.validate(schema, { value: 'text' })).toBeNull();
      const result = SchemaValidator.validate(schema, { value: 123 });
      expect(result).not.toBeNull();
    });

    it('handles toObjectSchema conversion for minItems and minLength as strings', () => {
      const schema: Schema = {
        type: 'OBJECT',
        properties: {
          list: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            minItems: '2' as any,
          },
          text: {
            type: 'STRING',
            minLength: '3' as any,
          }
        },
      } as Schema;

      // Valid data
      expect(SchemaValidator.validate(schema, { list: ['a', 'b'], text: 'abc' })).toBeNull();

      // Invalid data (minItems)
      const result1 = SchemaValidator.validate(schema, { list: ['a'], text: 'abc' });
      expect(result1).toContain('must NOT have fewer than 2 items');

      // Invalid data (minLength)
      const result2 = SchemaValidator.validate(schema, { list: ['a', 'b'], text: 'ab' });
      expect(result2).toContain('must NOT have fewer than 3 characters');
    });

    it('handles nested properties validation', () => {
      const schema: Schema = {
        type: 'OBJECT',
        properties: {
          user: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
            }
          }
        },
      } as Schema;

      expect(SchemaValidator.validate(schema, { user: { name: 'Bob' } })).toBeNull();

      const result = SchemaValidator.validate(schema, { user: { name: 123 } });
      expect(result).not.toBeNull();
    });

    it('handles anyOf property validation with an array of schemas', () => {
      const schema: Schema = {
        type: 'OBJECT',
        properties: {
          value: {
            anyOf: [
              { type: 'STRING' },
              { type: 'INTEGER' }
            ]
          }
        },
      } as Schema;

      expect(SchemaValidator.validate(schema, { value: 'text' })).toBeNull();
      expect(SchemaValidator.validate(schema, { value: 42 })).toBeNull();

      const result = SchemaValidator.validate(schema, { value: true });
      expect(result).not.toBeNull();
    });

    it('handles array validation with items', () => {
      const schema: Schema = {
        type: 'OBJECT',
        properties: {
          tags: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
      } as Schema;

      expect(SchemaValidator.validate(schema, { tags: ['a', 'b'] })).toBeNull();

      const result = SchemaValidator.validate(schema, { tags: [1, 2] });
      expect(result).not.toBeNull();
    });
  });
});
