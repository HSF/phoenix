/** Vertex shader for hover outline rendering. */
export default `
uniform float opacity;
uniform float colorR;
uniform float colorG;
uniform float colorB;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
