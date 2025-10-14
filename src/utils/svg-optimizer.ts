import { optimize, Config } from 'svgo';
import { SVGOOptions, SVGProcessingError } from '../types';

/**
 * SVG optimization utilities using SVGO
 */
export class SVGOptimizer {
  private static defaultOptions: SVGOOptions = {
    multipass: true,
    floatPrecision: 2,
    transformPrecision: 5,
    makePathsRelative: true,
    convertShapeToPath: true,
    mergePaths: true,
    convertTransform: true,
    removeOffCanvasPaths: true,
    removeDimensions: false,
    removeAttrs: false,
    removeElementsByAttr: false,
    addClassesToSVG: false,
    removeTitle: true,
    removeDesc: true,
    removeUselessStrokeAndFill: true,
    removeUnusedNS: true,
    cleanupListOfValues: true,
    sortAttrs: true,
    removeDoctype: true,
    removeXMLProcInst: true,
    removeComments: true,
    removeMetadata: true,
    removeEditorsNSData: true,
    removeEmptyAttrs: true,
    removeHiddenElems: true,
    removeEmptyText: true,
    removeEmptyContainers: true,
    minifyStyles: true,
    convertStyleToAttrs: true,
    convertColors: true,
    convertPathData: true,
    convertEllipseToCircle: true,
    convertUseToSymbol: false,
    convertSymbolToPath: false,
    convertPolygonToPath: false,
    moveGroupAttrsToElems: true,
    moveElemsAttrsToGroup: true,
    collapseGroups: true,
    convertGToUse: false,
    reusePaths: false
  };

  /**
   * Optimizes SVG content using SVGO
   */
  static async optimizeSVG(
    svgContent: string,
    options: SVGOOptions = {},
    fileName?: string
  ): Promise<string> {
    try {
      const mergedOptions = this.mergeOptions(options);
      const svgoConfig: Config = {
        plugins: this.buildSVGOPlugins(mergedOptions),
        ...mergedOptions
      };

      const result = optimize(svgContent, svgoConfig);

      if ('error' in result && result.error) {
        throw new SVGProcessingError(
          `SVGO optimization failed: ${result.error}`,
          { fileName, originalError: result.error }
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof SVGProcessingError) {
        throw error;
      }

      throw new SVGProcessingError(
        `Unexpected error during SVG optimization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { fileName, originalError: error }
      );
    }
  }

  /**
   * Merges user options with default options
   */
  private static mergeOptions(userOptions: SVGOOptions): SVGOOptions {
    const result: SVGOOptions = {
      ...this.defaultOptions,
      ...userOptions
    };

    // Handle plugins separately to avoid type issues
    if (userOptions.plugins && Array.isArray(userOptions.plugins)) {
      result.plugins = userOptions.plugins;
    } else if (!result.plugins) {
      result.plugins = [];
    }

    return result;
  }

  /**
   * Builds SVGO plugins configuration
   */
  private static buildSVGOPlugins(options: SVGOOptions) {
    const plugins: any[] = [];

    // Default plugins that are always enabled
    const defaultPlugins = [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            removeDimensions: options.removeDimensions || false,
            removeAttrs: options.removeAttrs || false,
            removeElementsByAttr: options.removeElementsByAttr || false,
            addClassesToSVG: options.addClassesToSVG || false,
            removeTitle: options.removeTitle !== false,
            removeDesc: options.removeDesc !== false,
            removeUselessStrokeAndFill: options.removeUselessStrokeAndFill !== false,
            removeUnusedNS: options.removeUnusedNS !== false,
            cleanupListOfValues: options.cleanupListOfValues !== false,
            sortAttrs: options.sortAttrs !== false,
            removeDoctype: options.removeDoctype !== false,
            removeXMLProcInst: options.removeXMLProcInst !== false,
            removeComments: options.removeComments !== false,
            removeMetadata: options.removeMetadata !== false,
            removeEditorsNSData: options.removeEditorsNSData !== false,
            removeEmptyAttrs: options.removeEmptyAttrs !== false,
            removeHiddenElems: options.removeHiddenElems !== false,
            removeEmptyText: options.removeEmptyText !== false,
            removeEmptyContainers: options.removeEmptyContainers !== false,
            minifyStyles: options.minifyStyles !== false,
            convertStyleToAttrs: options.convertStyleToAttrs !== false,
            convertColors: options.convertColors !== false,
            convertPathData: options.convertPathData !== false,
            convertEllipseToCircle: options.convertEllipseToCircle !== false,
            convertUseToSymbol: options.convertUseToSymbol || false,
            convertSymbolToPath: options.convertSymbolToPath || false,
            convertPolygonToPath: options.convertPolygonToPath || false,
            moveGroupAttrsToElems: options.moveGroupAttrsToElems !== false,
            moveElemsAttrsToGroup: options.moveElemsAttrsToGroup !== false,
            collapseGroups: options.collapseGroups !== false,
            convertGToUse: options.convertGToUse || false,
            reusePaths: options.reusePaths || false
          }
        }
      }
    ];

    plugins.push(...defaultPlugins);

    // Add custom plugins if provided
    if (options.plugins) {
      plugins.push(...options.plugins);
    }

    return plugins;
  }

  /**
   * Validates SVGO options
   */
  static validateOptions(options: SVGOOptions): void {
    if (options.floatPrecision !== undefined && (options.floatPrecision < 0 || options.floatPrecision > 10)) {
      throw new SVGProcessingError(
        'floatPrecision must be between 0 and 10',
        { floatPrecision: options.floatPrecision }
      );
    }

    if (options.transformPrecision !== undefined && (options.transformPrecision < 0 || options.transformPrecision > 10)) {
      throw new SVGProcessingError(
        'transformPrecision must be between 0 and 10',
        { transformPrecision: options.transformPrecision }
      );
    }
  }

  /**
   * Gets optimization statistics
   */
  static getOptimizationStats(originalContent: string, optimizedContent: string): {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    bytesSaved: number;
  } {
    const originalSize = Buffer.byteLength(originalContent, 'utf8');
    const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
    const bytesSaved = originalSize - optimizedSize;
    const compressionRatio = originalSize > 0 ? bytesSaved / originalSize : 0;

    return {
      originalSize,
      optimizedSize,
      compressionRatio,
      bytesSaved
    };
  }
}
