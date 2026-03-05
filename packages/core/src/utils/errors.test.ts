import { describe, it, expect } from 'vitest';
import {
  toFriendlyError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
} from './errors';

describe('toFriendlyError', () => {
  it('should return the original error if it is not an object', () => {
    expect(toFriendlyError(null)).toBe(null);
    expect(toFriendlyError(undefined)).toBe(undefined);
    expect(toFriendlyError('string error')).toBe('string error');
    expect(toFriendlyError(123)).toBe(123);
  });

  it('should return the original error if it does not have a response property', () => {
    const error = { message: 'Some other error' };
    expect(toFriendlyError(error)).toBe(error);
  });

  it('should return the original error if response.data is undefined', () => {
    const error = { response: {} };
    expect(toFriendlyError(error)).toBe(error);
  });

  it('should return the original error if response.data.error is undefined', () => {
    const error = { response: { data: {} } };
    expect(toFriendlyError(error)).toBe(error);
  });

  it('should return the original error if response.data.error does not have a code', () => {
    const error = { response: { data: { error: { message: 'msg' } } } };
    expect(toFriendlyError(error)).toBe(error);
  });

  it('should return the original error if response.data.error does not have a message', () => {
    const error = { response: { data: { error: { code: 400 } } } };
    expect(toFriendlyError(error)).toBe(error);
  });

  it('should map 400 to BadRequestError', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 400,
            message: 'Bad request message',
          },
        },
      },
    };
    const result = toFriendlyError(error);
    expect(result).toBeInstanceOf(BadRequestError);
    expect((result as BadRequestError).message).toBe('Bad request message');
  });

  it('should map 401 to UnauthorizedError', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 401,
            message: 'Unauthorized message',
          },
        },
      },
    };
    const result = toFriendlyError(error);
    expect(result).toBeInstanceOf(UnauthorizedError);
    expect((result as UnauthorizedError).message).toBe('Unauthorized message');
  });

  it('should map 403 to ForbiddenError', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 403,
            message: 'Forbidden message',
          },
        },
      },
    };
    const result = toFriendlyError(error);
    expect(result).toBeInstanceOf(ForbiddenError);
    expect((result as ForbiddenError).message).toBe('Forbidden message');
  });

  it('should return the original error for unmapped status codes', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 500,
            message: 'Internal server error',
          },
        },
      },
    };
    expect(toFriendlyError(error)).toBe(error);
  });

  it('should handle stringified JSON response data', () => {
    const error = {
      response: {
        data: JSON.stringify({
          error: {
            code: 400,
            message: 'Parsed bad request',
          },
        }),
      },
    };
    const result = toFriendlyError(error);
    expect(result).toBeInstanceOf(BadRequestError);
    expect((result as BadRequestError).message).toBe('Parsed bad request');
  });
});
