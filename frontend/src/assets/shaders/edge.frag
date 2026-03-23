#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D uMaskTexture;
uniform vec3 uOutlineColor;
uniform float uThickness;
uniform float uTexelWidth;
uniform float uTexelHeight;

out vec4 fragColor;

void main() {
  float mask = texture(uMaskTexture, vTexCoord).r;

  // Si el pixel actual ES parte de la pieza, no dibujar outline
  if (mask > 0.5) {
    discard;
  }

  // Buscar si algún vecino en el radio es parte de la pieza
  float maxNeighbor = 0.0;
  for (float x = -uThickness; x <= uThickness; x += 1.0) {
    for (float y = -uThickness; y <= uThickness; y += 1.0) {
      vec2 offset = vec2(x * uTexelWidth, y * uTexelHeight);
      maxNeighbor = max(maxNeighbor, texture(uMaskTexture, vTexCoord + offset).r);
    }
  }

  // Solo pintar si hay un vecino que sí es pieza (borde exterior)
  if (maxNeighbor > 0.5) {
    fragColor = vec4(uOutlineColor, 1.0);
  } else {
    discard;
  }
}