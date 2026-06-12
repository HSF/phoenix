/** Fragment shader for hover outline color. */
export default `
uniform float opacity;
uniform float colorR;
uniform float colorG;
uniform float colorB;

void main() {
  gl_FragColor = vec4(colorR, colorG, colorB, opacity);
}
`;
