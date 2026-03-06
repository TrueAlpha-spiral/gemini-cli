import { describe, expect, it } from 'vitest';
import { SchemaValidator } from './schemaValidator.js';
import { Schema, Type } from '@google/genai';

describe('SchemaValidator', () => {
  describe('validate', () => {
    it('returns null when schema is undefined', () => {
      const result = SchemaValidator.validate(undefined, { foo: 'bar' });
      expect(result).toBeNull();
    });

    it('returns error when data is not an object', () => {
      const schema: Schema = { type: Type.OBJECT };
      expect(SchemaValidator.validate(schema, null)).toBe('Value of params must be an object');
      expect(SchemaValidator.validate(schema, 123)).toBe('Value of params must be an object');
      expect(SchemaValidator.validate(schema, 'string')).toBe('Value of params must be an object');
      expect(SchemaValidator.validate(schema, true)).toBe('Value of params must be an object');
    });

    it('returns null when valid data matches the schema', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          foo: { type: Type.STRING },
        },
        required: ['foo'],
      };
      const result = SchemaValidator.validate(schema, { foo: 'bar' });
      expect(result).toBeNull();
    });

    it('returns error string when data is invalid according to schema', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          foo: { type: Type.STRING },
        },
        required: ['foo'],
      };
      const result = SchemaValidator.validate(schema, { foo: 123 });
      expect(result).toBe('params/foo must be string');

      const resultMissing = SchemaValidator.validate(schema, {});
      expect(resultMissing).toBe("params must have required property 'foo'");
    });

    it('converts @google/genai Type (Enum with UPPERCASE) to lowercase strings', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          str: { type: Type.STRING },
          num: { type: Type.NUMBER },
          int: { type: Type.INTEGER },
          bool: { type: Type.BOOLEAN },
          arr: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      };

      const validData = {
        str: 'hello',
        num: 1.5,
        int: 2,
        bool: true,
        arr: ['a', 'b'],
      };
      expect(SchemaValidator.validate(schema, validData)).toBeNull();

      const invalidData = { str: 123 };
      expect(SchemaValidator.validate(schema, invalidData)).toBe('params/str must be string');
    });

    it('converts minItems and minLength to numbers', () => {
      // Create schema using 'any' to simulate strings passed from @google/genai if they happen to be strings
      const schema = {
        type: Type.OBJECT,
        properties: {
          arr: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: '2' as any,
          },
          str: {
            type: Type.STRING,
            minLength: '3' as any,
          },
        },
      };

      const validData = {
        arr: ['a', 'b'],
        str: 'abc',
      };
      expect(SchemaValidator.validate(schema as Schema, validData)).toBeNull();

      const invalidData1 = { arr: ['a'] };
      expect(SchemaValidator.validate(schema as Schema, invalidData1)).toBe(
        'params/arr must NOT have fewer than 2 items'
      );

      const invalidData2 = { str: 'ab' };
      expect(SchemaValidator.validate(schema as Schema, invalidData2)).toBe(
        'params/str must NOT have fewer than 3 characters'
      );
    });

    it('handles recursive anyOf arrays', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          val: {
            anyOf: [
              { type: Type.STRING },
              { type: Type.NUMBER },
            ],
          },
        },
      };

      expect(SchemaValidator.validate(schema, { val: 'test' })).toBeNull();
      expect(SchemaValidator.validate(schema, { val: 123 })).toBeNull();
      expect(SchemaValidator.validate(schema, { val: true })).toContain('params/val must match a schema in anyOf');
    });

    it('handles recursive items definition', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          nestedArray: {
            type: Type.ARRAY,
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      };

      const validData = { nestedArray: [['a', 'b'], ['c']] };
      expect(SchemaValidator.validate(schema, validData)).toBeNull();

      const invalidData = { nestedArray: [['a', 123]] };
      expect(SchemaValidator.validate(schema, invalidData)).toBe('params/nestedArray/0/1 must be string');
    });
  });
});
