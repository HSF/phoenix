/**
 * Global Jest setup for Phoenix Angular tests.
 * Provides mocks and overrides for browser APIs.
 */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { getTestBed } from '@angular/core/testing';
import './jest-global-mocks';
import { EMPTY, of } from 'rxjs';

import * as ngCore from '@angular/core';
import * as platformBrowser from '@angular/platform-browser';
import * as cdkPrivate from '@angular/cdk/private';
import * as overlay from '@angular/cdk/overlay';

setupZoneTestEnv();

/* =========================================================
 * Angular 20 + Jest compatibility layer
 * ========================================================= */

/** Core testing utilities */
const core = ngCore as any;
if (!core.afterRender) {
  Object.defineProperty(core, 'afterRender', {
    value: (fn: () => void) => fn(),
    configurable: true,
  });
}

/** Public mock configuration */
const pb = platformBrowser as any;
if (pb.SharedStylesHost?.prototype) {
  const host = pb.SharedStylesHost.prototype;
  host.addStyles = () => {};
  host.addUsage = () => {};
  host.addElement = () => {};
  host.removeUsage = () => {};
}

/** Private mock configuration */
const priv = cdkPrivate as any;
if (priv._CdkPrivateStyleLoader?.prototype) {
  priv._CdkPrivateStyleLoader.prototype.load = () => {};
}

/** Override configuration */
const ov = overlay as any;
if (ov.Overlay?.prototype) {
  const proto = ov.Overlay.prototype;

  if (!proto.__patchedForJest) {
    Object.defineProperty(proto, '__patchedForJest', {
      value: true,
      configurable: false,
      enumerable: false,
    });

    proto.create = () => ({
      attach: () => ({
        instance: {
          _animationStateChanged: EMPTY,
          _startExitAnimation: () => EMPTY,

          attachComponentPortal: () => ({
            instance: {},
            destroy: () => {},
            changeDetectorRef: { detectChanges: () => {} },
          }),

          detachComponentPortal: () => {},
          _recaptureFocus: () => {},
          _trapFocus: () => {},
          _releaseFocus: () => {},
          _elementFocus: EMPTY,
          _ariaLabel: '',
          _backdropClick: EMPTY,
        },

        destroy: () => {},
        onDestroy: (fn: any) => {
          if (typeof fn === 'function') fn();
        },
      }),

      detach: () => {},
      dispose: () => {},
      destroy: () => {},
      addPanelClass: () => {},
      removePanelClass: () => {},

      backdropClick: () => EMPTY,
      keydownEvents: () => EMPTY,
      outsidePointerEvents: () => EMPTY,
      detachments: () => EMPTY,
      attachments: () => EMPTY,

      _outsidePointerEvents: EMPTY,
      _keydownEvents: EMPTY,
      _backdropClick: EMPTY,
      _animationStateChanged: EMPTY,
      _locationChanges: EMPTY,
      _positionStrategy: { positionChanges: EMPTY },
      _config: { positionStrategy: { positionChanges: EMPTY } },

      afterOpened: () => of(undefined),
      afterClosed: () => of(undefined),
      beforeClosed: () => of(undefined),

      id: 'jest-mock-overlay',
      updatePosition: () => {},
      updateSize: () => {},
      hasAttached: () => true,
      getConfig: () => ({}),

      overlayElement: document.createElement('div'),
      backdropElement: document.createElement('div'),
      hostElement: document.createElement('div'),
    });
  }
}

/* =========================================================
 * Stabilize Angular teardown
 * ========================================================= */

afterEach(() => {
  try {
    getTestBed()?.resetTestingModule();
  } catch {
    // Ignore teardown errors during Jest cleanup
  }
});

/* =========================================================
 * Silence noisy logs & prevent Jest leaks
 * ========================================================= */

/** Original console.error reference */
const originalError = console.error;
/** Original console.warn reference */
const originalWarn = console.warn;
/** Original console.log reference */
const originalLog = console.log;

console.error = (...args: any[]) => {
  const msg = args[0]?.toString() ?? '';
  if (
    msg.includes('NG0304') ||
    msg.includes('NG0303') ||
    msg.includes('is not a known element') ||
    msg.includes('Invalid file format')
  )
    return;
  originalError(...args);
};

console.warn = (...args: any[]) => {
  const msg = args[0]?.toString() ?? '';
  if (msg.includes('Three.js') || msg.includes('jsroot')) return;
  originalWarn(...args);
};

console.log = (...args: any[]) => {
  const msg = args[0]?.toString() ?? '';
  if (
    msg.includes('JiveXML') ||
    msg.includes('numPolyline') ||
    msg.includes('assigning the positions') ||
    msg.includes('Processing event data') ||
    msg.includes('extrapolate') ||
    msg.includes('TestNode')
  )
    return;

  try {
    originalLog(...args);
  } catch {
    // Swallow logging errors in Jest environment
  }
};
