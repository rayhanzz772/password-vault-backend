/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test'

// Set reasonable timeouts for Argon2 operations
jest.setTimeout(10000) // 10 seconds

// Suppress console output during tests (optional)
// Uncomment to reduce noise in test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Add custom matchers if needed
expect.extend({
  toBeValidHex(received) {
    const hexPattern = /^[0-9a-f]+$/i
    const pass = hexPattern.test(received)

    if (pass) {
      return {
        message: () => `expected ${received} not to be valid hex`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be valid hex`,
        pass: false
      }
    }
  }
})
