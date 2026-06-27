export function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err != null &&
    'code' in err &&
    err.code === 'ENOENT'
  );
}
