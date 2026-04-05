export class TidalCliError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'TidalCliError';
  }
}

export class AuthConfigError extends TidalCliError {
  constructor(message: string) {
    super(message, 'AUTH_CONFIG_ERROR');
    this.name = 'AuthConfigError';
  }
}

export class ApiError extends TidalCliError {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message, 'API_ERROR');
    this.name = 'ApiError';
  }
}

export class SearchError extends TidalCliError {
  constructor(message: string, cause?: unknown) {
    super(message, 'SEARCH_ERROR');
    this.name = 'SearchError';
    if (cause instanceof Error) this.cause = cause;
  }
}
