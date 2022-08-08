/**
 * To make it easy to create objects of WebGLRenderer in unit tests
 */
import createContext from 'gl';

import * as THREE from 'three';
import { createCanvas } from 'canvas';

export default function createRenderer(
  options?: THREE.WebGLRendererParameters
) {
  const window = {
    innerWidth: 800,
    innerHeight: 600,
  };
  const context = createContext(1, 1);
  const canvas: HTMLCanvasElement = createCanvas(
    window.innerWidth,
    window.innerHeight
  ) as any;

  // Mock function to avoid errors inside THREE.WebGlRenderer():
  canvas.addEventListener = function () {};

  return new THREE.WebGLRenderer({
    canvas,
    context,
    ...options,
  });
}
