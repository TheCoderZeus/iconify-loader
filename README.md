# @thecoderzeus/iconify-loader

[![npm version](https://badge.fury.io/js/@thecoderzeus/iconify-loader.svg)](https://badge.fury.io/js/@thecoderzeus/iconify-loader)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful and flexible TypeScript library to load, optimize, and convert SVG files into React components, optimized SVG strings, or JSON metadata with SVGO optimization support.

## ✨ Features

- 🚀 **Multiple Output Formats**: Generate React components, SVG strings, or JSON metadata
- ⚡ **SVGO Optimization**: Built-in SVG optimization with customizable SVGO options
- 📁 **Recursive File Loading**: Process entire directories with subdirectory support
- 🎯 **TypeScript Support**: Full TypeScript definitions and type safety
- 🧩 **Modular Architecture**: Use individual components or the full pipeline
- 🎨 **Customizable**: Extensive configuration options for all use cases
- 📦 **Zero Dependencies**: Only SVGO as the main dependency
- 🔧 **CLI Ready**: Easy to integrate into build processes

## 📦 Installation

```bash
npm install @thecoderzeus/iconify-loader
```

## 🚀 Quick Start

### Basic Usage

```typescript
import IconifyLoader from '@thecoderzeus/iconify-loader';

async function main() {
  const result = await IconifyLoader.load({
    inputDir: './assets/icons',
    format: 'react',
    outputDir: './src/components/icons',
    optimize: true,
    typescript: true,
    generateIndex: true
  });

  if (result.success) {
    console.log(`Generated ${result.files.length} files successfully!`);
  } else {
    console.error('Generation failed:', result.errors);
  }
}

main().catch(console.error);
```

### Generate React Components

```typescript
import { IconifyLoader } from '@thecoderzeus/iconify-loader';

const result = await IconifyLoader.load({
  inputDir: './svg-icons',
  format: 'react',
  outputDir: './components',
  optimize: true,
  typescript: true,
  generateIndex: true,
  svgProps: {
    width: '1em',
    height: '1em',
    fill: 'currentColor'
  }
});
```

### Generate Optimized SVG Files

```typescript
import { IconifyLoader } from '@thecoderzeus/iconify-loader';

const result = await IconifyLoader.load({
  inputDir: './icons',
  format: 'svg',
  outputDir: './dist/icons',
  optimize: true,
  svgoOptions: {
    removeDimensions: true,
    removeViewBox: false,
    multipass: true
  }
});
```

### Generate JSON Metadata

```typescript
import { IconifyLoader } from '@thecoderzeus/iconify-loader';

const result = await IconifyLoader.load({
  inputDir: './assets/svg',
  format: 'json',
  outputDir: './data',
  verbose: true
});
```

## 📚 API Reference

### IconifyLoader

Main class for processing SVG files.

#### Constructor

```typescript
constructor(options: IconifyLoaderOptions)
```

#### Methods

##### `process(): Promise<GenerationResult>`

Processes SVG files and generates output based on configuration.

##### `static load(options: IconifyLoaderOptions): Promise<GenerationResult>`

Static method for quick processing without creating an instance.

##### `static getDefaultOptions(): Partial<IconifyLoaderOptions>`

Returns default configuration options.

##### `static mergeOptions(userOptions: IconifyLoaderOptions): IconifyLoaderOptions`

Merges user options with default options.

### IconifyLoaderOptions

Configuration interface for the loader.

```typescript
interface IconifyLoaderOptions {
  inputDir: string;                    // Required: Input directory path
  outputDir?: string;                  // Optional: Output directory path
  format: 'svg' | 'react' | 'json';    // Required: Output format
  svgoOptions?: SVGOOptions;           // Optional: SVGO configuration
  optimize?: boolean;                  // Optional: Enable optimization (default: true)
  generateIndex?: boolean;             // Optional: Generate index file (default: true)
  typescript?: boolean;                // Optional: Generate TypeScript (default: true)
  reactComponentName?: (name: string) => string; // Optional: Custom component naming
  svgProps?: Record<string, any>;      // Optional: Default SVG props
  fileNameFormatter?: (name: string) => string; // Optional: Custom file naming
  includeSubdirs?: boolean;            // Optional: Include subdirectories (default: true)
  ignorePatterns?: string[];           // Optional: Patterns to ignore
  verbose?: boolean;                   // Optional: Enable verbose logging (default: false)
}
```

### Output Formats

#### React Components

Generates TypeScript/JavaScript React components with proper TypeScript definitions.

**Features:**
- Automatic component naming (PascalCase)
- TypeScript interfaces for props
- Configurable SVG props
- Index file generation
- Forward refs support

#### SVG Files

Generates optimized SVG files with custom attributes and formatting.

**Features:**
- SVGO optimization
- Custom attribute injection
- Consistent formatting
- Index file with string exports

#### JSON Metadata

Generates comprehensive JSON metadata for each icon.

**Features:**
- Complete SVG metadata extraction
- File size and optimization stats
- Custom formatting options
- Individual icon files option

## 🔧 Advanced Usage

### Custom Component Naming

```typescript
import { IconifyLoader } from '@thecoderzeus/iconify-loader';

const result = await IconifyLoader.load({
  inputDir: './icons',
  format: 'react',
  reactComponentName: (name) => `Icon${name.replace(/[^a-zA-Z0-9]/g, '')}`,
  fileNameFormatter: (name) => `icon-${name.toLowerCase()}`
});
```

### Custom SVGO Configuration

```typescript
import { IconifyLoader } from '@thecoderzeus/iconify-loader';

const result = await IconifyLoader.load({
  inputDir: './svg',
  format: 'svg',
  optimize: true,
  svgoOptions: {
    multipass: true,
    floatPrecision: 2,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            removeDimensions: true,
            cleanupListOfValues: true
          }
        }
      }
    ]
  }
});
```

### Using Individual Modules

```typescript
import { FileReader, SVGOptimizer, ReactGenerator } from '@thecoderzeus/iconify-loader';

// Read SVG files
const files = await FileReader.readSVGFiles('./icons');

// Optimize SVGs
const optimizedContent = await SVGOptimizer.optimizeSVG(svgContent, {
  removeDimensions: true
});

// Generate React components
const result = await ReactGenerator.generateComponents(processedSVGs, options);
```

## 📁 Project Structure

```
src/
├── core/
│   └── iconify-loader.ts      # Main loader class
├── generators/
│   ├── react-generator.ts     # React component generation
│   ├── svg-generator.ts       # SVG file generation
│   └── json-generator.ts      # JSON metadata generation
├── utils/
│   ├── file-reader.ts         # File system utilities
│   └── svg-optimizer.ts       # SVGO optimization utilities
├── types/
│   └── index.ts              # TypeScript definitions
└── index.ts                  # Main entry point
```

## 🛠️ Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## 📄 License

MIT © [TheCoderZeus](https://github.com/thecoderzeus)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📮 Support

If you found this project helpful, please give it a ⭐️!

For support, email [livingprayer@gmail.com] or create an issue on GitHub.

