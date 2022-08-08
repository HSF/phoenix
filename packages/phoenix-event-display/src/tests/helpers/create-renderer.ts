/**
 * To make it easy to create objects of WebGLRenderer in unit tests
 */

import * as THREE from 'three';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Canvas = require('canvas');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const glContext = require('gl')(1, 1); //headless-gl

export default function createRenderer(
  options?: THREE.WebGLRendererParameters
) {
  const window = {
    innerWidth: 800,
    innerHeight: 600,
  };
  // GL scene renderer
  const canvasGL = new Canvas.Canvas(window.innerWidth, window.innerHeight);
  canvasGL.addEventListener = function (event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()

  const renderer = new THREE.WebGLRenderer({
    context: glContext,
    antialias: true,
    canvas: canvasGL,
  });

  global.renderer = renderer;
  return renderer;
}
