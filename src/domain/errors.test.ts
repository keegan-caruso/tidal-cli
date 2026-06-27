import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TidalCliError,
  AuthConfigError,
  ConfigError,
  ValidationError,
  ApiError,
  RateLimitError,
  NetworkError,
  SearchError,
  NoOpenableResultError,
  UserAuthRequiredError,
  DeviceLoginError,
} from './errors.ts';

describe('TidalCliError', () => {
  it('sets message and code', () => {
    const error = new TidalCliError('test message', 'TEST_CODE');
    assert.strictEqual(error.message, 'test message');
    assert.strictEqual(error.code, 'TEST_CODE');
    assert.strictEqual(error.name, 'TidalCliError');
  });

  it('is instanceof Error', () => {
    const error = new TidalCliError('test', 'TEST');
    assert.ok(error instanceof Error);
  });
});

describe('AuthConfigError', () => {
  it('sets correct code and name', () => {
    const error = new AuthConfigError('missing config');
    assert.strictEqual(error.message, 'missing config');
    assert.strictEqual(error.code, 'AUTH_CONFIG_ERROR');
    assert.strictEqual(error.name, 'AuthConfigError');
  });

  it('is instanceof TidalCliError', () => {
    const error = new AuthConfigError('test');
    assert.ok(error instanceof TidalCliError);
  });
});

describe('ConfigError', () => {
  it('sets correct code and name', () => {
    const error = new ConfigError('bad config');
    assert.strictEqual(error.message, 'bad config');
    assert.strictEqual(error.code, 'CONFIG_ERROR');
    assert.strictEqual(error.name, 'ConfigError');
  });
});

describe('ValidationError', () => {
  it('sets correct code and name', () => {
    const error = new ValidationError('invalid input');
    assert.strictEqual(error.message, 'invalid input');
    assert.strictEqual(error.code, 'VALIDATION_ERROR');
    assert.strictEqual(error.name, 'ValidationError');
  });
});

describe('ApiError', () => {
  it('sets message, statusCode, and details', () => {
    const error = new ApiError('api failed', 500, { reason: 'server error' });
    assert.strictEqual(error.message, 'api failed');
    assert.strictEqual(error.code, 'API_ERROR');
    assert.strictEqual(error.name, 'ApiError');
    assert.strictEqual(error.statusCode, 500);
    assert.deepStrictEqual(error.details, { reason: 'server error' });
  });

  it('allows custom code', () => {
    const error = new ApiError('custom', 400, null, 'CUSTOM_API_ERROR');
    assert.strictEqual(error.code, 'CUSTOM_API_ERROR');
  });

  it('handles undefined statusCode and details', () => {
    const error = new ApiError('minimal');
    assert.strictEqual(error.statusCode, undefined);
    assert.strictEqual(error.details, undefined);
  });
});

describe('RateLimitError', () => {
  it('uses default message', () => {
    const error = new RateLimitError();
    assert.strictEqual(error.message, 'Tidal API rate limit exceeded');
    assert.strictEqual(error.code, 'RATE_LIMIT_ERROR');
    assert.strictEqual(error.name, 'RateLimitError');
    assert.strictEqual(error.statusCode, 429);
  });

  it('allows custom message and details', () => {
    const error = new RateLimitError('custom rate limit', { retryAfter: 60 });
    assert.strictEqual(error.message, 'custom rate limit');
    assert.deepStrictEqual(error.details, { retryAfter: 60 });
  });

  it('is instanceof ApiError', () => {
    const error = new RateLimitError();
    assert.ok(error instanceof ApiError);
  });
});

describe('NetworkError', () => {
  it('sets correct code and name', () => {
    const error = new NetworkError('connection failed');
    assert.strictEqual(error.message, 'connection failed');
    assert.strictEqual(error.code, 'NETWORK_ERROR');
    assert.strictEqual(error.name, 'NetworkError');
  });

  it('sets cause when provided as Error', () => {
    const cause = new Error('underlying error');
    const error = new NetworkError('network issue', cause);
    assert.strictEqual(error.cause, cause);
  });

  it('ignores non-Error cause', () => {
    const error = new NetworkError('network issue', 'string cause');
    assert.strictEqual(error.cause, undefined);
  });
});

describe('SearchError', () => {
  it('sets correct code and name', () => {
    const error = new SearchError('search failed');
    assert.strictEqual(error.message, 'search failed');
    assert.strictEqual(error.code, 'SEARCH_ERROR');
    assert.strictEqual(error.name, 'SearchError');
  });

  it('sets cause when provided as Error', () => {
    const cause = new Error('underlying error');
    const error = new SearchError('search issue', cause);
    assert.strictEqual(error.cause, cause);
  });

  it('ignores non-Error cause', () => {
    const error = new SearchError('search issue', { foo: 'bar' });
    assert.strictEqual(error.cause, undefined);
  });
});

describe('NoOpenableResultError', () => {
  it('uses default message', () => {
    const error = new NoOpenableResultError();
    assert.strictEqual(error.message, 'No result has a URL to open');
    assert.strictEqual(error.code, 'NO_OPENABLE_RESULT');
    assert.strictEqual(error.name, 'NoOpenableResultError');
  });

  it('allows custom message', () => {
    const error = new NoOpenableResultError('custom message');
    assert.strictEqual(error.message, 'custom message');
  });
});

describe('UserAuthRequiredError', () => {
  it('uses default message', () => {
    const error = new UserAuthRequiredError();
    assert.strictEqual(
      error.message,
      'User login required. Run "tidal login" to authenticate.',
    );
    assert.strictEqual(error.code, 'USER_AUTH_REQUIRED');
    assert.strictEqual(error.name, 'UserAuthRequiredError');
  });

  it('allows custom message', () => {
    const error = new UserAuthRequiredError('please log in');
    assert.strictEqual(error.message, 'please log in');
  });
});

describe('DeviceLoginError', () => {
  it('sets correct code and name', () => {
    const error = new DeviceLoginError('login failed');
    assert.strictEqual(error.message, 'login failed');
    assert.strictEqual(error.code, 'DEVICE_LOGIN_ERROR');
    assert.strictEqual(error.name, 'DeviceLoginError');
  });

  it('sets cause when provided as Error', () => {
    const cause = new Error('auth error');
    const error = new DeviceLoginError('device login issue', cause);
    assert.strictEqual(error.cause, cause);
  });

  it('ignores non-Error cause', () => {
    const error = new DeviceLoginError('device login issue', 123);
    assert.strictEqual(error.cause, undefined);
  });
});
