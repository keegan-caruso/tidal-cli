/**
 * ESM loader hook: rewrites .js imports to .ts when running TypeScript source
 * directly via node --experimental-strip-types or --experimental-transform-types.
 *
 * This is only used at dev/test time; the compiled dist/ output uses real .js files.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.js')) {
    const tsSpecifier = specifier.slice(0, -3) + '.ts';
    // Resolve relative to the importer
    const base = context.parentURL ?? pathToFileURL(process.cwd() + '/').href;
    const resolved = new URL(tsSpecifier, base);
    if (existsSync(fileURLToPath(resolved))) {
      return nextResolve(tsSpecifier, context);
    }
  }
  return nextResolve(specifier, context);
}
