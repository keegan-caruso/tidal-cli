export class TidalCliError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'TidalCliError';
    this.code = code;
  }
}

export class AuthConfigError extends TidalCliError {
  constructor(message: string) {
    super(message, 'AUTH_CONFIG_ERROR');
    this.name = 'AuthConfigError';
  }
}

export class ConfigError extends TidalCliError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class ValidationError extends TidalCliError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ApiError extends TidalCliError {
  readonly statusCode?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    details?: unknown,
    code = 'API_ERROR',
  ) {
    super(message, code);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Tidal API rate limit exceeded', details?: unknown) {
    super(message, 429, details, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends TidalCliError {
  constructor(message: string, cause?: unknown) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    if (cause instanceof Error) this.cause = cause;
  }
}

export class SearchError extends TidalCliError {
  constructor(message: string, cause?: unknown) {
    super(message, 'SEARCH_ERROR');
    this.name = 'SearchError';
    if (cause instanceof Error) this.cause = cause;
  }
}

export class NoOpenableResultError extends TidalCliError {
  constructor(message = 'No result has a URL to open') {
    super(message, 'NO_OPENABLE_RESULT');
    this.name = 'NoOpenableResultError';
  }
}

export class UserAuthRequiredError extends TidalCliError {
  constructor(
    message = 'User login required. Run "tidal login" to authenticate.',
  ) {
    super(message, 'USER_AUTH_REQUIRED');
    this.name = 'UserAuthRequiredError';
  }
}

export class DeviceLoginError extends TidalCliError {
  constructor(message: string, cause?: unknown) {
    super(message, 'DEVICE_LOGIN_ERROR');
    this.name = 'DeviceLoginError';
    if (cause instanceof Error) this.cause = cause;
  }
}
