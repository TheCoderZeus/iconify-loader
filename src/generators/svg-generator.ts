import * as path from 'path';
import { promises as fs } from 'fs';
import {
  ProcessedSVG,
  IconifyLoaderOptions,
  GenerationResult,
  FileSystemError
} from '../types';

/**
 * SVG string generator for optimized SVG content
 */
export class SVGGenerator {
  /**
   * Generates optimized SVG files from processed SVGs
   */
  static async generateSVGs(
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

      // Generate individual SVG files
      for (const svg of svgs) {
        try {
          const svgFile = await this.generateSVGFile(svg, options);
          result.files.push(svgFile);

          if (options.verbose) {
            console.log(`Generated SVG file: ${svgFile}`);
          }
        } catch (error) {
          const errorMessage = `Failed to generate SVG for ${svg.metadata.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);

          if (options.verbose) {
            console.error(errorMessage);
          }
        }
      }

      // Generate index file if requested
      if (options.generateIndex) {
        try {
          const indexFile = await this.generateIndexFile(svgs, options);
          result.files.push(indexFile);

          if (options.verbose) {
            console.log(`Generated SVG index file: ${indexFile}`);
          }
        } catch (error) {
          const errorMessage = `Failed to generate SVG index file: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`SVG generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Generates a single SVG file
   */
  private static async generateSVGFile(
    svg: ProcessedSVG,
    options: IconifyLoaderOptions
  ): Promise<string> {
    const fileName = options.fileNameFormatter
      ? options.fileNameFormatter(svg.metadata.name)
      : `${svg.metadata.name}.svg`;

    const filePath = options.outputDir
      ? path.join(options.outputDir, fileName)
      : `./${fileName}`;

    // Prepare SVG content
    const content = this.prepareSVGContent(svg, options);

    await fs.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  /**
   * Generates an index file that exports SVG content as strings
   */
  private static async generateIndexFile(
    svgs: ProcessedSVG[],
    options: IconifyLoaderOptions
  ): Promise<string> {
    const exports: string[] = [];
    const types: string[] = [];

    for (const svg of svgs) {
      const variableName = this.getVariableName(svg.metadata.name, options);
      const content = this.prepareSVGContent(svg, options);

      // Escape quotes and newlines for JavaScript/TypeScript string
      const escapedContent = content
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');

      const exportStatement = `export const ${variableName} = '${escapedContent}';`;
      exports.push(exportStatement);

      if (options.typescript) {
        types.push(`  ${variableName}: string;`);
      }
    }

    let content = exports.join('\n\n');

    if (options.typescript && types.length > 0) {
      content += '\n\nexport interface SVGIcons {\n' + types.join('\n') + '\n}\n';
    }

    const indexPath = options.outputDir
      ? path.join(options.outputDir, `index.${options.typescript ? 'ts' : 'js'}`)
      : `./index.${options.typescript ? 'ts' : 'js'}`;

    await fs.writeFile(indexPath, content, 'utf-8');

    return indexPath;
  }

  /**
   * Prepares SVG content for output
   */
  private static prepareSVGContent(svg: ProcessedSVG, options: IconifyLoaderOptions): string {
    let content = svg.content;

    // Add custom attributes if specified
    if (options.svgProps) {
      content = this.addCustomAttributes(content, options.svgProps);
    }

    // Clean up content based on options
    if (options.svgoOptions?.removeComments !== false) {
      content = content.replace(/<!--[\s\S]*?-->/g, '');
    }

    if (options.svgoOptions?.removeMetadata !== false) {
      content = content.replace(/<metadata[^>]*>[\s\S]*?<\/metadata>/gi, '');
    }

    // Ensure proper formatting
    content = this.formatSVGContent(content);

    return content;
  }

  /**
   * Adds custom attributes to SVG element
   */
  private static addCustomAttributes(svgContent: string, customProps: Record<string, any>): string {
    // Find the opening SVG tag
    const svgTagMatch = svgContent.match(/<svg([^>]*?)>/i);

    if (!svgTagMatch) {
      return svgContent;
    }

    const [, existingAttributes] = svgTagMatch;
    let newAttributes = existingAttributes;

    // Add custom props as attributes
    for (const [key, value] of Object.entries(customProps)) {
      if (value !== undefined && value !== null) {
        const attributeValue = typeof value === 'string' ? value : String(value);
        newAttributes += ` ${key}="${attributeValue}"`;
      }
    }

    // Replace the original SVG tag with the new one
    return svgContent.replace(
      `<svg${existingAttributes}>`,
      `<svg${newAttributes}>`
    );
  }

  /**
   * Formats SVG content for consistency
   */
  private static formatSVGContent(content: string): string {
    let formatted = content;

    // Remove extra whitespace
    formatted = formatted.replace(/\s+/g, ' ');
    formatted = formatted.replace(/>\s+</g, '><');

    // Add proper line breaks for readability
    formatted = formatted.replace(/></g, '>\n<');

    // Clean up multiple line breaks
    formatted = formatted.replace(/\n\s*\n/g, '\n');

    return formatted.trim();
  }

  /**
   * Gets variable name for SVG content
   */
  private static getVariableName(originalName: string, options: IconifyLoaderOptions): string {
    if (options.fileNameFormatter) {
      return options.fileNameFormatter(originalName);
    }

    // Default naming strategy for variables
    return originalName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase()
      .replace(/^_+/, '')
      .replace(/_$/, '');
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
