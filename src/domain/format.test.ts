import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatIsoDuration } from './format.ts';

describe('formatIsoDuration', () => {
  it('formats minutes and seconds', () => {
    assert.equal(formatIsoDuration('PT3M56S'), '3:56');
  });

  it('formats hours', () => {
    assert.equal(formatIsoDuration('PT1H2M3S'), '1:02:03');
  });

  it('returns unknown formats unchanged', () => {
    assert.equal(formatIsoDuration('not-a-duration'), 'not-a-duration');
  });
});
