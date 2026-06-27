import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeCountryCode } from './utils.ts';
import { ValidationError } from '../domain/errors.ts';

describe('normalizeCountryCode', () => {
  it('normalizes lowercase to uppercase', () => {
    assert.strictEqual(normalizeCountryCode('us'), 'US');
  });

  it('normalizes mixed case to uppercase', () => {
    assert.strictEqual(normalizeCountryCode('uS'), 'US');
  });

  it('preserves already uppercase codes', () => {
    assert.strictEqual(normalizeCountryCode('GB'), 'GB');
  });

  it('trims whitespace', () => {
    assert.strictEqual(normalizeCountryCode('  DE  '), 'DE');
  });

  it('throws ValidationError for single letter', () => {
    assert.throws(
      () => normalizeCountryCode('U'),
      (err) =>
        err instanceof ValidationError &&
        err.message === 'Country code must be a 2-letter ISO code',
    );
  });

  it('throws ValidationError for three letters', () => {
    assert.throws(
      () => normalizeCountryCode('USA'),
      (err) =>
        err instanceof ValidationError &&
        err.message === 'Country code must be a 2-letter ISO code',
    );
  });

  it('throws ValidationError for numeric input', () => {
    assert.throws(
      () => normalizeCountryCode('12'),
      (err) => err instanceof ValidationError,
    );
  });

  it('throws ValidationError for empty string', () => {
    assert.throws(
      () => normalizeCountryCode(''),
      (err) => err instanceof ValidationError,
    );
  });

  it('throws ValidationError for special characters', () => {
    assert.throws(
      () => normalizeCountryCode('U!'),
      (err) => err instanceof ValidationError,
    );
  });
});
