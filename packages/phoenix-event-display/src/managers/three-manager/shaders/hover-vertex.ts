/** Vertex shader for hover outline rendering. */
const hoverVertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export default hoverVertexShader;
