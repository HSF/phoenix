/** Vertex shader for hover outline rendering. */
const hoverVertexShader = `
uniform float opacity;
uniform float colorR;
uniform float colorG;
uniform float colorB;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export default hoverVertexShader;
