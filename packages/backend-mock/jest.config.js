/** @type {import('jest').Config} */
module.exports = {
  // Extend root config
  ...require('../../jest.config.js'),
  // Override roots to only test this package
  roots: ['<rootDir>'],
  // Set display name
  displayName: 'backend-mock',
  // Fix setup files path
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
};
