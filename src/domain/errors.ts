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

export class ApiError extends TidalCliError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message, 'API_ERROR');
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class SearchError extends TidalCliError {
  constructor(message: string, cause?: unknown) {
    super(message, 'SEARCH_ERROR');
    this.name = 'SearchError';
    if (cause instanceof Error) this.cause = cause;
  }
}
