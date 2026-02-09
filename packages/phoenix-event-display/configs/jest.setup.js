/* eslint-disable no-undef */
/**
 * Jest setup file to add polyfills for Node.js test environment.
 * Required for libraries like jsroot that use TextEncoder/TextDecoder.
 */

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
