import * as path from 'path';
import { promises as fs } from 'fs';
import {
  ProcessedSVG,
  IconifyLoaderOptions,
  JSONOutput,
  GenerationResult,
  FileSystemError
} from '../types';

/**
 * JSON metadata generator for SVG icons
 */
export class JSONGenerator {
  /**
   * Generates JSON metadata from processed SVGs
   */
  static async generateJSON(
    svgs: ProcessedSVG[],
    options: IconifyLoaderOptions
  ): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: true,
      files: [],
      errors: [],
      warnings: []
    };

    try {
      // Ensure output directory exists
      if (options.outputDir) {
        await this.ensureOutputDirectory(options.outputDir);
      }

      // Generate main JSON file
      try {
        const jsonFile = await this.generateJSONFile(svgs, options);
        result.files.push(jsonFile);

        if (options.verbose) {
          console.log(`Generated JSON file: ${jsonFile}`);
        }
      } catch (error) {
        const errorMessage = `Failed to generate JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);

        if (options.verbose) {
          console.error(errorMessage);
        }
      }

      // Generate individual JSON files if requested
      if (options.generateIndex) {
        try {
          const individualFiles = await this.generateIndividualJSONFiles(svgs, options);
          result.files.push(...individualFiles);

          if (options.verbose) {
            console.log(`Generated ${individualFiles.length} individual JSON files`);
          }
        } catch (error) {
          const errorMessage = `Failed to generate individual JSON files: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`JSON generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Generates the main JSON file with all icons metadata
   */
  private static async generateJSONFile(
    svgs: ProcessedSVG[],
    options: IconifyLoaderOptions
  ): Promise<string> {
    const jsonOutput = this.createJSONOutput(svgs, options);

    const fileName = options.fileNameFormatter
      ? `${options.fileNameFormatter('icons')}.json`
      : 'icons.json';

    const filePath = options.outputDir
      ? path.join(options.outputDir, fileName)
      : `./${fileName}`;

    const content = JSON.stringify(jsonOutput, null, options.verbose ? 2 : 0);

    await fs.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  /**
   * Generates individual JSON files for each icon
   */
  private static async generateIndividualJSONFiles(
    svgs: ProcessedSVG[],
    options: IconifyLoaderOptions
  ): Promise<string[]> {
    const files: string[] = [];

    for (const svg of svgs) {
      try {
        const fileName = options.fileNameFormatter
          ? `${options.fileNameFormatter(svg.metadata.name)}.json`
          : `${svg.metadata.name}.json`;

        const filePath = options.outputDir
          ? path.join(options.outputDir, fileName)
          : `./${fileName}`;

        const individualOutput = this.createIndividualJSONOutput(svg);
        const content = JSON.stringify(individualOutput, null, options.verbose ? 2 : 0);

        await fs.writeFile(filePath, content, 'utf-8');
        files.push(filePath);
      } catch (error) {
        throw new FileSystemError(
          `Failed to generate individual JSON file for ${svg.metadata.name}`,
          { originalError: error, iconName: svg.metadata.name }
        );
      }
    }

    return files;
  }

  /**
   * Creates the main JSON output structure
   */
  private static createJSONOutput(svgs: ProcessedSVG[], options: IconifyLoaderOptions): JSONOutput {
    const icons: Record<string, any> = {};

    for (const svg of svgs) {
      const key = options.fileNameFormatter
        ? options.fileNameFormatter(svg.metadata.name)
        : svg.metadata.name;

      icons[key] = {
        name: svg.metadata.name,
        originalName: svg.metadata.originalName,
        path: svg.metadata.path,
        size: svg.metadata.size,
        width: svg.metadata.width,
        height: svg.metadata.height,
        viewBox: svg.metadata.viewBox,
        fill: svg.metadata.fill,
        stroke: svg.metadata.stroke,
        strokeWidth: svg.metadata.strokeWidth,
        className: svg.metadata.className,
        // Include SVG content if requested
        ...(options.verbose && { content: svg.content })
      };
    }

    return {
      icons,
      metadata: {
        totalIcons: svgs.length,
        generatedAt: new Date().toISOString(),
        version: require('../../package.json').version,
        format: options.format,
        optimized: options.optimize || false,
        options: options.verbose ? ({} as any) : undefined
      }
    };
  }

  /**
   * Creates individual JSON output for a single icon
   */
  private static createIndividualJSONOutput(svg: ProcessedSVG) {
    return {
      name: svg.metadata.name,
      originalName: svg.metadata.originalName,
      path: svg.metadata.path,
      size: svg.metadata.size,
      width: svg.metadata.width,
      height: svg.metadata.height,
      viewBox: svg.metadata.viewBox,
      fill: svg.metadata.fill,
      stroke: svg.metadata.stroke,
      strokeWidth: svg.metadata.strokeWidth,
      className: svg.metadata.className,
      content: svg.content,
      optimized: svg.optimized || false,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: require('../../package.json').version
      }
    };
  }

  /**
   * Validates JSON structure
   */
  static validateJSONOutput(jsonOutput: JSONOutput): boolean {
    if (!jsonOutput.icons || typeof jsonOutput.icons !== 'object') {
      return false;
    }

    if (!jsonOutput.metadata || typeof jsonOutput.metadata !== 'object') {
      return false;
    }

    if (typeof jsonOutput.metadata.totalIcons !== 'number') {
      return false;
    }

    if (!jsonOutput.metadata.generatedAt || typeof jsonOutput.metadata.generatedAt !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Merges multiple JSON outputs
   */
  static mergeJSONOutputs(outputs: JSONOutput[]): JSONOutput {
    const mergedIcons: Record<string, any> = {};
    const totalIcons = outputs.reduce((sum, output) => sum + output.metadata.totalIcons, 0);

    for (const output of outputs) {
      Object.assign(mergedIcons, output.icons);
    }

    return {
      icons: mergedIcons,
      metadata: {
        totalIcons,
        generatedAt: new Date().toISOString(),
        version: require('../../package.json').version,
        merged: true,
        sources: outputs.length
      }
    };
  }

  /**
   * Ensures output directory exists
   */
  private static async ensureOutputDirectory(outputDir: string): Promise<void> {
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      throw new FileSystemError(
        `Failed to create output directory: ${outputDir}`,
        { originalError: error }
      );
    }
  }
}
