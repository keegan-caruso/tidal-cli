/**
 * Registers the custom ESM loader hook for .js → .ts remapping.
 * Used only at dev/test time when running TypeScript source directly.
 *
 * Usage: node --experimental-transform-types --import ./register.mjs ...
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./loader.mjs', pathToFileURL('./'));
