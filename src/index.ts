/**
 * @thecoderzeus/iconify-loader
 *
 * A TypeScript library to load and convert SVG files into React components,
 * optimized SVG strings, or JSON metadata with SVGO optimization support.
 */

// Main exports
export { IconifyLoader } from './core/iconify-loader';
export { FileReader } from './utils/file-reader';
export { SVGOptimizer } from './utils/svg-optimizer';
export { ReactGenerator } from './generators/react-generator';
export { SVGGenerator } from './generators/svg-generator';
export { JSONGenerator } from './generators/json-generator';

// Type exports
export type {
  OutputFormat,
  SVGMetadata,
  SVGOOptions,
  IconifyLoaderOptions,
  ProcessedSVG,
  GenerationResult,
  ReactComponentTemplate,
  JSONOutput,
  FileExtension,
  FileInfo
} from './types';

export {
  IconifyLoaderError,
  SVGProcessingError,
  FileSystemError,
  ValidationError
} from './types';

// Default export
export { default } from './core/iconify-loader';

// Version
export const VERSION = require('../package.json').version;
