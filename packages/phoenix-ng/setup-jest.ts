import 'jest-preset-angular/setup-jest';
import './jest-global-mocks';

/* =========================================================
 * Angular 20 + Jest compatibility fixes
 * ========================================================= */

/**
 * Fix 1: Angular core `afterRender`
 */
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core');
  return {
    ...actual,
    afterRender: (fn: () => void) => fn(),
  };
});

/**
 * Fix 2: Disable CDK style injection (SharedStylesHost replacement)
 * Angular 20-safe
 */
jest.mock('@angular/platform-browser', () => {
  const actual = jest.requireActual('@angular/platform-browser');

  return {
    ...actual,
    SharedStylesHost: class {
      addStyles() {}
      addUsage() {}
      addElement() {}
      removeUsage() {}
    },
  };
});

/**
 * Fix 3: Disable CDK private style loader
 */
jest.mock('@angular/cdk/private', () => ({
  _CdkPrivateStyleLoader: class {
    load() {}
  },
}));

/**
 * Fix 4: Mock CDK Overlay globally
 */
jest.mock('@angular/cdk/overlay', () => ({
  Overlay: jest.fn().mockImplementation(() => ({
    create: jest.fn(() => ({
      attach: jest.fn(() => ({ instance: {} })),
      detach: jest.fn(),
      dispose: jest.fn(),
    })),
  })),
}));
