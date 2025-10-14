/**
 * @thecoderzeus/iconify-loader - TypeScript type definitions
 */

export type OutputFormat = 'svg' | 'react' | 'json';

export interface SVGMetadata {
  name: string;
  originalName: string;
  path: string;
  size: number;
  width?: number;
  height?: number;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}

export interface SVGOOptions {
  plugins?: Array<{
    name: string;
    params?: Record<string, any>;
  }>;
  multipass?: boolean;
  floatPrecision?: number;
  transformPrecision?: number;
  makePathsRelative?: boolean;
  convertShapeToPath?: boolean;
  mergePaths?: boolean;
  convertTransform?: boolean;
  removeOffCanvasPaths?: boolean;
  removeDimensions?: boolean;
  removeAttrs?: boolean;
  removeElementsByAttr?: boolean;
  addClassesToSVG?: boolean;
  addAttributesToSVGElement?: Record<string, any>;
  removeTitle?: boolean;
  removeDesc?: boolean;
  removeUselessStrokeAndFill?: boolean;
  removeUnusedNS?: boolean;
  cleanupListOfValues?: boolean;
  sortAttrs?: boolean;
  removeDoctype?: boolean;
  removeXMLProcInst?: boolean;
  removeComments?: boolean;
  removeMetadata?: boolean;
  removeEditorsNSData?: boolean;
  removeEmptyAttrs?: boolean;
  removeHiddenElems?: boolean;
  removeEmptyText?: boolean;
  removeEmptyContainers?: boolean;
  minifyStyles?: boolean;
  convertStyleToAttrs?: boolean;
  convertColors?: boolean;
  convertPathData?: boolean;
  convertEllipseToCircle?: boolean;
  convertUseToSymbol?: boolean;
  convertSymbolToPath?: boolean;
  convertPolygonToPath?: boolean;
  moveGroupAttrsToElems?: boolean;
  moveElemsAttrsToGroup?: boolean;
  collapseGroups?: boolean;
  convertGToUse?: boolean;
  reusePaths?: boolean;
}

export interface IconifyLoaderOptions {
  inputDir: string;
  outputDir?: string;
  format: OutputFormat;
  svgoOptions?: SVGOOptions;
  optimize?: boolean;
  generateIndex?: boolean;
  typescript?: boolean;
  reactComponentName?: (name: string) => string;
  svgProps?: Record<string, any>;
  fileNameFormatter?: (name: string) => string;
  includeSubdirs?: boolean;
  ignorePatterns?: string[];
  verbose?: boolean;
}

export interface ProcessedSVG {
  metadata: SVGMetadata;
  content: string;
  optimized?: boolean;
}

export interface GenerationResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
}

export interface ReactComponentTemplate {
  componentName: string;
  props: string[];
  svgContent: string;
  typescript: boolean;
}

export interface JSONOutput {
  icons: Record<string, SVGMetadata & { content?: string }>;
  metadata: {
    totalIcons: number;
    generatedAt: string;
    version: string;
    format?: OutputFormat;
    optimized?: boolean;
    options?: {
      inputDir?: string;
      outputDir?: string;
      svgoOptions?: SVGOOptions;
      svgProps?: Record<string, any>;
    };
    merged?: boolean;
    sources?: number;
  };
}

// Utility types
export type FileExtension = '.svg' | '.tsx' | '.ts' | '.json';

export interface FileInfo {
  path: string;
  name: string;
  extension: FileExtension;
  content?: string;
}

// Error types
export class IconifyLoaderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IconifyLoaderError';
  }
}

export class SVGProcessingError extends IconifyLoaderError {
  constructor(message: string, details?: any) {
    super(message, 'SVG_PROCESSING_ERROR', details);
    this.name = 'SVGProcessingError';
  }
}

export class FileSystemError extends IconifyLoaderError {
  constructor(message: string, details?: any) {
    super(message, 'FILESYSTEM_ERROR', details);
    this.name = 'FileSystemError';
  }
}

export class ValidationError extends IconifyLoaderError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
