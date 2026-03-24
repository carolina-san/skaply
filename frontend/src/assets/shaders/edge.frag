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
  float centerMask = texture(uMaskTexture, vTexCoord).r;

  float maxNeighbor = 0.0;
  float limit = ceil(uThickness);
  float radiusSq = uThickness * uThickness;

  for (float x = -limit; x <= limit; x += 1.0) {
    for (float y = -limit; y <= limit; y += 1.0) {
      if (x*x + y*y <= radiusSq) {
        vec2 offset = vec2(x * uTexelWidth, y * uTexelHeight);
        maxNeighbor = max(maxNeighbor, texture(uMaskTexture, vTexCoord + offset).r);
      }
    }
  }

  // Calculamos el borde externo restando el interior, preservando el antialiasing
  float alpha = clamp(maxNeighbor - centerMask, 0.0, 1.0);

  // Amplificamos ligeramente la opacidad del borde para que sea más visible pero sin bordes duros
  alpha = smoothstep(0.0, 0.8, alpha);

  if (alpha <= 0.0) {
    discard;
  }

  fragColor = vec4(uOutlineColor, alpha);
}