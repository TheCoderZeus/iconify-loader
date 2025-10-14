import { promises as fs } from 'fs';
import * as path from 'path';
import {
  FileInfo,
  FileExtension,
  FileSystemError,
  ValidationError,
  SVGProcessingError
} from '../types';

/**
 * File reader utilities for SVG processing
 */
export class FileReader {
  private static readonly SVG_EXTENSIONS: FileExtension[] = ['.svg'];

  /**
   * Recursively reads SVG files from a directory
   */
  static async readSVGFiles(
    inputDir: string,
    includeSubdirs: boolean = true,
    ignorePatterns: string[] = []
  ): Promise<FileInfo[]> {
    try {
      const files: FileInfo[] = [];
      await this.readDirectoryRecursive(inputDir, files, includeSubdirs, ignorePatterns);
      return files.filter(file => this.SVG_EXTENSIONS.includes(file.extension as FileExtension));
    } catch (error) {
      throw new FileSystemError(
        `Failed to read SVG files from directory: ${inputDir}`,
        { originalError: error, inputDir }
      );
    }
  }

  /**
   * Recursively reads all files in a directory
   */
  private static async readDirectoryRecursive(
    dirPath: string,
    files: FileInfo[],
    includeSubdirs: boolean,
    ignorePatterns: string[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Check if path matches ignore patterns
        if (this.shouldIgnorePath(fullPath, ignorePatterns)) {
          continue;
        }

        if (entry.isDirectory() && includeSubdirs) {
          await this.readDirectoryRecursive(fullPath, files, includeSubdirs, ignorePatterns);
        } else if (entry.isFile()) {
          const fileInfo = await this.getFileInfo(fullPath);
          if (fileInfo) {
            files.push(fileInfo);
          }
        }
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to read directory: ${dirPath}`,
        { originalError: error, dirPath }
      );
    }
  }

  /**
   * Gets file information for a given path
   */
  private static async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const extension = path.extname(filePath).toLowerCase() as FileExtension;
      const name = path.basename(filePath, extension);
      await fs.stat(filePath);

      return {
        path: filePath,
        name,
        extension,
        content: await fs.readFile(filePath, 'utf-8')
      };
    } catch (error) {
      throw new FileSystemError(
        `Failed to get file info: ${filePath}`,
        { originalError: error, filePath }
      );
    }
  }

  /**
   * Checks if a path should be ignored based on patterns
   */
  private static shouldIgnorePath(filePath: string, ignorePatterns: string[]): boolean {
    return ignorePatterns.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(filePath);
    });
  }

  /**
   * Validates if a file is a valid SVG
   */
  static validateSVGContent(content: string, fileName: string): void {
    if (!content || typeof content !== 'string') {
      throw new ValidationError(
        `Invalid SVG content in file: ${fileName}`,
        { fileName, contentLength: content?.length || 0 }
      );
    }

    const trimmedContent = content.trim();

    if (!trimmedContent.startsWith('<svg') && !trimmedContent.includes('<svg')) {
      throw new SVGProcessingError(
        `File does not appear to be a valid SVG: ${fileName}`,
        { fileName, contentPreview: trimmedContent.substring(0, 100) }
      );
    }

    // Basic XML validation
    if (!trimmedContent.includes('</svg>') && !trimmedContent.endsWith('/>')) {
      throw new SVGProcessingError(
        `SVG file appears to be malformed: ${fileName}`,
        { fileName, contentPreview: trimmedContent.substring(0, 100) }
      );
    }
  }

  /**
   * Extracts basic metadata from SVG content
   */
  static extractSVGAttributes(content: string): Record<string, string | undefined> {
    const attributes: Record<string, string | undefined> = {};

    // Extract viewBox
    const viewBoxMatch = content.match(/viewBox\s*=\s*["']([^"']+)["']/i);
    if (viewBoxMatch) {
      attributes['viewBox'] = viewBoxMatch[1];
    }

    // Extract width
    const widthMatch = content.match(/width\s*=\s*["']([^"']+)["']/i);
    if (widthMatch) {
      attributes['width'] = widthMatch[1];
    }

    // Extract height
    const heightMatch = content.match(/height\s*=\s*["']([^"']+)["']/i);
    if (heightMatch) {
      attributes['height'] = heightMatch[1];
    }

    // Extract fill
    const fillMatch = content.match(/fill\s*=\s*["']([^"']+)["']/i);
    if (fillMatch) {
      attributes['fill'] = fillMatch[1];
    }

    // Extract stroke
    const strokeMatch = content.match(/stroke\s*=\s*["']([^"']+)["']/i);
    if (strokeMatch) {
      attributes['stroke'] = strokeMatch[1];
    }

    return attributes;
  }

  /**
   * Checks if a directory exists
   */
  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Creates a directory if it doesn't exist
   */
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new FileSystemError(
        `Failed to create directory: ${dirPath}`,
        { originalError: error, dirPath }
      );
    }
  }
}
