import * as path from 'path';
import { promises as fs } from 'fs';
import {
  ProcessedSVG,
  IconifyLoaderOptions,
  ReactComponentTemplate,
  GenerationResult,
  FileSystemError
} from '../types';

/**
 * React component generator for SVG icons
 */
export class ReactGenerator {
  private static defaultProps: Record<string, any> = {
    width: '1em',
    height: '1em',
    fill: 'currentColor',
    'aria-hidden': 'true'
  };

  /**
   * Generates React components from processed SVGs
   */
  static async generateComponents(
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

      // Generate individual component files
      for (const svg of svgs) {
        try {
          const componentFile = await this.generateComponentFile(svg, options);
          result.files.push(componentFile);

          if (options.verbose) {
            console.log(`Generated React component: ${componentFile}`);
          }
        } catch (error) {
          const errorMessage = `Failed to generate component for ${svg.metadata.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
            console.log(`Generated index file: ${indexFile}`);
          }
        } catch (error) {
          const errorMessage = `Failed to generate index file: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Generates a single React component file
   */
  private static async generateComponentFile(
    svg: ProcessedSVG,
    options: IconifyLoaderOptions
  ): Promise<string> {
    const componentName = this.getComponentName(svg.metadata.name, options);
    const template = this.createComponentTemplate(svg, componentName, options);

    const fileName = options.fileNameFormatter
      ? options.fileNameFormatter(componentName)
      : `${componentName}.${options.typescript ? 'tsx' : 'jsx'}`;

    const filePath = options.outputDir
      ? path.join(options.outputDir, fileName)
      : `./${fileName}`;

    const content = this.renderComponent(template);

    await fs.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  /**
   * Generates an index file that exports all components
   */
  private static async generateIndexFile(
    svgs: ProcessedSVG[],
    options: IconifyLoaderOptions
  ): Promise<string> {
    const exports: string[] = [];
    const types: string[] = [];

    for (const svg of svgs) {
      const componentName = this.getComponentName(svg.metadata.name, options);
      const importPath = `./${componentName}`;

      if (options.typescript) {
        exports.push(`export { default as ${componentName} } from '${importPath}';`);
        types.push(`  ${componentName}: typeof ${componentName};`);
      } else {
        exports.push(`export { default as ${componentName} } from '${importPath}';`);
      }
    }

    let content = exports.join('\n');

    if (options.typescript && types.length > 0) {
      content += '\n\nexport interface IconComponents {\n' + types.join('\n') + '\n}\n';
    }

    const indexPath = options.outputDir
      ? path.join(options.outputDir, `index.${options.typescript ? 'ts' : 'js'}`)
      : `./index.${options.typescript ? 'ts' : 'js'}`;

    await fs.writeFile(indexPath, content, 'utf-8');

    return indexPath;
  }

  /**
   * Creates a React component template
   */
  private static createComponentTemplate(
    svg: ProcessedSVG,
    componentName: string,
    options: IconifyLoaderOptions
  ): ReactComponentTemplate {
    const props = this.generateProps(svg, options);
    const svgContent = this.prepareSVGContent(svg);

    return {
      componentName,
      props,
      svgContent,
      typescript: options.typescript || false
    };
  }

  /**
   * Generates component props interface
   */
  private static generateProps(svg: ProcessedSVG, options: IconifyLoaderOptions): string[] {
    const props: string[] = [];

    // Merge default props with user-defined props
    const mergedProps = { ...this.defaultProps, ...options.svgProps };

    // Add SVG attributes from metadata
    if (svg.metadata['width']) mergedProps['width'] = svg.metadata['width'];
    if (svg.metadata['height']) mergedProps['height'] = svg.metadata['height'];
    if (svg.metadata['viewBox']) mergedProps['viewBox'] = svg.metadata['viewBox'];
    if (svg.metadata['fill']) mergedProps['fill'] = svg.metadata['fill'];
    if (svg.metadata['stroke']) mergedProps['stroke'] = svg.metadata['stroke'];
    if (svg.metadata['strokeWidth']) mergedProps['strokeWidth'] = svg.metadata['strokeWidth'];
    if (svg.metadata['className']) mergedProps['className'] = svg.metadata['className'];

    // Convert props to string array
    for (const [key, value] of Object.entries(mergedProps)) {
      if (typeof value === 'string') {
        props.push(`${key}="${value}"`);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        props.push(`${key}={${value}}`);
      } else {
        props.push(`${key}="${String(value)}"`);
      }
    }

    return props;
  }

  /**
   * Prepares SVG content for React component
   */
  private static prepareSVGContent(svg: ProcessedSVG): string {
    let content = svg.content;

    // Remove XML declaration if present
    content = content.replace(/<\?xml[^>]*\?>/g, '');

    // Remove DOCTYPE if present
    content = content.replace(/<!DOCTYPE[^>]*>/g, '');

    // Remove comments
    content = content.replace(/<!--[\s\S]*?-->/g, '');

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/>\s+</g, '><');

    // Ensure proper indentation for JSX
    const lines = content.split('\n');
    const indentedLines = lines.map((line, index) => {
      const trimmed = line.trim();
      if (index === 0) return trimmed;
      if (trimmed) return '      ' + trimmed;
      return '';
    });

    return indentedLines.join('\n');
  }

  /**
   * Renders the final React component
   */
  private static renderComponent(template: ReactComponentTemplate): string {
    const { componentName, svgContent, typescript } = template;



    if (typescript) {
      return `import React from 'react';

export interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const ${componentName}: React.FC<${componentName}Props> = ({
  size = '1em',
  fill = 'currentColor',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      fill={fill}
      viewBox="0 0 24 24"
      {...props}
    >
${svgContent}
    </svg>
  );
};

export default ${componentName};
`;
    } else {
      return `import React from 'react';

const ${componentName} = ({
  size = '1em',
  fill = 'currentColor',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      fill={fill}
      viewBox="0 0 24 24"
      {...props}
    >
${svgContent}
    </svg>
  );
};

export default ${componentName};
`;
    }
  }

  /**
   * Gets component name using formatter or default logic
   */
  private static getComponentName(originalName: string, options: IconifyLoaderOptions): string {
    if (options.reactComponentName) {
      return options.reactComponentName(originalName);
    }

    // Default naming strategy
    return originalName
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^(.)/, match => match.toUpperCase());
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
