#version 300 es
precision highp float;
in vec2 vTexCoord;
uniform sampler2D uMaskTex;
uniform vec2 uResolution;
uniform vec3 uHighlightColor;

out vec4 fragColor;

void main() {
    float centerAlpha = texture(uMaskTex, vTexCoord).a;
    
    // Si estamos dentro del objeto original de la máscara (la geometría opaca), no dibujamos el delineado.
    // Esto oculta las imperfecciones de las caras (respetando "no las caras").
    if (centerAlpha > 0.5) {
        discard;
    }

    vec2 texel = 1.0 / uResolution;
    float glow = 0.0;
    
    float radius = 8.0; // Simula edgeThickness (grosor visual del delineado)
    float sigma = 3.0;  // Radio armónico de emborronamiento (tubo cilíndrico)
    float weightSum = 0.0;
    
    for(float x = -radius; x <= radius; x += 1.0) {
        for(float y = -radius; y <= radius; y += 1.0) {
            float dist = sqrt(x*x + y*y);
            if(dist <= radius) {
                float a = texture(uMaskTex, vTexCoord + vec2(x, y) * texel).a;
                
                // Campana de Gauss perfecta equivalente al difuminado del OutlinePass
                float w = exp(-(dist * dist) / (2.0 * sigma * sigma));
                glow += a * w;
                weightSum += w;
            }
        }
    }
    
    float blur = glow / weightSum;
    
    // Parámetro exacto de tu ThreeJS: uOutlinePass.edgeStrength = 5
    float edgeStrength = 5.0; 
    float finalAlpha = blur * edgeStrength;

    if (finalAlpha > 0.01) {
        // Multiplicar alpha genera el cuerpo opaco sólido de la tubería más un suavizado al caer
        fragColor = vec4(uHighlightColor, clamp(finalAlpha, 0.0, 1.0));
    } else {
        discard;
    }
}
