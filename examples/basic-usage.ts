/**
 * @thecoderzeus/iconify-loader - Basic Usage Example
 *
 * This example demonstrates how to use the IconifyLoader to convert
 * SVG files into React components with optimization.
 */

import IconifyLoader from '../src';

async function basicExample() {
  console.log('🚀 Starting basic IconifyLoader example...');

  try {
    const result = await IconifyLoader.load({
      inputDir: './example-icons',
      format: 'react',
      outputDir: './generated-components',
      optimize: true,
      typescript: true,
      generateIndex: true,
      verbose: true,
      svgProps: {
        width: '1em',
        height: '1em',
        fill: 'currentColor',
        'aria-hidden': 'true'
      }
    });

    if (result.success) {
      console.log('✅ Generation completed successfully!');
      console.log(`📁 Generated ${result.files.length} files:`);
      result.files.forEach(file => console.log(`   - ${file}`));

      if (result.warnings.length > 0) {
        console.log(`⚠️  Warnings: ${result.warnings.length}`);
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    } else {
      console.error('❌ Generation failed:');
      result.errors.forEach(error => console.error(`   - ${error}`));
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Example with custom component naming
async function customNamingExample() {
  console.log('\n🎨 Starting custom naming example...');

  try {
    const result = await IconifyLoader.load({
      inputDir: './example-icons',
      format: 'react',
      outputDir: './custom-named-components',
      optimize: true,
      typescript: true,
      generateIndex: true,
      reactComponentName: (name) => `MyCustom${name.replace(/[^a-zA-Z0-9]/g, '')}`,
      fileNameFormatter: (name) => `my-${name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`,
      svgProps: {
        className: 'custom-icon'
      }
    });

    if (result.success) {
      console.log('✅ Custom naming generation completed!');
      console.log(`📁 Generated ${result.files.length} files`);
    }
  } catch (error) {
    console.error('💥 Custom naming example failed:', error);
  }
}

// Example generating SVG strings
async function svgStringExample() {
  console.log('\n📝 Starting SVG string generation example...');

  try {
    const result = await IconifyLoader.load({
      inputDir: './example-icons',
      format: 'svg',
      outputDir: './generated-svgs',
      optimize: true,
      generateIndex: true,
      typescript: true,
      verbose: true
    });

    if (result.success) {
      console.log('✅ SVG string generation completed!');
      console.log(`📁 Generated ${result.files.length} files`);
    }
  } catch (error) {
    console.error('💥 SVG string example failed:', error);
  }
}

// Example generating JSON metadata
async function jsonMetadataExample() {
  console.log('\n📋 Starting JSON metadata generation example...');

  try {
    const result = await IconifyLoader.load({
      inputDir: './example-icons',
      format: 'json',
      outputDir: './generated-metadata',
      optimize: true,
      generateIndex: true,
      verbose: true
    });

    if (result.success) {
      console.log('✅ JSON metadata generation completed!');
      console.log(`📁 Generated ${result.files.length} files`);
    }
  } catch (error) {
    console.error('💥 JSON metadata example failed:', error);
  }
}

// Run all examples
async function runAllExamples() {
  await basicExample();
  await customNamingExample();
  await svgStringExample();
  await jsonMetadataExample();

  console.log('\n🎉 All examples completed!');
}

// Export for use in other files
export {
  basicExample,
  customNamingExample,
  svgStringExample,
  jsonMetadataExample,
  runAllExamples
};

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
