import { jest } from '@jest/globals';
import { TextDecoder } from 'util';

Object.defineProperty(window, 'CSS', { value: null });

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>',
});

Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance'],
    };
  },
});

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (_prop) => {
      return '';
    },
  }),
});

/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

HTMLCanvasElement.prototype.getContext = <
  typeof HTMLCanvasElement.prototype.getContext
>jest.fn();

// For being able to mock FileList in `packages/phoenix-ng/projects/phoenix-ui-components/lib/components/ui-menu\io-options\io-options-dialog/io-options-dialog.component.test.ts:10`.
globalThis.TextDecoder = TextDecoder;
