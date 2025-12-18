import 'jest-preset-angular/setup-jest';
import './jest-global-mocks';

/* =========================================================
 * Angular + CDK + Jest compatibility fixes
 * ========================================================= */

/**
 *  Fix: Angular CDK uses `afterRender`
 * Jest / older Angular core does not expose it
 */
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core');
  return {
    ...actual,
    afterRender: (fn: () => void): void => fn(),
  };
});

/**
 *  Fix: Disable CDK style injection
 * Prevents JSDOM crash on `@layer` CSS
 */
jest.mock('@angular/cdk/private', () => ({
  _CdkPrivateStyleLoader: class {
    load() {}
  },
}));

/**
 * ✅ Fix: Fully mock CDK Overlay
 * Applies globally (AppModule + phoenix-ui-components)
 */
jest.mock('@angular/cdk/overlay', () => {
  return {
    Overlay: jest.fn().mockImplementation(() => ({
      create: jest.fn(() => ({
        attach: jest.fn(() => ({
          instance: {},
        })),
        detach: jest.fn(),
        dispose: jest.fn(),
      })),
    })),
  };
});
