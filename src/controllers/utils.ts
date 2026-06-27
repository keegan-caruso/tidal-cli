import { ValidationError, UserAuthRequiredError } from '../domain/errors.ts';
import { isUserLoggedIn } from '../services/auth.ts';

export function normalizeCountryCode(countryCode: string): string {
  const normalized = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new ValidationError('Country code must be a 2-letter ISO code');
  }
  return normalized;
}

export async function requireUserAuth(): Promise<void> {
  const loggedIn = await isUserLoggedIn();
  if (!loggedIn) {
    throw new UserAuthRequiredError();
  }
}
