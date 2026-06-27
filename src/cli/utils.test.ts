import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatCliError, parseLimitOption } from './utils.ts';
import { TidalCliError, ValidationError, ApiError } from '../domain/errors.ts';

describe('formatCliError', () => {
  it('formats TidalCliError with code and message', () => {
    const error = new TidalCliError('Something went wrong', 'TEST_ERROR');
    const result = formatCliError(error);
    assert.strictEqual(result, 'Error [TEST_ERROR]: Something went wrong');
  });

  it('formats ValidationError with its code', () => {
    const error = new ValidationError('Invalid input');
    const result = formatCliError(error);
    assert.strictEqual(result, 'Error [VALIDATION_ERROR]: Invalid input');
  });

  it('formats ApiError with its code', () => {
    const error = new ApiError('API failed', 500);
    const result = formatCliError(error);
    assert.strictEqual(result, 'Error [API_ERROR]: API failed');
  });

  it('formats regular Error with just message', () => {
    const error = new Error('Regular error');
    const result = formatCliError(error);
    assert.strictEqual(result, 'Error: Regular error');
  });

  it('formats string errors', () => {
    const result = formatCliError('string error');
    assert.strictEqual(result, 'Error: string error');
  });

  it('formats non-error objects', () => {
    const result = formatCliError({ foo: 'bar' });
    assert.strictEqual(result, 'Error: [object Object]');
  });

  it('formats null', () => {
    const result = formatCliError(null);
    assert.strictEqual(result, 'Error: null');
  });

  it('formats undefined', () => {
    const result = formatCliError(undefined);
    assert.strictEqual(result, 'Error: undefined');
  });
});

describe('parseLimitOption', () => {
  it('parses integer string', () => {
    assert.strictEqual(parseLimitOption('10'), 10);
  });

  it('parses zero', () => {
    assert.strictEqual(parseLimitOption('0'), 0);
  });

  it('returns NaN for non-numeric string', () => {
    assert.ok(Number.isNaN(parseLimitOption('abc')));
  });

  it('parses negative numbers', () => {
    assert.strictEqual(parseLimitOption('-5'), -5);
  });

  it('parses decimal strings', () => {
    assert.strictEqual(parseLimitOption('10.5'), 10.5);
  });
});
