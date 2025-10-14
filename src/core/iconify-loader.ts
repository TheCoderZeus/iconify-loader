
import {
  IconifyLoaderOptions,
  ProcessedSVG,
  GenerationResult,
  ValidationError,
  FileSystemError,
  SVGProcessingError
} from '../types';
import { FileReader } from '../utils/file-reader';
import { SVGOptimizer } from '../utils/svg-optimizer';
import { ReactGenerator } from '../generators/react-generator';
import { SVGGenerator } from '../generators/svg-generator';
import { JSONGenerator } from '../generators/json-generator';

/**
 * Main IconifyLoader class for processing SVG files
 */
export class IconifyLoader {
  private options: IconifyLoaderOptions;

  constructor(options: IconifyLoaderOptions) {
    this.validateOptions(options);
    this.options = options;
  }

  /**
   * Main method to process SVG files and generate output
   */
  async process(): Promise<GenerationResult> {
    try {
      if (this.options.verbose) {
        console.log(`Starting IconifyLoader process...`);
        console.log(`Input directory: ${this.options.inputDir}`);
        console.log(`Output format: ${this.options.format}`);
        console.log(`Optimization: ${this.options.optimize ? 'enabled' : 'disabled'}`);
      }

      // Step 1: Read SVG files
      const svgFiles = await this.readSVGs();

      if (this.options.verbose) {
        console.log(`Found ${svgFiles.length} SVG files`);
      }

      // Step 2: Process and optimize SVGs
      const processedSVGs = await this.processSVGs(svgFiles);

      // Step 3: Generate output based on format
      const result = await this.generateOutput(processedSVGs);

      if (this.options.verbose) {
        console.log(`Process completed successfully!`);
        console.log(`Generated ${result.files.length} files`);
        if (result.errors.length > 0) {
          console.warn(`Errors: ${result.errors.length}`);
        }
        if (result.warnings.length > 0) {
          console.warn(`Warnings: ${result.warnings.length}`);
        }
      }

      return result;
    } catch (error) {
      throw new SVGProcessingError(
        `IconifyLoader process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Reads SVG files from input directory
   */
  private async readSVGs() {
    try {
      const files = await FileReader.readSVGFiles(
        this.options.inputDir,
        this.options.includeSubdirs,
        this.options.ignorePatterns
      );

      if (files.length === 0) {
        throw new ValidationError(
          `No SVG files found in directory: ${this.options.inputDir}`,
          { inputDir: this.options.inputDir }
        );
      }

      return files;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new FileSystemError(
        `Failed to read SVG files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error, inputDir: this.options.inputDir }
      );
    }
  }

  /**
   * Processes and optimizes SVG files
   */
  private async processSVGs(files: any[]): Promise<ProcessedSVG[]> {
    const processedSVGs: ProcessedSVG[] = [];

    for (const file of files) {
      try {
        // Validate SVG content
        FileReader.validateSVGContent(file.content, file.name);

        // Extract metadata
        const attributes = FileReader.extractSVGAttributes(file.content);
        const metadata = {
          name: file.name,
          originalName: file.name,
          path: file.path,
          size: Buffer.byteLength(file.content, 'utf8'),
          ...attributes
        };

        let content = file.content;
        let optimized = false;

        // Optimize if requested
        if (this.options.optimize) {
          try {
            content = await SVGOptimizer.optimizeSVG(
              content,
              this.options.svgoOptions,
              file.name
            );
            optimized = true;

            if (this.options.verbose) {
              const stats = SVGOptimizer.getOptimizationStats(file.content, content);
              console.log(`Optimized ${file.name}: ${stats.bytesSaved} bytes saved (${stats.compressionRatio * 100}%)`);
            }
          } catch (error) {
            if (this.options.verbose) {
              console.warn(`Failed to optimize ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        processedSVGs.push({
          metadata,
          content,
          optimized
        });
      } catch (error) {
        if (this.options.verbose) {
          console.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        throw error;
      }
    }

    return processedSVGs;
  }

  /**
   * Generates output based on specified format
   */
  private async generateOutput(svgs: ProcessedSVG[]): Promise<GenerationResult> {
    switch (this.options.format) {
      case 'react':
        return await ReactGenerator.generateComponents(svgs, this.options);

      case 'svg':
        return await SVGGenerator.generateSVGs(svgs, this.options);

      case 'json':
        return await JSONGenerator.generateJSON(svgs, this.options);

      default:
        throw new ValidationError(
          `Unsupported output format: ${this.options.format}`,
          { format: this.options.format }
        );
    }
  }

  /**
   * Validates the provided options
   */
  private validateOptions(options: IconifyLoaderOptions): void {
    if (!options.inputDir) {
      throw new ValidationError('Input directory is required');
    }

    if (!options.format) {
      throw new ValidationError('Output format is required');
    }

    const validFormats = ['svg', 'react', 'json'];
    if (!validFormats.includes(options.format)) {
      throw new ValidationError(
        `Invalid format. Must be one of: ${validFormats.join(', ')}`,
        { format: options.format, validFormats }
      );
    }

    // Validate SVGO options if provided
    if (options.svgoOptions) {
      SVGOptimizer.validateOptions(options.svgoOptions);
    }
  }

  /**
   * Static method for quick processing without creating an instance
   */
  static async load(options: IconifyLoaderOptions): Promise<GenerationResult> {
    const loader = new IconifyLoader(options);
    return await loader.process();
  }

  /**
   * Gets default options with sensible defaults
   */
  static getDefaultOptions(): Partial<IconifyLoaderOptions> {
    return {
      optimize: true,
      generateIndex: true,
      typescript: true,
      includeSubdirs: true,
      ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
      verbose: false
    };
  }

  /**
   * Merges user options with defaults
   */
  static mergeOptions(userOptions: IconifyLoaderOptions): IconifyLoaderOptions {
    const defaults = IconifyLoader.getDefaultOptions();
    return {
      ...defaults,
      ...userOptions
    };
  }
}

export default IconifyLoader;
