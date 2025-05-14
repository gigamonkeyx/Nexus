/**
 * Test Runner Script
 * 
 * This script runs all the tests for the Coding Agent implementation.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const testDir = path.join(__dirname);
const jestConfig = path.join(__dirname, '..', 'jest.config.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

/**
 * Runs tests in a specific directory.
 * @param {string} dir Directory to run tests in
 * @param {string} name Name of the test suite
 */
function runTests(dir, name) {
  console.log(`\n${colors.bright}${colors.fg.cyan}Running ${name} tests...${colors.reset}\n`);
  
  try {
    const command = `npx jest --config=${jestConfig} ${dir} --verbose`;
    execSync(command, { stdio: 'inherit' });
    console.log(`\n${colors.fg.green}✓ ${name} tests passed${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.fg.red}✗ ${name} tests failed${colors.reset}\n`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log(`\n${colors.bright}${colors.fg.magenta}=== Coding Agent Test Runner ===${colors.reset}\n`);
  
  // Check if Jest is installed
  try {
    execSync('npx jest --version', { stdio: 'ignore' });
  } catch (error) {
    console.error(`${colors.fg.red}Error: Jest is not installed. Please run 'npm install --save-dev jest @types/jest ts-jest' first.${colors.reset}`);
    process.exit(1);
  }
  
  // Check if TypeScript is installed
  try {
    execSync('npx tsc --version', { stdio: 'ignore' });
  } catch (error) {
    console.error(`${colors.fg.red}Error: TypeScript is not installed. Please run 'npm install --save-dev typescript' first.${colors.reset}`);
    process.exit(1);
  }
  
  // Create Jest config if it doesn't exist
  if (!fs.existsSync(jestConfig)) {
    console.log(`${colors.fg.yellow}Creating Jest config file...${colors.reset}`);
    
    const configContent = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ]
};`;
    
    fs.writeFileSync(jestConfig, configContent);
  }
  
  // Run tests
  let allPassed = true;
  
  // Run core tests
  allPassed = runTests(path.join(testDir, 'core'), 'Core') && allPassed;
  
  // Run adapter tests
  allPassed = runTests(path.join(testDir, 'adapters'), 'Adapters') && allPassed;
  
  // Run module tests
  allPassed = runTests(path.join(testDir, 'agents', 'modules'), 'Modules') && allPassed;
  
  // Run agent tests
  allPassed = runTests(path.join(testDir, 'agents'), 'Agents') && allPassed;
  
  // Print summary
  if (allPassed) {
    console.log(`\n${colors.bright}${colors.fg.green}All tests passed!${colors.reset}\n`);
  } else {
    console.error(`\n${colors.bright}${colors.fg.red}Some tests failed!${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the main function
main();
